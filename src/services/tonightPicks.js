// A mood covers alternative genres, not their intersection. TMDb uses | for OR.
export const moodGenreQuery = genres => genres.split(',').join('|');

// A session keeps spare candidates ready for instant, one-card replacements.
export function createTonightSession(fetchPage, saved) {
  let page = saved?.page || 1;
  let lastPage = saved?.lastPage ?? 500;
  let pool = saved?.pool ? [...saved.pool] : [];
  const seen = new Set(saved?.seen || []);

  return {
    snapshot: () => ({ page, lastPage, pool: [...pool], seen: [...seen] }),
    async take(count, excludedIds) {
      const selected = [];
      let requests = 0;
      try {
        while (selected.length < count) {
          const excluded = excludedIds();
          pool = pool.filter(movie => !excluded.has(movie.id));
          if (pool.length) { selected.push(pool.shift()); continue; }
          // Bound each interaction; the next click can continue searching.
          if (page > lastPage || requests >= 10) break;
          const data = await fetchPage(page);
          requests += 1;
          page += 1;
          lastPage = Math.min(data.total_pages || 0, 500);
          for (const movie of data.results || []) {
            if (!seen.has(movie.id) && movie.poster_path && movie.overview) {
              seen.add(movie.id);
              pool.push(movie);
            }
          }
        }
        return selected.filter(movie => !excludedIds().has(movie.id));
      } catch (error) {
        pool.unshift(...selected);
        throw error;
      }
    }
  };
}
