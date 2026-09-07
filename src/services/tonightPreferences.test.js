import { fitsPreferences, defaults, loadTonight, saveTonight, storageKey } from './tonightPreferences';
import { createTonightSession } from './tonightPicks';

test('runtime boundaries and original language match the displayed preferences', () => {
  expect(fitsPreferences({ runtime: 90, original_language: 'en' }, { ...defaults, time: 'short' })).toBe(false);
  expect(fitsPreferences({ runtime: 120, original_language: 'en' }, { ...defaults, time: 'long' })).toBe(false);
  expect(fitsPreferences({ runtime: 100, original_language: 'fr' }, { ...defaults, language: 'en' })).toBe(false);
  expect(fitsPreferences({ runtime: 100, original_language: 'fr' }, { ...defaults, language: 'fr' })).toBe(true);
  expect(fitsPreferences({ original_language: 'en' }, defaults)).toBe(false);
});

test('invalid saved preferences cannot break the page', () => {
  sessionStorage.setItem(storageKey, '{broken');
  expect(loadTonight()).toBeNull();
  saveTonight({ form: { time: 'invalid' }, activeForm: defaults, picks: [], skipped: [] });
  expect(loadTonight()).toBeNull();
  const saved = { form: defaults, activeForm: defaults, picks: [{ id: 1 }], skipped: [2], scrollY: 540 };
  saveTonight(saved);
  expect(loadTonight()).toEqual(saved);
  sessionStorage.clear();
});

test('restoring a session keeps its reserve and avoids repeating previous picks', async () => {
  const fetchPage = jest.fn().mockResolvedValue({ total_pages: 1, results: [1,2,3].map(id => ({ id, poster_path: '/p', overview: 'Movie' })) });
  const session = createTonightSession(fetchPage);
  await session.take(1, () => new Set());
  const beforeReplacement = JSON.parse(JSON.stringify(session.snapshot()));
  const restored = createTonightSession(fetchPage, beforeReplacement);
  expect((await restored.take(1, () => new Set()))[0].id).toBe(2);
  const undone = createTonightSession(fetchPage, beforeReplacement);
  expect((await undone.take(1, () => new Set()))[0].id).toBe(2);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});
