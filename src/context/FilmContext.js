import React, { createContext, useContext } from 'react';
import useMovieData from '../hooks/useMovieData';
import useRecommendations from '../hooks/useRecommendations';

const FilmContext = createContext();

export const FilmProvider = ({ children }) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY;

    // Use our hooks
    const movieData = useMovieData(apiKey);
    const recommendationData = useRecommendations(apiKey, movieData.genres);

    // Watched List Logic
    const [watchedFilms, setWatchedFilms] = React.useState(() => {
        const saved = localStorage.getItem('watchedFilms');
        return saved ? JSON.parse(saved) : [];
    });

    React.useEffect(() => {
        localStorage.setItem('watchedFilms', JSON.stringify(watchedFilms));
    }, [watchedFilms]);

    const toggleWatched = (movie) => {
        setWatchedFilms(prev => {
            const exists = prev.find(m => m.id === movie.id);
            if (exists) return prev.filter(m => m.id !== movie.id);
            return [...prev, movie];
        });
    };

    const isWatched = (id) => watchedFilms.some(m => m.id === id);

    // Surprise Me Logic
    const getSurpriseFilm = async () => {
        // Fetch a random page of popular movies
        const randomPage = Math.floor(Math.random() * 10) + 1;
        try {
            // We need to use fetch directly or axios since we are inside provider
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${randomPage}`);
            const data = await response.json();
            const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
            return randomMovie;
        } catch (e) {
            console.error("Surprise failed", e);
            return null;
        }
    };

    const value = {
        apiKey,
        ...movieData,
        ...recommendationData,
        watchedFilms,
        toggleWatched,
        isWatched,
        getSurpriseFilm
    };

    return (
        <FilmContext.Provider value={value}>
            {children}
        </FilmContext.Provider>
    );
};

export const useFilm = () => {
    const context = useContext(FilmContext);
    if (!context) {
        throw new Error('useFilm must be used within a FilmProvider');
    }
    return context;
};
