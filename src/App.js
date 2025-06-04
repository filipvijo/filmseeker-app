import React, { useState, useEffect } from 'react';
import './App.css';
import './components/ActionButtons.css'; // Import the ActionButtons CSS
import axios from 'axios';
import { db } from './firebase'; // Import Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import logo from './logo.png';
import iconGenre from './icon-genre.png';
import iconMood from './icon-mood.png';
import iconLength from './icon-length.png';
import iconLanguage from './icon-language.png';
import iconActor from './icon-actor.png';
import iconDirector from './icon-director.png';
import xIcon from './x-icon.png';
import facebookIcon from './facebook-icon.png';
import whatsappIcon from './whatsapp-icon.png';
import instagramIcon from './instagram-icon.png';
import tipIcon from './tip-icon.png';
import drFilmBotIllustration from './dr-filmbot-illustration.png'; // Import your illustration
import FilmOfMonth from './components/FilmOfMonth';
import WatchedFilmsPage from './components/WatchedFilmsPage';
import { auth } from './firebase';
import Login from './Login';
import { onAuthStateChanged } from 'firebase/auth';
import { addWatchedFilm, getWatchedFilms } from './firebase/watchedFilms';

// Import our new components
import SectionTitle from './components/SectionTitle';
import Button from './components/Button';

import Modal from './components/Modal';
import MoviePoster from './components/MoviePoster';

// Helper function to convert a string to a URL-friendly slug
// eslint-disable-next-line no-unused-vars
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphen
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

// Helper function to generate smart search URLs for streaming platforms
const generateSmartSearchUrl = (provider, movieDetails) => {
  try {
    const title = movieDetails.title || '';
    const releaseYear = movieDetails.release_date ? movieDetails.release_date.split('-')[0] : '';

    // Default URL (fallback) - links to JustWatch search
    let url = `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;

    // Map provider IDs to their respective search URLs
    switch(provider.provider_id) {
      // Netflix
      case 8:
        url = `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
        break;

      // Amazon Prime
      case 9:
        url = `https://www.amazon.com/s?k=${encodeURIComponent(title + ' ' + releaseYear)}&i=instant-video`;
        break;

      // Disney+
      case 337:
        url = `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`;
        break;

      // HBO Max/Max
      case 384:
        url = `https://play.max.com/search?q=${encodeURIComponent(title)}`;
        break;

      // Hulu
      case 15:
        url = `https://www.hulu.com/search?q=${encodeURIComponent(title)}`;
        break;

      // Apple TV+
      case 2:
        url = `https://tv.apple.com/search?term=${encodeURIComponent(title)}`;
        break;

      // Paramount+
      case 531:
        url = `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`;
        break;

      // Peacock
      case 386:
        url = `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`;
        break;

      // Default to JustWatch search (already set as default)
      default:
        // URL is already set to JustWatch search by default
        break;
    }

    return url;
  } catch (error) {
    console.error('Error generating smart search URL:', error);
    // Fallback to JustWatch if anything goes wrong
    return `https://www.justwatch.com/us/search?q=${encodeURIComponent(movieDetails.title || '')}`;
  }
};

function App() {
  // States for movie preferences and recommendations
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [decade, setDecade] = useState('');
  const [language, setLanguage] = useState('');
  const [actor, setActor] = useState('');
  const [director, setDirector] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [trendingFilms, setTrendingFilms] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMovieOfTheMonth, setShowMovieOfTheMonth] = useState(false);
  const [movieOfTheMonthDetails, setMovieOfTheMonthDetails] = useState(null);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // Dr FilmBot States
  const [drFilmBotUserInput, setDrFilmBotUserInput] = useState('');
  const [drFilmBotSuggestions, setDrFilmBotSuggestions] = useState([]);
  const [isDrFilmBotLoading, setIsDrFilmBotLoading] = useState(false);
  const [watchedFilms, setWatchedFilms] = useState([]);
  const [watchedFilmIds, setWatchedFilmIds] = useState(new Set());
  const [showWatchedFilms, setShowWatchedFilms] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);

  const [message, setMessage] = useState('');

  // User State
  const [user, setUser] = useState(null);

  // TMDB API key from your .env file
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // Map language names to ISO codes (preserving your additions)
  const languageMap = {
    '': '',
    english: 'en',
    french: 'fr',
    spanish: 'es',
    german: 'de',
    korean: 'ko',
    japanese: 'ja',
    arabic: 'ar',
    farsi: 'fa',
    russian: 'ru',
    serbian: 'sr',
    chinese: 'zh',
    thai: 'th',
    danish: 'da',
    swedish: 'sv',
    norwegian: 'no',
    italian: 'it',
    hebrew: 'he',
    indian: 'hi',
    portuguese: 'pt',    // Added
    armenian: 'hy',      // Added
    finnish: 'fi',       // Added
    hungarian: 'hu',     // Added
    bulgarian: 'bg',     // Added
    romanian: 'ro',      // Added
    mongolian: 'mn',     // Added
    vietnamese: 'vi',    // Added
    lithuanian: 'lt',    // Added
    estonian: 'et',      // Added
    latvian: 'lv',       // Added
    slovak: 'sk',        // Added
    czech: 'cs',         // Corrected from "cech" to "czech"
    turkish: 'tr',       // Added
    albanian: 'sq',      // Added
    slovenian: 'sl',     // Added
    moldavian: 'ro',     // Added (mapped to Romanian as per ISO standard)
  };

  // useEffect on Mount
  useEffect(() => {
    const fetchTrendingFilms = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
        );
        const trending = response.data.results.slice(0, 3).map((movie) => ({
          id: movie.id,
          Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          Title: movie.title,
        }));
        setTrendingFilms(trending);
      } catch (error) {
        console.error('Error fetching trending films:', error);
      }
    };

    const fetchFilmOfTheMonth = async () => {
      try {
        const response = await fetch('/filmOfTheMonth.json');
        const data = await response.json();
        const movieId = data.id;
        const timestamp = new Date().getTime();
        const detailsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&_=${timestamp}`
        );
        const videosResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&_=${timestamp}`
        );
        // Fetch credits information (cast and crew)
        const creditsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}&_=${timestamp}`
        );
        // Fetch streaming providers
        const providersResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}&_=${timestamp}`
        );

        const trailer = videosResponse.data.results.find(
          (video) => video.type === 'Trailer' && video.site === 'YouTube'
        );

        // Extract director, writers, and top cast
        const directors = creditsResponse.data.crew.filter(person => person.job === 'Director');
        const writers = creditsResponse.data.crew.filter(person =>
          person.job === 'Screenplay' || person.job === 'Writer' || person.job === 'Story'
        );
        const topCast = creditsResponse.data.cast.slice(0, 5); // Get top 5 cast members

        // Extract streaming providers (prioritize US, then fall back to any available country)
        let streamingServices = [];
        const providerResults = providersResponse.data.results;
        if (providerResults) {
          const country = providerResults['US'] ? 'US' : Object.keys(providerResults)[0];
          const providerData = country ? providerResults[country] : null;

          if (providerData) {
            // Combine flatrate, rent and buy providers
            const allProviders = [];
            if (providerData.flatrate) allProviders.push(...providerData.flatrate);
            if (providerData.rent) allProviders.push(...providerData.rent);
            if (providerData.buy) allProviders.push(...providerData.buy);

            // Remove duplicates by provider_id
            const uniqueProviders = allProviders.filter((provider, index, self) =>
              index === self.findIndex((p) => p.provider_id === provider.provider_id)
            );

            streamingServices = uniqueProviders.map(provider => ({
              name: provider.provider_name,
              logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`,
              url: generateSmartSearchUrl(provider, detailsResponse.data),
              provider_id: provider.provider_id
            }));
          }
        }

        // If no streaming services found, add a fallback to JustWatch search
        if (streamingServices.length === 0) {
          streamingServices = [{
            name: "Find on JustWatch",
            logo: "https://www.justwatch.com/appassets/img/logo/JustWatch-logo-large.webp",
            url: `https://www.justwatch.com/us/search?q=${encodeURIComponent(detailsResponse.data.title)}`,
            provider_id: "justwatch"
          }];
        }

        setMovieOfTheMonthDetails({
          ...detailsResponse.data,
          trailerKey: trailer ? trailer.key : null,
          directors,
          writers,
          topCast,
          streamingServices
        });
      } catch (error) {
        console.error('Error fetching Film of the Month:', error);
        setMovieOfTheMonthDetails({ error: 'Failed to load Film of the Month details.' });
      }
    };

    const fetchGenres = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`
        );
        setGenres(response.data.genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    // Load preferences from localStorage on mount
    const savedGenre = localStorage.getItem('genre') || '';
    const savedDuration = localStorage.getItem('duration') || '';
    const savedDecade = localStorage.getItem('decade') || '';
    const savedLanguage = localStorage.getItem('language') || '';
    const savedActor = localStorage.getItem('actor') || '';
    const savedDirector = localStorage.getItem('director') || '';

    setGenre(savedGenre);
    setDuration(savedDuration);
    setDecade(savedDecade);
    setLanguage(savedLanguage);
    setActor(savedActor);
    setDirector(savedDirector);

    fetchTrendingFilms();
    fetchFilmOfTheMonth();
    fetchGenres();
  }, [API_KEY]);

  useEffect(() => {
    localStorage.setItem('genre', genre);
    localStorage.setItem('duration', duration);
    localStorage.setItem('decade', decade);
    localStorage.setItem('language', language);
    localStorage.setItem('actor', actor);
    localStorage.setItem('director', director);
  }, [genre, duration, decade, language, actor, director]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // If user is authenticated, fetch their watched films
      if (currentUser) {
        fetchUserWatchedFilms(currentUser.uid);
      } else {
        // Reset watched films if user logs out
        setWatchedFilms([]);
        setWatchedFilmIds(new Set());
      }
    });
    return () => unsubscribe();
  }, []);

  // For debugging
  useEffect(() => {
    if (movieOfTheMonthDetails && movieOfTheMonthDetails.streamingServices) {
      console.log('Streaming Services:', movieOfTheMonthDetails.streamingServices);
    }
  }, [movieOfTheMonthDetails]);

  // Fetch user's watched films
  const fetchUserWatchedFilms = async (userId) => {
    try {
      let films = [];
      let filmIds = new Set();

      // Try to get films from Firebase
      try {
        films = await getWatchedFilms(userId);
        filmIds = new Set(films.map(film => film.filmId));
      } catch (firebaseError) {
        console.error('Error fetching watched films from Firebase:', firebaseError);

        // If Firebase fails, get films from localStorage
        const localWatchedFilms = localStorage.getItem('watchedFilms');
        if (localWatchedFilms) {
          const parsedFilms = JSON.parse(localWatchedFilms);
          films = parsedFilms.map(film => ({
            id: film.id,
            filmId: film.id,
            title: film.title,
            posterPath: film.poster,
            addedAt: new Date(film.addedAt)
          }));

          filmIds = new Set(parsedFilms.map(film => film.id.toString()));
        }
      }

      setWatchedFilms(films);
      setWatchedFilmIds(filmIds);
    } catch (error) {
      console.error('Error fetching watched films:', error);
      // If there's a Firebase permission error, we'll just continue with the current state
      // This allows the app to function even if Firebase permissions are not set up correctly
    }
  };

  // Mark a film as watched
  const markFilmAsWatched = async (film, event) => {
    if (!user) {
      alert('Please sign in to mark films as watched');
      return;
    }

    // Add animation class to the button
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('watched-button-clicked');

      // Remove the animation class after the animation completes
      setTimeout(() => {
        if (event.currentTarget) {
          event.currentTarget.classList.remove('watched-button-clicked');
        }
      }, 1000); // Increased from 500ms to 1000ms for better visibility
    }

    try {
      setIsMarkingWatched(true);

      try {
        // Add film to watched list in Firestore
        await addWatchedFilm(user.uid, film);

        // Update local state
        await fetchUserWatchedFilms(user.uid);
      } catch (firebaseError) {
        console.error('Firebase error:', firebaseError);

        // If there's a Firebase permission error, we'll handle it locally
        // Add the film ID to the local watchedFilmIds set
        setWatchedFilmIds(prev => {
          const newSet = new Set(prev);
          newSet.add(film.id.toString());
          return newSet;
        });

        // Also store in localStorage as a fallback
        const localWatchedFilms = localStorage.getItem('watchedFilms');
        let watchedFilmsArray = [];

        if (localWatchedFilms) {
          watchedFilmsArray = JSON.parse(localWatchedFilms);
        }

        // Check if film is already in the array
        if (!watchedFilmsArray.some(watchedFilm => watchedFilm.id === film.id)) {
          watchedFilmsArray.push({
            id: film.id,
            title: film.title,
            poster: film.poster,
            addedAt: new Date().toISOString()
          });

          localStorage.setItem('watchedFilms', JSON.stringify(watchedFilmsArray));
        }
      }

      // Remove the film from DrFilmBot suggestions
      setDrFilmBotSuggestions(prevSuggestions =>
        prevSuggestions.filter(suggestion => suggestion.id !== film.id)
      );

      // Remove the film from regular recommendations
      setRecommendations(prevRecommendations =>
        prevRecommendations.filter(rec => rec.id !== film.id)
      );

      setIsMarkingWatched(false);
    } catch (error) {
      console.error('Error marking film as watched:', error);
      setIsMarkingWatched(false);
    }
  };

  // Check if a film is in the user's watched list
  const checkIfWatched = (filmId) => {
    return watchedFilmIds.has(filmId.toString());
  };

  // Toggle watched films page
  const toggleWatchedFilmsPage = () => {
    setShowWatchedFilms(!showWatchedFilms);
  };

  // getRecommendations (Updated for 16 suggestions with original language logic)
  const getRecommendations = async () => {
    console.log('getRecommendations called with preferences:', {
      genre,
      duration,
      decade,
      language,
      actor,
      director
    });

    setIsLoading(true);
    setRecommendations([]);

    const trimmedActor = actor.trim();
    const trimmedDirector = director.trim();
    const hasPreferences =
      genre || duration || decade || language || trimmedActor || trimmedDirector;

    console.log('Has preferences:', hasPreferences);

    if (!hasPreferences) {
      setRecommendations([
        {
          id: null,
          Poster: null,
          Title: 'Please enter at least one preference to get recommendations.',
        },
      ]);
      setIsLoading(false);
      return;
    }

    // Check if API key is available
    if (!API_KEY) {
      console.error('TMDB API key is missing');
      setRecommendations([
        {
          id: null,
          Poster: null,
          Title: 'API key is missing. Please check configuration.',
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      let actorId = '';
      if (trimmedActor) {
        const actorResponse = await axios.get(
          `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(trimmedActor)}`
        );
        actorId = actorResponse.data.results[0]?.id || '';
      }

      let directedMovies = [];
      let directorId = '';
      if (trimmedDirector) {
        const directorResponse = await axios.get(
          `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(trimmedDirector)}`
        );
        const directorResult = directorResponse.data.results.find((person) =>
          person.name.toLowerCase() === trimmedDirector.toLowerCase() ||
          person.known_for_department.toLowerCase().includes("directing")
        );
        directorId = directorResult?.id || '';
        if (directorId) {
          const creditsResponse = await axios.get(
            `https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=${API_KEY}`
          );
          directedMovies = creditsResponse.data.crew
            .filter((credit) => credit.job === "Director")
            .map((credit) => credit.id)
            .map(async (movieId) => {
              try {
                const detailsResponse = await axios.get(
                  `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
                );
                const directors = detailsResponse.data.credits.crew
                  .filter((crew) => crew.job === "Director")
                  .map((d) => d.id);
                if (
                  directors.length > 0 &&
                  directors.includes(parseInt(directorId))
                ) {
                  return {
                    id: movieId,
                    title: detailsResponse.data.title,
                    poster_path: detailsResponse.data.poster_path,
                    release_date: detailsResponse.data.release_date,
                    original_language: detailsResponse.data.original_language,
                    genres: detailsResponse.data.genres.map((g) => g.id),
                    cast: detailsResponse.data.credits.cast.map((c) => c.id),
                    runtime: detailsResponse.data.runtime || 0,
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error verifying movie ${movieId}:`, error);
                return null;
              }
            });
          directedMovies = await Promise.all(
            directedMovies.filter((result) => result !== null)
          );
        }
      }

      let allResults = directedMovies;
      if (!trimmedDirector) {
        // Find genre ID with better error handling
        let genreId = '';
        if (genre) {
          // Genre is already stored as ID from the select dropdown
          genreId = genre;
          const foundGenre = genres.find((g) => g.id.toString() === genre.toString());
          if (foundGenre) {
            console.log('Found genre:', foundGenre.name, 'with ID:', genreId);
          } else {
            console.warn('Genre ID not found:', genre, 'Available genres:', genres.map(g => `${g.name} (${g.id})`));
          }
        }

        const decadeFilter = decade
          ? `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31`
          : '';

        // Language filter with better error handling
        let languageFilter = '';
        if (language) {
          const languageCode = languageMap[language.toLowerCase()];
          if (languageCode) {
            languageFilter = `&with_original_language=${languageCode}`;
            console.log('Language filter applied:', language, '->', languageCode);
          } else {
            console.warn('Language not found in mapping:', language);
          }
        }

        const actorFilter = actorId ? `&with_cast=${actorId}` : '';
        const durationFilter = {
          short: '&with_runtime.lte=90',
          medium: '&with_runtime.gte=90&with_runtime.lte=120',
          long: '&with_runtime.gte=120',
        }[duration.toLowerCase()] || '';

        console.log('Filters applied:', {
          genreId,
          decadeFilter,
          languageFilter,
          actorFilter,
          durationFilter
        });

        for (let page = 1; page <= 3; page++) {
          const query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}` +
            `${genreId ? `&with_genres=${genreId}` : ''}` +
            `${decadeFilter}${languageFilter}${actorFilter}${durationFilter}` +
            `&sort_by=popularity.desc&page=${page}`;

          console.log(`Making API call for page ${page}:`, query);

          try {
            const response = await axios.get(query);
            console.log(`Page ${page} results:`, response.data.results.length, 'movies');
            allResults = [...allResults, ...response.data.results];
          } catch (apiError) {
            console.error(`Error fetching page ${page}:`, apiError);
            // Continue with other pages even if one fails
          }
        }
      }

      const moviesWithDetails = await Promise.all(
        allResults.map(async (movie) => {
          if (movie.runtime) return movie;
          try {
            const detailsResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
            );
            return {
              ...movie,
              runtime: detailsResponse.data.runtime || 0,
              genres: detailsResponse.data.genres.map((g) => g.id),
              cast: detailsResponse.data.credits.cast.map((c) => c.id),
            };
          } catch (error) {
            console.error(`Error fetching details for movie ${movie.id}:`, error);
            return null;
          }
        })
      );

      const validMovies = moviesWithDetails.filter((movie) => movie !== null);
      console.log('Valid movies before filtering:', validMovies.length);

      // Get genre ID for filtering (same logic as above)
      let genreIdForFiltering = '';
      if (genre) {
        // Genre is already stored as ID from the select dropdown
        genreIdForFiltering = parseInt(genre);
        console.log('Using genre ID for filtering:', genreIdForFiltering);
      }

      const filteredResults = validMovies.filter((movie) => {
        const runtime = movie.runtime || 0;
        const matchesDuration = duration.toLowerCase() === 'short'
          ? runtime > 0 && runtime <= 90
          : duration.toLowerCase() === 'medium'
          ? runtime >= 90 && runtime <= 120
          : duration.toLowerCase() === 'long'
          ? runtime >= 120
          : true;
        const matchesDecade = decade
          ? (movie.release_date &&
            movie.release_date.substring(0, 4) >= decade &&
            movie.release_date.substring(0, 4) <= (parseInt(decade) + 9))
          : true;
        const matchesGenre = genre ? (movie.genres && movie.genres.includes(genreIdForFiltering)) : true;
        const matchesLanguage = language
          ? movie.original_language === languageMap[language.toLowerCase()]
          : true;
        const matchesActor = actorId ? (movie.cast && movie.cast.includes(parseInt(actorId))) : true;

        const matches = matchesDuration && matchesDecade && matchesGenre && matchesLanguage && matchesActor;

        // Only log filtered out movies if we want to debug
        if (!matches && (genre || language || duration || decade)) {
          console.log('Movie filtered out:', movie.title, 'Reasons:', {
            genre: !matchesGenre ? 'genre mismatch' : 'ok',
            language: !matchesLanguage ? 'language mismatch' : 'ok',
            duration: !matchesDuration ? 'duration mismatch' : 'ok',
            decade: !matchesDecade ? 'decade mismatch' : 'ok'
          });
        }

        return matches;
      }).slice(0, 16);  // Changed from 10 to 16

      console.log('Filtered results:', filteredResults.length);

      // Filter out watched movies
      const unwatchedResults = filteredResults.filter(movie => !checkIfWatched(movie.id));
      console.log('Unwatched results:', unwatchedResults.length);

      if (unwatchedResults.length === 0) {
        if (filteredResults.length > 0) {
          setRecommendations([{ id: null, Poster: null, Title: 'You\'ve watched all movies matching your criteria! Try adjusting your preferences for new recommendations.' }]);
        } else {
          setRecommendations([{ id: null, Poster: null, Title: 'No movies found matching your criteria. Try adjusting your preferences.' }]);
        }
      } else {
        setRecommendations(unwatchedResults.map((movie) => ({
          id: movie.id,
          Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          Title: movie.title,
        })));
      }
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      setRecommendations([{ id: null, Poster: null, Title: 'Error loading recommendations' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // getRandomRecommendation
  const getRandomRecommendation = async () => {
    setIsLoading(true);
    setRecommendations([]);
    try {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const response = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${randomPage}`
        );
        const movies = response.data.results;

        if (movies.length > 0) {
          // Filter out watched movies
          const unwatchedMovies = movies.filter(movie => !checkIfWatched(movie.id));

          if (unwatchedMovies.length > 0) {
            const randomMovie = unwatchedMovies[Math.floor(Math.random() * unwatchedMovies.length)];
            setRecommendations([
              {
                id: randomMovie.id,
                Poster: randomMovie.poster_path ? `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}` : null,
                Title: randomMovie.title,
              },
            ]);
            break;
          }
        }

        attempts++;
      }

      // If we couldn't find any unwatched movies after max attempts
      if (attempts >= maxAttempts) {
        setRecommendations([{ id: null, Poster: null, Title: 'Try adjusting your preferences - you might have watched most popular movies!' }]);
      }
    } catch (error) {
      console.error('Error fetching random recommendation:', error);
      setRecommendations([{ id: null, Poster: null, Title: 'Error loading random recommendation. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // fetchMovieDetails
  const fetchMovieDetails = async (movieId) => {
    try {
      const timestamp = new Date().getTime();
      const detailsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&_=${timestamp}&append_to_response=credits`
      );
      const videosResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&_=${timestamp}`
      );
      // Fetch streaming providers
      const providersResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}&_=${timestamp}`
      );

      if (detailsResponse.data.id !== movieId) {
        throw new Error(`Movie ID mismatch: requested ${movieId}, received ${detailsResponse.data.id}`);
      }

      const trailer = videosResponse.data.results.find(
        (video) => video.type === 'Trailer' && video.site === 'YouTube'
      );

      // Extract streaming providers (prioritize US, then fall back to any available country)
      let streamingServices = [];
      const providerResults = providersResponse.data.results;
      if (providerResults) {
        const country = providerResults['US'] ? 'US' : Object.keys(providerResults)[0];
        const providerData = country ? providerResults[country] : null;

        if (providerData) {
          // Combine flatrate, rent and buy providers
          const allProviders = [];
          if (providerData.flatrate) allProviders.push(...providerData.flatrate);
          if (providerData.rent) allProviders.push(...providerData.rent);
          if (providerData.buy) allProviders.push(...providerData.buy);

          // Remove duplicates by provider_id
          const uniqueProviders = allProviders.filter((provider, index, self) =>
            index === self.findIndex((p) => p.provider_id === provider.provider_id)
          );

          streamingServices = uniqueProviders.map(provider => ({
            name: provider.provider_name,
            logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`,
            url: generateSmartSearchUrl(provider, detailsResponse.data),
            provider_id: provider.provider_id
          }));
        }
      }

      // If no streaming services found, add a fallback to JustWatch search
      if (streamingServices.length === 0) {
        streamingServices = [{
          name: "Find on JustWatch",
          logo: "https://www.justwatch.com/appassets/img/logo/JustWatch-logo-large.webp",
          url: `https://www.justwatch.com/us/search?q=${encodeURIComponent(detailsResponse.data.title)}`,
          provider_id: "justwatch"
        }];
      }

      setMovieDetails({
        ...detailsResponse.data,
        trailerKey: trailer ? trailer.key : null,
        streamingServices: streamingServices
      });
      setSelectedMovie(movieId);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setMovieDetails({ error: 'Failed to load movie details.' });
    }
  };

  // Fetch movie poster from TMDB
  const fetchMoviePoster = async (movieTitle, movieYear = '') => {
    try {
      const cleanTitle = movieTitle.replace(/^\d+\.\s*/, '').replace(/\(\d{4}\)/, '').trim();
      console.log('Fetching poster for movie title:', cleanTitle, 'Year:', movieYear);
      let query = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
      if (movieYear) {
        query += `&year=${movieYear}`;
      }
      const response = await axios.get(query);
      console.log('TMDB API response for', cleanTitle, ':', response.data);
      const movie = response.data.results[0];
      if (movie && movie.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        console.log('Poster found for', cleanTitle, ':', posterUrl);
        return { id: movie.id, poster: posterUrl };
      } else {
        console.log('No poster found for', cleanTitle);
        return { id: null, poster: null };
      }
    } catch (error) {
      console.error(`Error fetching poster for ${movieTitle}:`, error.message);
      return { id: null, poster: null };
    }
  };

  // Modal and Misc Controls
  const closeModal = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  const playTrailer = () => {
    if (movieDetails && movieDetails.trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${movieDetails.trailerKey}`, '_blank');
    }
  };

  const closeMovieOfTheMonth = () => {
    setShowMovieOfTheMonth(false);
  };

  const playMovieOfTheMonthTrailer = () => {
    if (movieOfTheMonthDetails && movieOfTheMonthDetails.trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${movieOfTheMonthDetails.trailerKey}`, '_blank');
    }
  };

  // Social Sharing
  const getMovieUrl = (movieId) => `https://filmseeker-app.vercel.app/movie/${movieId}`;

  const shareOnX = async (movie) => {
    if (!movie || !movie.title || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const creditsResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
    );
    const writers = creditsResponse.data.credits.crew
      .filter((crew) => crew.job === 'Writer' || crew.job === 'Screenplay')
      .map((writer) => writer.name)
      .join(', ') || 'Unknown';
    const text = `Check out this movie: ${movie.title} (Writer${writers.includes(',') ? 's' : ''}: ${writers})`;
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnFacebook = async (movie) => {
    if (!movie || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const creditsResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
    );
    const writers = creditsResponse.data.credits.crew
      .filter((crew) => crew.job === 'Writer' || crew.job === 'Screenplay')
      .map((writer) => writer.name)
      .join(', ') || 'Unknown';
    const text = `Check out this movie: ${movie.title} (Writer${writers.includes(',') ? 's' : ''}: ${writers})`;
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}"e=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnWhatsApp = async (movie) => {
    if (!movie || !movie.title || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const creditsResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
    );
    const writers = creditsResponse.data.credits.crew
      .filter((crew) => crew.job === 'Writer' || crew.job === 'Screenplay')
      .map((writer) => writer.name)
      .join(', ') || 'Unknown';
    const text = `Check out this movie: ${movie.title} (Writer${writers.includes(',') ? 's' : ''}: ${writers})`;
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnInstagram = async (movie) => {
    if (!movie || !movie.title || !movie.overview) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const creditsResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
    );
    const writers = creditsResponse.data.credits.crew
      .filter((crew) => crew.job === 'Writer' || crew.job === 'Screenplay')
      .map((writer) => writer.name)
      .join(', ') || 'Unknown';
    const text = `Check out this movie: ${movie.title} (Writer${writers.includes(',') ? 's' : ''}: ${writers}) - ${movie.overview.substring(0, 100)}...`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Message copied to clipboard! Paste it into Instagram to share.');
    }).catch(() => {
      alert('Failed to copy message. Please try again.');
    });
  };

  // About Us Modal
  const openAboutUs = () => {
    setShowAboutUs(true);
  };

  const closeAboutUs = () => {
    setShowAboutUs(false);
  };

  // Message Popup
  const openMessagePopup = () => {
    setShowMessagePopup(true);
  };

  const closeMessagePopup = () => {
    setShowMessagePopup(false);
    setMessage('');
  };

  const sendMessage = async () => {
    if (message.trim()) {
      try {
        await addDoc(collection(db, 'messages'), {
          message: message,
          timestamp: serverTimestamp(),
        });
        alert('Message sent successfully! It has been saved.');
        console.log('Message saved to Firestore');
        closeMessagePopup();
      } catch (error) {
        console.error('Error saving message to Firestore:', error);
        alert('Failed to send message. Please try again.');
      }
    } else {
      alert('Please enter a message before sending.');
    }
  };

  // Dr FilmBot Integration
  const askDrFilmBot = async (userPrompt) => {
    const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is missing. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
      setDrFilmBotSuggestions([{ title: 'Error', description: 'OpenAI API key is missing. Please contact the administrator.', quote: '' }]);
      setIsDrFilmBotLoading(false);
      return;
    }

    setIsDrFilmBotLoading(true);
    setDrFilmBotSuggestions([]);
    try {
      // Get the list of watched films to explicitly tell GPT about them
      const watchedFilmsList = watchedFilms.map(film => film.title || '').filter(title => title);

      // Create a prompt that includes the watched films
      let enhancedPrompt = userPrompt;

      if (watchedFilmsList.length > 0) {
        enhancedPrompt += `\n\nPlease DO NOT recommend any of these films that I've already watched: ${watchedFilmsList.join(', ')}.`;
        enhancedPrompt += `\nInstead, recommend diverse films from different eras, countries, and styles that match my request.`;
      }

      console.log('Enhanced prompt with watched films:', enhancedPrompt);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a friendly and knowledgeable movie expert named Dr FilmBot who provides personalized film recommendations. When asked for a recommendation, suggest exactly seven movies that match the user’s mood or preferences. For each movie, provide the title, year, a short description, and one memorable quote to spark interest. Format your response as a list: 1. Movie Title (Year) - Short Description - "Memorable Quote". 2. Movie Title (Year) - Short Description - "Memorable Quote". 3. Movie Title (Year) - Short Description - "Memorable Quote". 4. Movie Title (Year) - Short Description - "Memorable Quote". 5. Movie Title (Year) - Short Description - "Memorable Quote". 6. Movie Title (Year) - Short Description - "Memorable Quote". 7. Movie Title (Year) - Short Description - "Memorable Quote".',
            },
            { role: 'user', content: enhancedPrompt },
          ],
          max_tokens: 800,
          temperature: 0.9,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
      const aiMessage = response.data.choices[0].message.content.trim();
      console.log('OpenAI raw response:', aiMessage);

      const suggestions = [];
      const lines = aiMessage.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const parts = line.split(' - ');
        if (parts.length >= 3) {
          const titleWithYear = parts[0].trim();
          const quote = parts[parts.length - 1].replace(/"/g, '').trim();
          const description = parts.slice(1, parts.length - 1).join(' - ').trim();

          const titleMatch = titleWithYear.match(/^(?:\d+\.\s*)?(.*?)\s*\((\d{4})\)$/);
          if (titleMatch) {
            const title = titleMatch[1].trim();
            const year = titleMatch[2];
            suggestions.push({ title, year, description, quote });
          } else {
            console.warn(`Could not parse title and year from line: ${titleWithYear}`);
            suggestions.push({ title: titleWithYear, year: '', description, quote });
          }
        } else {
          console.warn(`Skipping malformed line: ${line}`);
        }
      }
      console.log('Parsed suggestions:', suggestions);

      if (suggestions.length === 0) {
        throw new Error('No valid movie suggestions could be parsed from the OpenAI response.');
      }

      const suggestionsWithPosters = await Promise.all(
        suggestions.map(async (suggestion) => {
          const posterData = await fetchMoviePoster(suggestion.title, suggestion.year);
          return {
            ...suggestion,
            poster: posterData.poster,
            id: posterData.id,
          };
        })
      );
      console.log('Suggestions with posters:', suggestionsWithPosters);

      // Double-check to filter out any watched films that might have slipped through
      const unwatchedSuggestions = suggestionsWithPosters.filter(
        suggestion => suggestion.id && !watchedFilmIds.has(suggestion.id.toString())
      );

      console.log('Filtered unwatched suggestions:', unwatchedSuggestions);

      // If we have enough unwatched suggestions, use those
      // Otherwise, request more recommendations
      if (unwatchedSuggestions.length >= 3) {
        setDrFilmBotSuggestions(unwatchedSuggestions.slice(0, 7));
      } else if (suggestionsWithPosters.length > 0) {
        // If we have some suggestions but most are watched, still show them
        // but add a message encouraging the user to ask for more diverse recommendations
        const remainingSuggestions = suggestionsWithPosters.slice(0, 7);
        setDrFilmBotSuggestions([
          ...remainingSuggestions,
          {
            title: "Need more recommendations?",
            description: "You've watched many of these films! Try asking for more specific or diverse recommendations.",
            quote: "Try something like 'Show me sci-fi films from the 90s' or 'Recommend me foreign films'",
            id: null
          }
        ]);
      } else {
        setDrFilmBotSuggestions([{
          title: "No recommendations found",
          description: "Try asking for a different type of film or being more specific in your request.",
          quote: "",
          id: null
        }]);
      }
    } catch (error) {
      console.error('Error in askDrFilmBot:', error.message);
      if (error.response) {
        console.error('OpenAI API error response:', error.response.data);
        if (error.response.status === 401) {
          setDrFilmBotSuggestions([{ title: 'Error', description: 'Invalid OpenAI API key. Please contact the administrator.', quote: '' }]);
        } else if (error.response.status === 429) {
          setDrFilmBotSuggestions([{ title: 'Error', description: 'Rate limit exceeded for OpenAI API. Please try again later.', quote: '' }]);
        } else {
          setDrFilmBotSuggestions([{ title: 'Error', description: `OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}. Please try again.`, quote: '' }]);
        }
      } else {
        setDrFilmBotSuggestions([{ title: 'Error', description: `Failed to fetch recommendations: ${error.message}. Please try again.`, quote: '' }]);
      }
    } finally {
      setIsDrFilmBotLoading(false);
    }
  };

  return (
    <div className="App">
      {user ? (
        <div>
          <img
            src={logo}
            alt="FilmSeeker Logo"
            className="logo"
            style={{ width: '287.5px', cursor: 'pointer' }}
            onClick={openAboutUs}
          />
          <div className="section">
            <div className="section-container">
              <div className="dr-filmbot-section" style={{ textAlign: 'center' }}>
                <img
                  src={drFilmBotIllustration}
                  alt="Dr FilmBot Illustration"
                  className="dr-filmbot-illustration"
                />
                <SectionTitle>Ask Dr FilmBot</SectionTitle>
                <label htmlFor="dr-filmbot-input" style={{ display: 'block', marginBottom: '10px', color: '#d1d5db' }}>
                  Describe your mood or preferences:
                </label>
                <textarea
                  id="dr-filmbot-input"
                  rows="4"
                  placeholder="E.g., 'I want a funny sci-fi movie' or 'Something relaxing for tonight'"
                  value={drFilmBotUserInput}
                  onChange={(e) => setDrFilmBotUserInput(e.target.value)}
                  className="dr-filmbot-input-textarea"
                />
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => askDrFilmBot(drFilmBotUserInput)}
                  disabled={isDrFilmBotLoading || !drFilmBotUserInput.trim()}
                  className="dr-filmbot-button"
                >
                  {isDrFilmBotLoading ? 'Loading...' : 'Get Recommendation'}
                </Button>
                {isDrFilmBotLoading ? (
                  <div className="spinner" style={{ marginTop: '20px' }}></div>
                ) : drFilmBotSuggestions.length > 0 ? (
                  <div className="dr-filmbot-response">
                    <h3>Movie Prescription:</h3>
                    <div className="recommendation">
                      {drFilmBotSuggestions
                        .filter(suggestion => suggestion.id && !checkIfWatched(suggestion.id))
                        .map((suggestion, index) => (
                          <div key={`${suggestion.id}-${index}`} className="recommendation-item">
                            {suggestion.poster ? (
                              <img
                                src={suggestion.poster}
                                alt={`${suggestion.title} Poster`}
                                className="poster"
                                onClick={() => suggestion.id && fetchMovieDetails(suggestion.id)}
                                onError={(e) => {
                                  console.log(`Failed to load poster for ${suggestion.title}:`, suggestion.poster);
                                  e.target.style.display = 'none';
                                  // Create and show placeholder
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'poster-placeholder';
                                  placeholder.textContent = suggestion.title;
                                  e.target.parentNode.appendChild(placeholder);
                                }}
                              />
                            ) : (
                              <div className="poster-placeholder">
                                {suggestion.title}
                              </div>
                            )}
                            <p>{suggestion.title}{suggestion.year ? ` (${suggestion.year})` : ''}</p>

                            {/* Watched button - placed under the title */}
                            {suggestion.id && (
                              <Button
                                variant="primary"
                                size="small"
                                className={`watched-button ${isMarkingWatched ? 'is-loading' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening the movie details
                                  markFilmAsWatched({
                                    id: suggestion.id,
                                    title: suggestion.title,
                                    poster: suggestion.poster
                                  }, e);
                                }}
                                disabled={isMarkingWatched}
                                ariaLabel="Mark as watched"
                              >
                                Already watched it
                              </Button>
                            )}

                            <p>{suggestion.description}</p>
                            {suggestion.quote && (
                              <p className="movie-quote">"{suggestion.quote}"</p>
                            )}
                          </div>
                        ))}
                      {drFilmBotSuggestions.length > 0 &&
                       drFilmBotSuggestions.filter(suggestion => suggestion.id && !checkIfWatched(suggestion.id)).length === 0 && (
                        <div className="no-recommendations">
                          <p>You've watched all the recommended films! Try asking for more recommendations.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Add Your Preferences Section - Moved under DrFilmBot */}
                <div className="preferences-section" style={{ marginTop: '30px' }}>
                  <SectionTitle size="small">Add Your Preferences</SectionTitle>
                  <div className="input-container">
                    <div className="input-group">
                      <img src={iconGenre} alt="Genre Icon" />
                      <label>Select a Genre!</label>
                      <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                        <option value="">Choose a genre</option>
                        {genres.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <img src={iconLength} alt="Length Icon" />
                      <label>Duration</label>
                      <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                        <option value="">Choose a duration</option>
                        <option value="short">Short (less than 90 min)</option>
                        <option value="medium">Medium (90-120 min)</option>
                        <option value="long">Long (more than 120 min)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <img src={iconMood} alt="Mood Icon" />
                      <label>Decade</label>
                      <select value={decade} onChange={(e) => setDecade(e.target.value)}>
                        <option value="">Choose a decade</option>
                        <option value="2020">2020s</option>
                        <option value="2010">2010s</option>
                        <option value="2000">2000s</option>
                        <option value="1990">1990s</option>
                        <option value="1980">1980s</option>
                        <option value="1970">1970s</option>
                        <option value="1960">1960s</option>
                        <option value="1950">1950s</option>
                        <option value="1940">1940s</option>
                        <option value="1930">1930s</option>
                        <option value="1920">1920s</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <img src={iconLanguage} alt="Language Icon" />
                      <label>Language</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="">Choose a language</option>
                        <option value="english">English</option>
                        <option value="french">French</option>
                        <option value="spanish">Spanish</option>
                        <option value="german">German</option>
                        <option value="italian">Italian</option>
                        <option value="japanese">Japanese</option>
                        <option value="korean">Korean</option>
                        <option value="chinese">Chinese</option>
                        <option value="russian">Russian</option>
                        <option value="portuguese">Portuguese</option>
                        <option value="swedish">Swedish</option>
                        <option value="danish">Danish</option>
                        <option value="norwegian">Norwegian</option>
                        <option value="dutch">Dutch</option>
                        <option value="finnish">Finnish</option>
                        <option value="polish">Polish</option>
                        <option value="turkish">Turkish</option>
                        <option value="arabic">Arabic</option>
                        <option value="hindi">Hindi</option>
                        <option value="thai">Thai</option>
                        <option value="czech">Czech</option>
                        <option value="hungarian">Hungarian</option>
                        <option value="greek">Greek</option>
                        <option value="romanian">Romanian</option>
                        <option value="albanian">Albanian</option>
                        <option value="slovenian">Slovenian</option>
                        <option value="moldavian">Moldavian</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <img src={iconActor} alt="Actor Icon" />
                      <label>Actress/Actor</label>
                      <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Enter Actress/Actor" />
                    </div>
                    <div className="input-group">
                      <img src={iconDirector} alt="Director Icon" />
                      <label>Director</label>
                      <input value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Enter Director" />
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="button-group">
                    <Button
                      variant="primary"
                      size="medium"
                      onClick={getRecommendations}
                      disabled={isLoading}
                      className={isLoading ? 'button-disabled' : ''}
                    >
                      {isLoading ? 'Loading...' : 'GET MY FILM'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setGenre('');
                        setDuration('');
                        setDecade('');
                        setLanguage('');
                        setActor('');
                        setDirector('');
                        localStorage.removeItem('genre');
                        localStorage.removeItem('duration');
                        localStorage.removeItem('decade');
                        localStorage.removeItem('language');
                        localStorage.removeItem('actor');
                        localStorage.removeItem('director');
                        console.log('Preferences cleared');
                      }}
                      style={{ marginTop: '10px', fontSize: '12px' }}
                    >
                      Clear Preferences
                    </Button>
                  </div>
                </div>

                {/* Your Recommendations Section - Moved under DrFilmBot */}
                <div className="recommendations-section" style={{ marginTop: '30px' }}>
                  <SectionTitle size="small">Your Recommendations</SectionTitle>
                  <div className="recommendation">
                    {isLoading ? (
                      <div className="spinner"></div>
                    ) : recommendations.length > 0 ? (
                      recommendations.map((rec, index) => (
                        <div key={index} className="recommendation-item">
                          {rec.Poster ? (
                            <>
                              <img
                                src={rec.Poster}
                                alt={`${rec.Title} Poster`}
                                className="poster"
                                onClick={() => fetchMovieDetails(rec.id)}
                              />
                              <p>{rec.Title}</p>

                              {/* Already watched it button - placed under the title */}
                              {rec.id && (
                                <Button
                                  variant="primary"
                                  size="small"
                                  className={`watched-button ${isMarkingWatched ? 'is-loading' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening the movie details
                                    markFilmAsWatched({
                                      id: rec.id,
                                      title: rec.Title,
                                      poster: rec.Poster
                                    }, e);
                                  }}
                                  disabled={isMarkingWatched}
                                  ariaLabel="Mark as watched"
                                >
                                  Already watched it
                                </Button>
                              )}
                            </>
                          ) : (
                            <p>{rec.Title}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-recommendations">
                        No recommendations yet. Select your preferences and click "GET MY FILM!"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Trending Films */}
          {trendingFilms.length > 0 && (
            <div className="section">
              <div className="section-container section-alt">
                <div className="trending-section">
                  <div className="trending-container">
                    <div className="trending-recommendation">
                      <SectionTitle>Top 3 Trending Films This Week</SectionTitle>
                      <div className="poster-container">
                        {trendingFilms.map((film, index) => (
                          <div key={index} className="recommendation-item">
                            {film.Poster ? (
                              <MoviePoster
                                src={film.Poster}
                                alt={`${film.Title} Poster`}
                                size="medium"
                                onClick={() => fetchMovieDetails(film.id)}
                                className="trending-poster"
                              />
                            ) : (
                              <p>{film.Title}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Film of the Month Section */}
          <div className="section">
            <div className="section-container">
              <SectionTitle>Film Of The Month</SectionTitle>
              <div className="film-of-the-month-button-container">
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => setShowMovieOfTheMonth(true)}
                  className="film-of-the-month-button"
                >
                  View This Month's Selection
                </Button>
              </div>
            </div>
          </div>



          {/* Movie of the Month Modal */}
          {showMovieOfTheMonth && movieOfTheMonthDetails && (
            <FilmOfMonth
              movieOfTheMonthDetails={movieOfTheMonthDetails}
              closeMovieOfTheMonth={closeMovieOfTheMonth}
              playMovieOfTheMonthTrailer={playMovieOfTheMonthTrailer}
            />
          )}
          {/* Movie Details Modal */}
          {selectedMovie && movieDetails && (
            <Modal
              isOpen={true}
              onClose={closeModal}
              size="large"
              variant="primary"
              className="movie-detail-modal"
            >
                {movieDetails.error ? (
                  <p>{movieDetails.error}</p>
                ) : movieDetails.id !== selectedMovie ? (
                  <p>Error: Movie ID mismatch.</p>
                ) : (
                  <div className="movie-detail-container">
                    <div className="movie-detail-header">
                      <h2 className="movie-detail-title">
                        {movieDetails.title}
                        <span className="movie-detail-year">
                          ({movieDetails.release_date ? movieDetails.release_date.split('-')[0] : 'N/A'})
                        </span>
                      </h2>
                    </div>

                    <div className="movie-detail-content">
                      <div className="movie-detail-poster-container">
                        {movieDetails.poster_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movieDetails.poster_path}`}
                            alt={`${movieDetails.title} Poster`}
                            className="movie-detail-poster"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                          />
                        )}
                      </div>

                      <div className="movie-detail-info">
                        <div className="movie-detail-meta">
                          <div className="movie-detail-rating">
                            <span className="rating-star">★</span> {movieDetails.vote_average.toFixed(1)}/10
                          </div>

                          {movieDetails.genres && movieDetails.genres.length > 0 && (
                            <div className="movie-detail-genres">
                              {movieDetails.genres.map(genre => (
                                <span key={genre.id} className="movie-genre-tag">{genre.name}</span>
                              ))}
                            </div>
                          )}

                          <div className="movie-detail-runtime">
                            <span className="detail-label">Runtime:</span> {movieDetails.runtime} min
                          </div>

                          {movieDetails.credits && movieDetails.credits.crew && (
                            <div className="movie-detail-director">
                              <span className="detail-label">Director:</span> {
                                movieDetails.credits.crew
                                  .filter(person => person.job === 'Director')
                                  .map(director => director.name)
                                  .join(', ') || 'Unknown'
                              }
                            </div>
                          )}

                          {movieDetails.credits && movieDetails.credits.cast && (
                            <div className="movie-detail-cast">
                              <span className="detail-label">Cast:</span> {
                                movieDetails.credits.cast
                                  .slice(0, 3)
                                  .map(actor => actor.name)
                                  .join(', ')
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="movie-detail-overview">
                      <h3 className="overview-title">Overview</h3>
                      <p>{movieDetails.overview}</p>
                    </div>

                    {/* Streaming Services Section */}
                    {movieDetails.streamingServices && movieDetails.streamingServices.length > 0 && (
                      <div className="movie-detail-streaming">
                        <h3 className="streaming-title">Where to Watch</h3>
                        <div className="streaming-providers">
                          {movieDetails.streamingServices.map(provider => (
                            <a
                              key={provider.provider_id}
                              href={provider.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="provider-link"
                              title={`Watch ${movieDetails.title} on ${provider.name}`}
                            >
                              <img
                                src={provider.logo}
                                alt={provider.name}
                                className="provider-logo"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/45x45?text=Logo'; }}
                              />
                              <span className="provider-name">{provider.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="movie-detail-actions">
                      {/* Watch Trailer Button */}
                      {movieDetails.trailerKey && (
                        <Button
                          variant="primary"
                          size="large"
                          onClick={playTrailer}
                          className="movie-trailer-button"
                        >
                          <span className="trailer-icon">▶</span> Watch Trailer
                        </Button>
                      )}
                    </div>

                    <div className="movie-detail-share">
                      <h3 className="share-title">Share this film</h3>
                      <div className="share-buttons">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => shareOnX(movieDetails)}
                          className="share-button x-button"
                        >
                          <img src={xIcon} alt="Share on X" className="share-icon" /> Twitter
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => shareOnFacebook(movieDetails)}
                          className="share-button facebook-button"
                        >
                          <img src={facebookIcon} alt="Share on Facebook" className="share-icon" /> Facebook
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => shareOnWhatsApp(movieDetails)}
                          className="share-button whatsapp-button"
                        >
                          <img src={whatsappIcon} alt="Share on WhatsApp" className="share-icon" /> WhatsApp
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => shareOnInstagram(movieDetails)}
                          className="share-button instagram-button"
                        >
                          <img src={instagramIcon} alt="Share on Instagram" className="share-icon" /> Instagram
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </Modal>
          )}
          {/* Action Buttons - positioned in top right corner */}
          <div className="action-buttons-container">
            <Button
              variant="outline"
              size="medium"
              onClick={toggleWatchedFilmsPage}
              ariaLabel="View your watched films"
              className="watched-films-button"
            >
              Watched Films
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={getRandomRecommendation}
              disabled={isLoading}
              className={isLoading ? 'button-disabled surprise-button-top' : 'surprise-button-top'}
              ariaLabel="Get a random film recommendation"
            >
              {isLoading ? 'Loading...' : 'Surprise Me!'}
            </Button>
          </div>

          {/* Tip Button */}
          <div className="tip-button-container">
            <a
              href="https://buymeacoffee.com/filmseeker"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send a tip to support FilmSeeker"
            >
              <img src={tipIcon} alt="Tip Icon" className="tip-icon" />
            </a>
          </div>

          {/* Message Button - positioned next to the tip button */}
          <div className="feedback-button-container">
            <Button
              variant="primary"
              size="small"
              onClick={openMessagePopup}
              ariaLabel="Send us a message"
            >
              Feedback
            </Button>
          </div>

          {/* Message Modal */}
          {showMessagePopup && (
            <Modal
              isOpen={true}
              onClose={closeMessagePopup}
              size="small"
              variant="primary"
              className="message-modal"
            >
              <h2>Send us a Message</h2>
              <textarea
                className="message-input"
                placeholder="Your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
              <div className="modal-buttons">
                <Button
                  variant="primary"
                  size="medium"
                  onClick={sendMessage}
                  className="send-button"
                >
                  Send
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  onClick={closeMessagePopup}
                  className="cancel-button"
                >
                  Cancel
                </Button>
              </div>
            </Modal>
          )}

          {/* Watched Films Page */}
          {showWatchedFilms && (
            <WatchedFilmsPage
              user={user}
              onClose={toggleWatchedFilmsPage}
              fetchMovieDetails={fetchMovieDetails}
            />
          )}

          {/* About Us Modal */}
          {showAboutUs && (
            <Modal
              isOpen={true}
              onClose={closeAboutUs}
              size="large"
              variant="secondary"
              className="thank-you-modal"
            >
              <h2>THANK YOU</h2>
              <p>Thank you for being here.</p>
              <p>And most of all, thank you for being curious about films.</p>

              <p>At FilmSeeker, our purpose is simple:<br/>
              To help you find the next film you're going to watch.<br/>
              And then come back for another.<br/>
              And another.<br/>
              And another.<br/>
              We believe there's always another story waiting to be found.</p>

              <p>We don't gather likes.<br/>
              We don't make watch lists.<br/>
              There are plenty of great apps out there for that.<br/>
              We just want to help you find your next great film.<br/>
              That's it.</p>

              <p>And while you're here, we hope you'll feel encouraged to explore.<br/>
              To experiment.<br/>
              To discover films you might not have chosen otherwise.<br/>
              Because sometimes, the most unexpected story can awaken something new inside you.<br/>
              A film in a foreign language, made in a faraway place, can be surprisingly close to your own life experience.</p>

              <p>We're always open to your suggestions, comments, feedback—even emojis.<br/>
              Click the Message button and reach out any way you like.<br/>
              We'd love to hear from you.</p>

              <p>And if you enjoyed your film recommendation or found something special through us,<br/>
              you can always leave us a tip by clicking the Tip button on the main page.<br/>
              It helps us keep the project alive—and makes our day!</p>

              <p>Thank you for taking the time to read this modest text.<br/>
              And thank you on behalf of all the artists who will be discovered—or rediscovered—through you.</p>

              <p><strong>Enjoy the Films.</strong></p>

              <Button
                variant="primary"
                size="medium"
                onClick={closeAboutUs}
                className="close-button"
              >
                Close
              </Button>
            </Modal>
          )}


        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;