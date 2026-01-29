import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useMovieData = (apiKey) => {
    const [trendingFilms, setTrendingFilms] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieOfTheMonthDetails, setMovieOfTheMonthDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);



    const fetchTrendingFilms = useCallback(async () => {
        try {
            const response = await axios.get(
                `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
            );
            const trending = response.data.results.slice(0, 3).map((movie) => ({
                id: movie.id,
                Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                Title: movie.title,
                backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
                overview: movie.overview,
                release_date: movie.release_date,
                vote_average: movie.vote_average
            }));
            setTrendingFilms(trending);
        } catch (err) {
            console.error('Error fetching trending films:', err);
            setError(err);
        }
    }, [apiKey]);

    const fetchGenres = useCallback(async () => {
        try {
            const response = await axios.get(
                `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
            );
            setGenres(response.data.genres);
        } catch (err) {
            console.error('Error fetching genres:', err);
        }
    }, [apiKey]);

    const fetchFilmOfTheMonth = useCallback(async () => {
        try {
            const response = await fetch('/filmOfTheMonth.json');
            const data = await response.json();
            const movieId = data.id;

            const [details, videos, credits] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`)
            ]);

            const trailer = videos.data.results.find(
                (video) => video.type === 'Trailer' && video.site === 'YouTube'
            );

            const directors = credits.data.crew.filter(person => person.job === 'Director');

            setMovieOfTheMonthDetails({
                ...details.data,
                trailerKey: trailer ? trailer.key : null,
                directors,
            });

        } catch (err) {
            console.error('Error fetching film of the month:', err);
        }
    }, [apiKey]);

    // Initial Data Load
    useEffect(() => {
        if (!apiKey) return;

        setIsLoading(true);
        Promise.all([
            fetchTrendingFilms(),
            fetchGenres(),
            fetchFilmOfTheMonth()
        ]).finally(() => setIsLoading(false));

    }, [apiKey, fetchTrendingFilms, fetchGenres, fetchFilmOfTheMonth]);

    return {
        trendingFilms,
        genres,
        movieOfTheMonthDetails,
        isLoading,
        error
    };
};

export default useMovieData;
