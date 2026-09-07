export const timeOptions = {
  short: { label: 'Under 90 min', min: 1, max: 89 },
  medium: { label: '90–120 min', min: 90, max: 120 },
  long: { label: 'Over 2 hours', min: 121 }
};
export const moodOptions = {
  tense: { label: 'Thrills & mystery', genres: '53,80,9648' },
  funny: { label: 'Comedy', genres: '35' },
  drama: { label: 'Character drama', genres: '18' },
  imaginative: { label: 'Fantasy & sci-fi', genres: '14,878' },
  romantic: { label: 'Romance', genres: '10749' },
  adventure: { label: 'Adventure', genres: '12' },
  animation: { label: 'Animation', genres: '16' }
};
export const sortOptions = { popularity: { label: 'Most popular', query: 'popularity.desc' }, votes: { label: 'Most rated', query: 'vote_count.desc' }, rating: { label: 'Highest rated', query: 'vote_average.desc' } };
export const languageOptions = { any: 'Any language', en: 'English', fr: 'French', de: 'German', es: 'Spanish', ja: 'Japanese', ko: 'Korean', hi: 'Hindi', sr: 'Serbian', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ar: 'Arabic', da: 'Danish', sv: 'Swedish', no: 'Norwegian', tr: 'Turkish', fa: 'Persian' };
export const defaults = { time: 'medium', mood: 'tense', sort: 'votes', language: 'any' };
export const storageKey = 'filmseeker.tonight.v2';
export const languageName = code => {
  if (!code) return 'Language unavailable';
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code); } catch { return code.toUpperCase(); }
};
export function loadTonight() {
  try {
    const data = JSON.parse(sessionStorage.getItem(storageKey));
    const valid = form => form && timeOptions[form.time] && moodOptions[form.mood] && sortOptions[form.sort] && languageOptions[form.language];
    return data && valid(data.form) && valid(data.activeForm) && Array.isArray(data.picks) && Array.isArray(data.skipped) ? data : null;
  } catch { return null; }
}
export function saveTonight(data) {
  try { sessionStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* Browsing still works if storage is unavailable. */ }
}
export function fitsPreferences(movie, form) {
  const time = timeOptions[form.time];
  return Number.isFinite(movie.runtime) && movie.runtime >= time.min && (!time.max || movie.runtime <= time.max)
    && (form.language === 'any' || movie.original_language === form.language);
}
