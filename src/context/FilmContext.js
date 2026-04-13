import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import useMovieData from '../hooks/useMovieData';
import useRecommendations from '../hooks/useRecommendations';
import { buildTasteProfile } from '../services/tasteProfile';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getWatchedFilms, addWatchedFilm, removeWatchedFilm } from '../firebase/watchedFilms';

const FilmContext = createContext();

export const FilmProvider = ({ children }) => {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY;

    // Auth state
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Use our hooks
    const movieData = useMovieData(apiKey);
    const recommendationData = useRecommendations(apiKey, movieData.genres);

    // Watched List Logic
    const [watchedFilms, setWatchedFilms] = React.useState(() => {
        const saved = localStorage.getItem('watchedFilms');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to localStorage on every change
    React.useEffect(() => {
        localStorage.setItem('watchedFilms', JSON.stringify(watchedFilms));
    }, [watchedFilms]);

    // When user logs in, merge Firebase watched films with local
    const loadAndMergeFirebase = useCallback(async (firebaseUser) => {
        try {
            const firebaseFilms = await getWatchedFilms(firebaseUser.uid);
            const localFilms = JSON.parse(localStorage.getItem('watchedFilms') || '[]');

            // Merge: Firebase is source of truth, add any local-only films to Firebase
            const firebaseIds = new Set(firebaseFilms.map(f => f.filmId));
            const localOnly = localFilms.filter(f => !firebaseIds.has(f.id));

            // Push local-only films to Firebase
            for (const film of localOnly) {
                await addWatchedFilm(firebaseUser.uid, film);
            }

            // Build merged list from Firebase data
            const merged = firebaseFilms.map(f => ({
                id: f.filmId,
                title: f.title,
                poster: f.posterPath ? `https://image.tmdb.org/t/p/w500${f.posterPath}` : null,
                genre_ids: f.genre_ids || [],
                release_date: f.release_date || null
            }));

            // Add any local-only films that Firebase doesn't have
            for (const film of localOnly) {
                if (!merged.find(m => m.id === film.id)) {
                    merged.push(film);
                }
            }

            setWatchedFilms(merged);
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            // Keep local data on error
        }
    }, []);

    useEffect(() => {
        if (user && !authLoading) {
            loadAndMergeFirebase(user);
        }
    }, [user, authLoading, loadAndMergeFirebase]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleWatched = async (movie) => {
        const exists = watchedFilms.find(m => m.id === movie.id);

        // Update local state immediately (optimistic)
        setWatchedFilms(prev => {
            if (exists) return prev.filter(m => m.id !== movie.id);
            return [...prev, {
                id: movie.id,
                title: movie.title || movie.Title,
                poster: movie.poster || movie.Poster || null,
                genre_ids: movie.genre_ids || movie.genres?.map(g => g.id) || [],
                release_date: movie.release_date || movie.year || null
            }];
        });

        // Sync to Firebase if logged in
        if (user) {
            try {
                if (exists) {
                    await removeWatchedFilm(user.uid, movie.id);
                } else {
                    await addWatchedFilm(user.uid, movie);
                }
            } catch (error) {
                console.error('Firebase sync error:', error);
            }
        }
    };

    const isWatched = (id) => watchedFilms.some(m => m.id === id);

    // Compute taste profile from watched films
    const tasteProfile = useMemo(() => buildTasteProfile(watchedFilms), [watchedFilms]);

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
        getSurpriseFilm,
        tasteProfile,
        user,
        authLoading,
        handleLogout
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
