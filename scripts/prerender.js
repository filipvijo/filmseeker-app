/* Produce route-specific HTML using the same app visitors run. A missing page
 * or failed movie fetch fails the build instead of deploying a shared fallback. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const guides = require('../src/data/movieGuides.json');
const featured = require('../public/filmOfTheMonth.json');
const root = path.resolve(__dirname, '../build');
const origin = 'https://www.filmseeker.net';
const publicPaths = ['/', '/tonight', '/chat', '/match', '/movie-guides', ...guides.map(g => `/movie-guides/${g.slug}`)];
const moviePicks = [...new Map(guides.flatMap(g => g.picks).map(p => [p.id, p])).values()];
const movieIds = [...new Set([featured.id, ...moviePicks.map(p => p.id)])];
const paths = [...publicPaths, ...movieIds.map(id => `/movie/${id}`), '/watched', '/login', '/404'];
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const deploymentRoutes = require('../vercel.json').routes;
const mime = { '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
    fs.createReadStream(file).pipe(res);
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.end(template);
  }
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const sitemap = [];
  // Save a neutral client shell for movie URLs outside the curated static set.
  const shell = template.replace(/<div id="root">[\s\S]*?<\/div>/, '<div id="root"></div>');
  fs.writeFileSync(path.join(root, 'movie-shell.html'), shell);
  fs.writeFileSync(path.join(root, 'session-shell.html'), shell.replace('</head>', '<meta data-react-helmet="true" name="robots" content="noindex, follow"></head>'));
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    for (const route of paths) {
      if (route !== '/' && route !== '/404') {
        const mapping = deploymentRoutes.find(item => item.src && new RegExp(`^${item.src}$`).test(route));
        const destination = route.replace(new RegExp(`^${mapping?.src}$`), mapping?.dest || '');
        assert.equal(destination, `${route}/index.html`, `${route}: missing static deployment route`);
      }
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Videos are not needed to render content and can keep a page busy forever.
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (/youtube|googlevideo|doubleclick/.test(request.url())) request.abort();
        else request.continue();
      });
      await page.goto(`http://127.0.0.1:${server.address().port}${route}`, { waitUntil:'networkidle2', timeout:60000 });
      const selector = route.startsWith('/movie/') ? `[data-movie-id="${route.split('/').pop()}"]` : 'main h1';
      await page.waitForSelector(selector, { timeout:25000 });
      // Wait for all CSS/motion transitions; static HTML must not hide content.
      await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
      const state = await page.evaluate(() => ({
        title: document.title,
        canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map(e => e.href),
        descriptions: [...document.querySelectorAll('meta[name="description"]')].map(e => e.content),
        robots: [...document.querySelectorAll('meta[name="robots"]')].map(e => e.content),
        headings: [...document.querySelectorAll('main h1')].map(e => e.textContent),
        text: document.querySelector('main')?.textContent || '',
        links: [...document.querySelectorAll('main a[href]')].map(e => e.getAttribute('href'))
      }));
      assert.deepEqual(errors, [], `${route}: browser error`);
      assert.equal(state.descriptions.length, 1, `${route}: description count`);
      assert.equal(state.robots.length, 1, `${route}: robots count`);
      assert.equal(state.headings.length, 1, `${route}: H1 count`);
      assert.ok(state.text.length > 100, `${route}: missing content`);
      assert.ok(!state.title.includes('Loading'), `${route}: loading title`);
      const indexable = publicPaths.includes(route) || route.startsWith('/movie/');
      if (indexable) {
        assert.deepEqual(state.canonicals, [`${origin}${route}`], `${route}: canonical mismatch`);
        assert.equal(state.robots[0], 'index, follow');
        sitemap.push(route);
      } else assert.equal(state.robots[0], 'noindex, follow');
      const guide = guides.find(g => route === `/movie-guides/${g.slug}`);
      if (guide) for (const pick of guide.picks) assert.ok(state.links.includes(`/movie/${pick.id}`), `${route}: missing movie link`);
      const pick = moviePicks.find(p => route === `/movie/${p.id}`);
      if (pick) assert.ok(state.title.startsWith(`${pick.title} (${pick.year})`), `${route}: wrong movie identity`);
      if (pick) {
        const runtime = await page.$eval('[data-runtime]', e => Number(e.dataset.runtime));
        assert.equal(runtime, pick.runtime, `${route}: update the guide's runtime to match the movie data`);
      }
      if (route.startsWith('/movie/')) {
        // Metadata verification comes from the same public TMDb response used by the app.
        const short = guides.find(g => g.slug === 'thrillers-under-90-minutes');
        if (short.picks.some(p => route === `/movie/${p.id}`)) {
          const runtime = await page.$eval('[data-runtime]', e => Number(e.dataset.runtime));
          assert.ok(runtime > 0 && runtime < 90, `${route}: runtime must be under 90`);
        }
      }
      const html = await page.content();
      const out = route === '/' ? path.join(root, 'index.html') : route === '/404' ? path.join(root, '404.html') : path.join(root, route, 'index.html');
      fs.mkdirSync(path.dirname(out), { recursive:true });
      fs.writeFileSync(out, html);
      console.log(`Verified static page: ${route}`);
      await page.close();
    }
    // Dates are deliberately omitted: build time is not content modification time.
    fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
    fs.writeFileSync(path.join(root, 'seo-verification.json'), JSON.stringify({ routes:sitemap, checked:['canonical','description','robots','h1','movie identity','short-film runtime','guide links'] }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; server.close(); });
