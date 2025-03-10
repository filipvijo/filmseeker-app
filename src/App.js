import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import logo from './logo.png';
import iconGenre from './icon-genre.png';
import iconMood from './icon-mood.png';
import iconLength from './icon-length.png';
import iconLanguage from './icon-language.png';
import iconActor from './icon-actor.png';

function App() {
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [decade, setDecade] = useState('');
  const [language, setLanguage] = useState('');
  const [actor, setActor] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // Language map for converting language names to ISO 639-1 codes
  const languageMap = {
    '': '', // For "Any language"
    'english': 'en',
    'french': 'fr',
    'spanish': 'es',
    'german': 'de',
    'korean': 'ko',
    'japanese': 'ja',
    'arabic': 'ar',
    'farsi': 'fa',
    'russian': 'ru',
    'serbian': 'sr',
    'chinese': 'zh',
    'thai': 'th',
    'danish': 'da',
    'swedish': 'sv',
    'norwegian': 'no',
    'italian': 'it',
  };

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`);
        setGenres(response.data.genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, [API_KEY]);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedGenre = localStorage.getItem('genre');
    const savedDuration = localStorage.getItem('duration');
    const savedDecade = localStorage.getItem('decade');
    const savedLanguage = localStorage.getItem('language');
    const savedActor = localStorage.getItem('actor');
    if (savedGenre) setGenre(savedGenre);
    if (savedDuration) setDuration(savedDuration);
    if (savedDecade) setDecade(savedDecade);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedActor) setActor(savedActor);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('genre', genre);
    localStorage.setItem('duration', duration);
    localStorage.setItem('decade', decade);
    localStorage.setItem('language', language);
    localStorage.setItem('actor', actor);
  }, [genre, duration, decade, language, actor]);

  const getRecommendations = async () => {
    try {
      const genreId = genres.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
      const decadeFilter = decade ? `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31` : '';
      const languageFilter = language ? `&with_original_language=${languageMap[language.toLowerCase()] || language.toLowerCase()}` : '';
      let actorId = '';
      if (actor) {
        const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(actor)}`);
        actorId = actorResponse.data.results[0]?.id || '';
      }
      const actorFilter = actorId ? `&with_cast=${actorId}` : '';
      const durationFilter = {
        'short': '&with_runtime.lte=90',
        'medium': '&with_runtime.gte=90&with_runtime.lte=120',
        'long': '&with_runtime.gte=120',
      }[duration.toLowerCase()] || '';
  
      // Fetch multiple pages to get more movies
      let allResults = [];
      for (let page = 1; page <= 3; page++) {
        const query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}${genreId ? `&with_genres=${genreId}` : ''}${decadeFilter}${languageFilter}${actorFilter}${durationFilter}&sort_by=popularity.desc&page=${page}`;
        console.log('API Query (Page', page, '):', query);
  
        const response = await axios.get(query);
        const results = response.data.results;
        allResults = [...allResults, ...results];
      }
  
      // Fetch runtime for each movie
      const moviesWithRuntime = await Promise.all(
        allResults.map(async (movie) => {
          const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`);
          return {
            ...movie,
            runtime: detailsResponse.data.runtime || 0,
          };
        })
      );
  
      console.log('All Fetched Movies with Runtimes:', moviesWithRuntime.map(movie => ({
        title: movie.title,
        runtime: movie.runtime,
      })));
  
      // Client-side filtering for duration
      const filteredResults = moviesWithRuntime.filter(movie => {
        const runtime = movie.runtime || 0;
        if (duration.toLowerCase() === 'short') return runtime > 0 && runtime <= 90;
        if (duration.toLowerCase() === 'medium') return runtime >= 90 && runtime <= 120;
        if (duration.toLowerCase() === 'long') return runtime >= 120;
        return true; // If no duration selected, include all
      }).slice(0, 10);
  
      console.log('Filtered Movies:', filteredResults.map(movie => ({
        title: movie.title,
        runtime: movie.runtime,
      })));
  
      if (filteredResults.length === 0) {
        setRecommendations([{ id: null, Poster: null, Title: 'No movies found matching your duration criteria.' }]);
      } else {
        setRecommendations(filteredResults.map(movie => ({
          id: movie.id,
          Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          Title: movie.title,
        })));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([{ id: null, Poster: null, Title: 'Error loading recommendations' }]);
    }

  };

  const fetchMovieDetails = async (movieId) => {
    try {
      const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
      const videosResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
      const trailer = videosResponse.data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
      setMovieDetails({
        ...detailsResponse.data,
        trailerKey: trailer ? trailer.key : null,
      });
      setSelectedMovie(movieId);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  const playTrailer = () => {
    if (movieDetails && movieDetails.trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${movieDetails.trailerKey}`, '_blank');
    }
  };

  return (
    <div className="App">
      <img src={logo} alt="FilmSeeker Logo" className="logo" />
      <h1>Choose a Category</h1>
      <div className="input-container">
        <div className="input-group">
          <img src={iconGenre} alt="Genre Icon" />
          <label>Select a Genre!</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Choose a genre</option>
            {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <div className="input-group">
          <img src={iconMood} alt="Duration Icon" />
          <label>Film Duration</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="">Any duration</option>
            <option value="short">Short (&lt;90 min)</option> {/* Escaped < */}
            <option value="medium">Medium (90-120 min)</option>
            <option value="long">Long (&gt;120 min)</option> {/* Escaped > */}
          </select>
        </div>
        <div className="input-group">
          <img src={iconLength} alt="Decade Icon" />
          <label>Movie Decade</label>
          <select value={decade} onChange={(e) => setDecade(e.target.value)}>
            <option value="">Any decade</option>
            <option value="1950">1950s</option>
            <option value="1960">1960s</option>
            <option value="1970">1970s</option>
            <option value="1980">1980s</option>
            <option value="1990">1990s</option>
            <option value="2000">2000s</option>
            <option value="2010">2010s</option>
            <option value="2020">2020s</option>
          </select>
        </div>
        <div className="input-group">
          <img src={iconLanguage} alt="Language Icon" />
          <label>Preferred Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Any language</option>
            {Object.keys(languageMap).filter(lang => lang !== '').map(lang => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <img src={iconActor} alt="Actor Icon" />
          <label>Favorite Actor</label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Enter Actor"
          />
        </div>
        <div className="input-group button-group">
          <button onClick={getRecommendations}>Get My Film!</button>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="recommendation">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item">
            {rec.Poster && (
              <img src={rec.Poster} alt={`Movie Poster ${index + 1}`} className="poster" onClick={() => fetchMovieDetails(rec.id)} />
            )}
          </div>
        ))}
      </div>

      {/* Modal for Movie Details */}
      {selectedMovie && movieDetails && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>×</button>
            {movieDetails.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w200${movieDetails.poster_path}`}
                alt={`${movieDetails.title} Poster`}
                className="modal-poster"
              />
            )}
            <h2>{movieDetails.title} ({movieDetails.release_date.split('-')[0]})</h2>
            <p className="rating">Rating: {movieDetails.vote_average}/10</p>
            <p className="overview">{movieDetails.overview}</p>
            {movieDetails.trailerKey && (
              <button className="trailer-button" onClick={playTrailer}>Watch Trailer</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;