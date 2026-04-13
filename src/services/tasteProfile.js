/**
 * Taste Profile Service
 * Computes user taste preferences from watched films.
 * All pure functions — no side effects, no API calls.
 */

// Genre ID → Name mapping (TMDb standard)
const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
    53: 'Thriller', 10752: 'War', 37: 'Western'
};

/**
 * Extract decade from a year string or date string
 * @param {string} yearOrDate - "2004" or "2004-01-15"
 * @returns {string|null} - "2000s" or null
 */
const extractDecade = (yearOrDate) => {
    if (!yearOrDate) return null;
    const year = parseInt(yearOrDate, 10);
    if (isNaN(year)) return null;
    return `${Math.floor(year / 10) * 10}s`;
};

/**
 * Build a taste profile from an array of watched films.
 * Each film should have: { genre_ids, release_date }
 * Fields are optional — missing data is simply skipped.
 * 
 * @param {Array} watchedFilms - Array of watched film objects
 * @returns {Object} - Taste profile
 */
export const buildTasteProfile = (watchedFilms) => {
    if (!watchedFilms || watchedFilms.length === 0) {
        return null; // No data yet
    }

    // Count genres
    const genreCounts = {};
    const decadeCounts = {};
    let totalWithGenres = 0;
    let totalWithDecades = 0;

    for (const film of watchedFilms) {
        // Genre counting
        if (film.genre_ids && Array.isArray(film.genre_ids)) {
            totalWithGenres++;
            for (const genreId of film.genre_ids) {
                const name = GENRE_MAP[genreId];
                if (name) {
                    genreCounts[name] = (genreCounts[name] || 0) + 1;
                }
            }
        }

        // Decade counting
        const decade = extractDecade(film.release_date || film.year);
        if (decade) {
            totalWithDecades++;
            decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }
    }

    // Sort genres by frequency
    const sortedGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 genres

    // Sort decades by frequency
    const sortedDecades = Object.entries(decadeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3); // Top 3 decades

    // Compute percentages
    const genreProfile = sortedGenres.map(([name, count]) => ({
        name,
        count,
        percentage: totalWithGenres > 0 ? Math.round((count / totalWithGenres) * 100) : 0
    }));

    const decadeProfile = sortedDecades.map(([name, count]) => ({
        name,
        count,
        percentage: totalWithDecades > 0 ? Math.round((count / totalWithDecades) * 100) : 0
    }));

    return {
        totalFilms: watchedFilms.length,
        genres: genreProfile,
        decades: decadeProfile,
        hasEnoughData: totalWithGenres >= 3 // Need at least 3 films with genre data
    };
};

/**
 * Format a taste profile into a compact string for the AI system prompt.
 * Returns empty string if profile is null or not enough data.
 * 
 * @param {Object|null} profile - Taste profile from buildTasteProfile
 * @returns {string} - Formatted string for system prompt
 */
export const formatProfileForPrompt = (profile) => {
    if (!profile || !profile.hasEnoughData) {
        return '';
    }

    const lines = [];
    lines.push(`Based on ${profile.totalFilms} films the user has watched:`);

    if (profile.genres.length > 0) {
        const genreStr = profile.genres
            .map(g => `${g.name} (${g.percentage}%)`)
            .join(', ');
        lines.push(`- Preferred genres: ${genreStr}`);
    }

    if (profile.decades.length > 0) {
        const decadeStr = profile.decades
            .map(d => `${d.name} (${d.percentage}%)`)
            .join(', ');
        lines.push(`- Preferred eras: ${decadeStr}`);
    }

    lines.push('Prioritize recommendations that match these patterns, but include 1 wildcard pick that breaks the pattern for variety.');

    return lines.join('\n');
};
