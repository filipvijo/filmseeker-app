import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import logo from './logo.png';
import iconGenre from './icon-genre.png';
import iconMood from './icon-mood.png';
import iconLength from './icon-length.png'; // This icon will now represent decade
import iconLanguage from './icon-language.png';
import iconActor from './icon-actor.png';

function App() {
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [decade, setDecade] = useState(''); // Changed from length to decade
  const [language, setLanguage] = useState('');
  const [actor, setActor] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY; // Replace with your TMDb API Key or Read Access Token

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

  useEffect(() => {
    const savedGenre = localStorage.getItem('genre');
    const savedMood = localStorage.getItem('mood');
    const savedDecade = localStorage.getItem('decade'); // Changed from length to decade
    const savedLanguage = localStorage.getItem('language');
    const savedActor = localStorage.getItem('actor');
    if (savedGenre) setGenre(savedGenre);
    if (savedMood) setMood(savedMood);
    if (savedDecade) setDecade(savedDecade);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedActor) setActor(savedActor);
  }, []);

  useEffect(() => {
    localStorage.setItem('genre', genre);
    localStorage.setItem('mood', mood);
    localStorage.setItem('decade', decade); // Changed from length to decade
    localStorage.setItem('language', language);
    localStorage.setItem('actor', actor);
  }, [genre, mood, decade, language, actor]);

  const getRecommendations = async () => {
    try {
      const genreId = genres.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
      // Map decade to release date range
      const decadeFilter = decade ? `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31` : '';
      const languageMap = { 'english': 'en', 'french': 'fr', 'spanish': 'es', 'german': 'de' };
      const languageFilter = language ? `&with_original_language=${languageMap[language.toLowerCase()] || language.toLowerCase()}` : '';
      let actorId = '';
      if (actor) {
        const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(actor)}`);
        actorId = actorResponse.data.results[0]?.id || '';
      }
      const actorFilter = actorId ? `&with_cast=${actorId}` : '';
      const moodFilter = {
        'happy': '&with_genres=35&vote_average.gte=6', // Comedy, high rating
        'sad': '&with_genres=18', // Drama
        'excited': '&with_genres=28&vote_average.gte=6', // Action, high rating
      }[mood.toLowerCase()] || '';

      const query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}${genreId ? `&with_genres=${genreId}` : ''}${decadeFilter}${languageFilter}${actorFilter}${moodFilter}&sort_by=popularity.desc`;
      const response = await axios.get(query);
      const results = response.data.results.slice(0, 5);
      setRecommendations(results.map(movie => ({
        id: movie.id,
        Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      })));
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
          <img src={iconMood} alt="Mood Icon" />
          <label>Choose Your Mood!</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="">Choose a mood</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="excited">Excited</option>
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
            {Object.keys({ 'english': 'en', 'french': 'fr', 'spanish': 'es', 'german': 'de' }).map(lang => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <img src={iconActor} alt="Actor Icon" />
          <label>Favorite Actor/Actress</label>
          <input value={actor} onChange={(e) => setActor(e.target.value)} />
        </div>
        <div className="input-group button-group">
          <button onClick={getRecommendations}>Get My Film!</button>
        </div>
      </div>
      <div className="recommendation">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item" onClick={() => fetchMovieDetails(rec.id)}>
            {rec.Poster && <img src={rec.Poster} alt={`Movie Poster ${index + 1}`} className="poster" />}
          </div>
        ))}
      </div>

      {selectedMovie && movieDetails && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>×</button>
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