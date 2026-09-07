import { createTonightSession, moodGenreQuery } from './tonightPicks';

const movie = id => ({ id, title: `Film ${id}`, poster_path: '/poster.jpg', overview: 'A movie.' });
test('returns six unique unwatched picks and replaces from the reserve without another request', async () => {
  const fetchPage = jest.fn().mockResolvedValue({ total_pages: 1, results: [movie(1), movie(1), ...Array.from({ length: 12 }, (_, i) => movie(i + 2))] });
  const excluded = new Set([1, 3]);
  const session = createTonightSession(fetchPage);
  const first = await session.take(6, () => excluded);
  expect(first.map(m => m.id)).toEqual([2, 4, 5, 6, 7, 8]);
  first.forEach(m => excluded.add(m.id));
  const next = await session.take(1, () => excluded);
  expect(next[0].id).toBe(9);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});

test('continues beyond a page of already watched films', async () => {
  const fetchPage = jest.fn(page => Promise.resolve({ total_pages: 2, results: page === 1 ? [movie(1)] : Array.from({ length: 6 }, (_, i) => movie(i + 2)) }));
  const session = createTonightSession(fetchPage);
  expect(await session.take(6, () => new Set([1]))).toHaveLength(6);
  expect(fetchPage).toHaveBeenNthCalledWith(2, 2);
});

test('does not repeat candidates across pages or invent picks when exhausted', async () => {
  const session = createTonightSession(page => Promise.resolve({ total_pages: 2, results: page === 1 ? [movie(1), movie(2)] : [movie(1), movie(3)] }));
  expect((await session.take(6, () => new Set())).map(m => m.id)).toEqual([1, 2, 3]);
  expect(await session.take(1, () => new Set())).toEqual([]);
});

test('retries a failed page without losing the candidates already collected', async () => {
  const fetchPage = jest.fn().mockResolvedValueOnce({ total_pages: 2, results: [movie(1)] }).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ total_pages: 2, results: [movie(2)] });
  const session = createTonightSession(fetchPage);
  await expect(session.take(2, () => new Set())).rejects.toThrow('offline');
  expect((await session.take(2, () => new Set())).map(m => m.id)).toEqual([1, 2]);
  expect(fetchPage).toHaveBeenNthCalledWith(3, 2);
});

test('rechecks watched films before using cached replacements', async () => {
  const session = createTonightSession(() => Promise.resolve({ total_pages: 1, results: [movie(1), movie(2), movie(3)] }));
  await session.take(1, () => new Set());
  expect((await session.take(1, () => new Set([2])))[0].id).toBe(3);
});

test('moods match alternative genres without requiring all of them together', () => {
  expect(moodGenreQuery('14,878,9648')).toBe('14|878|9648');
  expect(moodGenreQuery('53,80,9648')).toBe('53|80|9648');
  expect(moodGenreQuery('35')).toBe('35');
});
