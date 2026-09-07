# 🎬 FilmSeeker

## Search pages and local review

Run `npm ci`, configure the existing Firebase, TMDb, and chat environment variables in `.env.local`, then run `npm run build` and `npm run preview`. The preview defaults to `http://localhost:3000`; set `PORT` to use a different free port. It serves the production HTML and the local chat proxy, and marks local responses `noindex` through an HTTP header. Never commit environment files.

The production build now prerenders the homepage, dedicated Tonight Mode page, chat introduction, match introduction, movie-guide hub, three curated guides, and their selected movie detail pages. Puppeteer uses a fresh anonymous browser; no user lists or shared sessions enter the sitemap. Prerendering is mandatory: a failed render, incorrect canonical, wrong movie identity, or changed runtime fails the build. `npm test -- --watchAll=false` checks metadata transitions and indexing rules.

`src/components/Seo.js` owns route metadata; do not add route-specific canonical tags to `public/index.html`. Movie pages outside the curated set retain client rendering with their own metadata after the movie loads. Invalid movie responses use a noindex error state; unknown site routes return HTTP 404. Temporary API failures display an unavailable state rather than pretending the film does not exist.

Edit guides in `src/data/movieGuides.json`. When adding a guide or changing the featured movie, update the explicit static routes in `vercel.json` too; the build verifies that these mappings agree. Keep runtimes and release years aligned with TMDb. The generated sitemap includes only the public prerendered routes. It deliberately omits `lastmod` rather than presenting a deployment date as a content-change date.

The browser mounts the interactive app over the readable static snapshot, rather than hydrating anonymous build-time auth and recommendation state. Movie APIs remain necessary for interactive movie detail pages; the static response remains available without JavaScript.

After an approved deployment, verify direct HTTP responses for `/chat`, a guide, a curated movie, and a nonexistent path. Submit `/sitemap.xml` in Google Search Console, then use URL Inspection to compare the declared canonical, Google's selected canonical, and rendered HTML. Search indexing and rankings are not guaranteed by the build checks.

**FilmSeeker** is a smart and stylish web app that helps users discover the perfect movie based on mood, preferences, and hidden gems. Built with React and designed with a clean user-first approach, it's your AI-powered cinema companion.

## 🚀 Features

- 🎭 AI-powered film recommendations
- 🔍 Search by genre, mood, or keyword
- 🌙 Dark/light theme toggle
- 🧠 Personalized suggestions with a clean UX
- 🖼️ Movie posters and trailers preview (via TMDb API)

## 🛠 Tech Stack

- **Frontend:** React, TailwindCSS
- **API Integration:** TMDb API
- **State Management:** React Context
- **Hosting:** Vercel (or Netlify)

![filmseeker](https://github.com/user-attachments/assets/51fa0ee5-5975-4d72-b59f-a77798b18386)


## 🌐 Live Demo
filmseeker.net

Runs the app in development mode. Visit http://localhost:3000.

🤝 Credits
Movie data provided by The Movie Database (TMDb).

✨ Author
Made with ❤️ by Filip 
Freelance Full Stack Dev | AI Tools | UX & Visual Design


Tonight Mode (`/tonight`) returns six unwatched films, caches spare candidates for one-card replacement, and loads additional discovery pages when needed. Its Already watched control uses the shared Watched list, including local persistence and existing signed-in synchronization. Narrow filters can exhaust the available matches; the page explains when fewer than six can be found.
