// Local production preview, including route status codes and the existing chat API.
const express = require('express');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../build');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const app = express();
const routes = require('../vercel.json').routes;
app.use((req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex'); next(); });
require('../src/setupProxy')(app);
app.use(express.static(root, { redirect:false }));
for (const route of routes) {
  if (!route.src) continue;
  app.get(new RegExp(`^${route.src}$`), (req, res) => {
    const match = req.path.match(new RegExp(`^${route.src}$`));
    const substitute = value => value.replace(/\$(\d+)/g, (_, n) => match[Number(n)] || '');
    if (route.headers?.Location) return res.redirect(route.status, substitute(route.headers.Location));
    if (!route.dest) return res.sendStatus(404);
    const file = path.join(root, substitute(route.dest));
    res.status(route.status || 200).sendFile(fs.existsSync(file) ? file : path.join(root, '404.html'));
  });
}
app.listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`FilmSeeker preview: http://localhost:${process.env.PORT || 3000}`));
