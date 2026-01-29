import { useState, useCallback } from 'react';
import axios from 'axios';

// Map language names to ISO 639-1 codes for TMDb API
const languageMap = {
    '': '',
    arabic: 'ar',
    chinese: 'zh',
    czech: 'cs',
    danish: 'da',
    dutch: 'nl',
    english: 'en',
    finnish: 'fi',
    french: 'fr',
    german: 'de',
    greek: 'el',
    hebrew: 'he',
    hindi: 'hi',
    hungarian: 'hu',
    indonesian: 'id',
    italian: 'it',
    japanese: 'ja',
    korean: 'ko',
    norwegian: 'no',
    persian: 'fa',
    polish: 'pl',
    portuguese: 'pt',
    romanian: 'ro',
    russian: 'ru',
    serbian: 'sr',
    slovak: 'sk',
    spanish: 'es',
    swedish: 'sv',
    thai: 'th',
    turkish: 'tr',
    ukrainian: 'uk',
    vietnamese: 'vi',
};

const useRecommendations = (apiKey, genres) => {
    const [preferences, setPreferences] = useState({
        genre: '',
        duration: '',
        decade: '',
        language: '',
        actor: '',
        director: ''
    });

    const [recommendations, setRecommendations] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const updatePreference = (key, value) => {
        if (key === 'genre') {
            setPreferences(prev => {
                const current = prev.genre ? prev.genre.split(',') : [];
                const valStr = value.toString();

                if (current.includes(valStr)) {
                    // Remove
                    return { ...prev, genre: current.filter(id => id !== valStr).join(',') };
                } else {
                    // Add
                    return { ...prev, genre: [...current, valStr].join(',') };
                }
            });
        } else {
            setPreferences(prev => ({ ...prev, [key]: value }));
        }
    };

    const getRecommendations = useCallback(async (watchedFilmIds = new Set()) => {
        setIsSearching(true);
        setRecommendations([]);
        setSearchError(null);

        const { genre, duration, decade, language, actor, director } = preferences;

        // If no specific preferences, we just default to general popularity discovery
        // const hasPreferences = genre || duration || decade || language || actor.trim() || director.trim();

        // if (!hasPreferences) {
        //    // Optional: decided to allow open browsing
        // }

        try {
            // --- 1. Resolve Actor/Director IDs if present ---
            let actorId = '';
            if (actor.trim()) {
                const res = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actor)}`);
                actorId = res.data.results[0]?.id || '';
            }

            // --- 2. Build Query Filters ---
            // Just building the base discovery URL params
            let queryParams = `sort_by=popularity.desc&include_adult=false&include_video=false&page=1`;

            if (genre) queryParams += `&with_genres=${genre}`;
            if (actorId) queryParams += `&with_cast=${actorId}`;

            if (decade) {
                queryParams += `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31`;
            }

            if (language && languageMap[language.toLowerCase()]) {
                queryParams += `&with_original_language=${languageMap[language.toLowerCase()]}`;
            }

            if (duration) {
                if (duration === 'short') queryParams += '&with_runtime.lte=90';
                else if (duration === 'medium') queryParams += '&with_runtime.gte=90&with_runtime.lte=120';
                else if (duration === 'long') queryParams += '&with_runtime.gte=120';
            }

            // --- 3. Fetch Data (Get multiple pages for better variety) ---
            // Note: Runtime filtering often needs 'with_runtime' which discovers supports, 
            // but strict checking is better done client side if API is fuzzy.

            // Fetching 2 pages to get a good pool of candidates
            const requests = [1, 2].map(page =>
                axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&${queryParams}&page=${page}`)
            );

            const responses = await Promise.all(requests);
            let candidates = responses.flatMap(r => r.data.results);

            // --- 4. Client-side Filtering & Deduplication ---
            // Filter out watched films
            candidates = candidates.filter(movie => !watchedFilmIds.has(movie.id.toString()));

            // Deduplicate
            candidates = Array.from(new Map(candidates.map(m => [m.id, m])).values());

            // --- 5. Final Selection ---
            // Shuffle and pick top 12
            const shuffled = candidates.sort(() => 0.5 - Math.random());
            const finalSelection = shuffled.slice(0, 12).map(m => ({
                id: m.id,
                Title: m.title,
                Poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                ...m
            }));

            if (finalSelection.length === 0) {
                setSearchError("No movies found matching those specific criteria. Try broadening your search.");
            } else {
                setRecommendations(finalSelection);
            }

        } catch (err) {
            console.error("Search failed", err);
            setSearchError("Failed to fetch recommendations. Please check your connection.");
        } finally {
            setIsSearching(false);
        }

    }, [apiKey, preferences]);

    return {
        preferences,
        updatePreference,
        recommendations,
        isSearching,
        searchError,
        getRecommendations
    };
};

export default useRecommendations;
