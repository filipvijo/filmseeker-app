import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import logo from './logo.png';
import iconGenre from './icon-genre.png';
import iconMood from './icon-mood.png';
import iconLength from './icon-length.png';
import iconLanguage from './icon-language.png';
import iconActor from './icon-actor.png';
import iconDirector from './icon-director.png';

function App() {
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

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  const languageMap = {
    '': '',
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

  // Fetch trending films on page load
  useEffect(() => {
    const fetchTrendingFilms = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
        const trending = response.data.results
          .slice(0, 3) // Take top 3
          .map(movie => ({
            id: movie.id,
            Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            Title: movie.title,
          }));
        setTrendingFilms(trending);
      } catch (error) {
        console.error('Error fetching trending films:', error);
      }
    };
    fetchTrendingFilms();

    // Clear all preferences on page load
    localStorage.clear();
    setGenre('');
    setDuration('');
    setDecade('');
    setLanguage('');
    setActor('');
    setDirector('');

    // Fetch genres from TMDB
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
    // Save preferences to localStorage (optional, can be triggered by a save button later)
    localStorage.setItem('genre', genre);
    localStorage.setItem('duration', duration);
    localStorage.setItem('decade', decade);
    localStorage.setItem('language', language);
    localStorage.setItem('actor', actor);
    localStorage.setItem('director', director);
  }, [genre, duration, decade, language, actor, director]);

  const getRecommendations = async () => {
    setIsLoading(true);
    setRecommendations([]);
    try {
      // Actor filtering
      let actorId = '';
      if (actor) {
        const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(actor)}`);
        actorId = actorResponse.data.results[0]?.id || '';
      }

      // Director filtering: Fetch movies directed by the person
      let directedMovies = [];
      let directorId = '';
      if (director) {
        const directorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(director)}`);
        directorId = directorResponse.data.results.find(person => person.known_for_department === "Directing")?.id;
        if (directorId) {
          const creditsResponse = await axios.get(`https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=${API_KEY}`);
          const potentialDirectedMovies = creditsResponse.data.crew
            .filter(credit => credit.job === "Director")
            .map(credit => credit.id);

          directedMovies = await Promise.all(potentialDirectedMovies.map(async (movieId) => {
            try {
              const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
              const directors = detailsResponse.data.credits.crew
                .filter(crew => crew.job === "Director")
                .map(d => d.id);
              if (directors.length > 0 && directors.includes(parseInt(directorId))) {
                return {
                  id: movieId,
                  title: detailsResponse.data.title,
                  poster_path: detailsResponse.data.poster_path,
                  release_date: detailsResponse.data.release_date,
                  original_language: detailsResponse.data.original_language,
                };
              }
              return null;
            } catch (error) {
              console.error(`Error verifying movie ${movieId}:`, error);
              return null;
            }
          })).then(results => results.filter(movie => movie !== null));
        }
      }

      // If no director specified, use discover endpoint
      let allResults = directedMovies;
      if (!director) {
        const genreId = genres.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
        const decadeFilter = decade ? `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31` : '';
        const languageFilter = language ? `&with_original_language=${languageMap[language.toLowerCase()] || language.toLowerCase()}` : '';
        const actorFilter = actorId ? `&with_cast=${actorId}` : '';
        const durationFilter = {
          'short': '&with_runtime.lte=90',
          'medium': '&with_runtime.gte=90&with_runtime.lte=120',
          'long': '&with_runtime.gte=120',
        }[duration.toLowerCase()] || '';

        for (let page = 1; page <= 3; page++) {
          const query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`
            + `${genreId ? `&with_genres=${genreId}` : ''}`
            + `${decadeFilter}${languageFilter}${actorFilter}${durationFilter}`
            + `&sort_by=popularity.desc&page=${page}`;
          console.log('API Query (Page', page, '):', query);
    
          const response = await axios.get(query);
          const results = response.data.results;
          allResults = [...allResults, ...results];
        }
      }

      // Fetch runtime and additional details for filtering
      const moviesWithDetails = await Promise.all(
        allResults.map(async (movie) => {
          try {
            const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`);
            return {
              ...movie,
              runtime: detailsResponse.data.runtime || 0,
              genres: detailsResponse.data.genres.map(g => g.id),
              cast: detailsResponse.data.credits.cast.map(c => c.id),
            };
          } catch (error) {
            console.error(`Error fetching details for movie ${movie.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null results and apply criteria
      const genreId = genres.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
      const validMovies = moviesWithDetails.filter(movie => movie !== null);
      const filteredResults = validMovies.filter(movie => {
        const runtime = movie.runtime || 0;
        const matchesGenre = genre ? movie.genres.includes(genreId) : true;
        const matchesDecade = decade ? (movie.release_date && movie.release_date.substring(0, 4) >= decade && movie.release_date.substring(0, 4) <= parseInt(decade) + 9) : true;
        const matchesLanguage = language ? (movie.original_language === languageMap[language.toLowerCase()] || movie.original_language === language.toLowerCase()) : true;
        const matchesActor = actorId ? movie.cast.includes(parseInt(actorId)) : true;
        const matchesDuration = duration.toLowerCase() === 'short' ? runtime > 0 && runtime <= 90 :
                               duration.toLowerCase() === 'medium' ? runtime >= 90 && runtime <= 120 :
                               duration.toLowerCase() === 'long' ? runtime >= 120 : true;
        return matchesGenre && matchesDecade && matchesLanguage && matchesActor && matchesDuration;
      }).slice(0, 16);

      if (filteredResults.length === 0) {
        setRecommendations([{ id: null, Poster: null, Title: 'No movies found matching your criteria. Try adjusting your preferences.' }]);
      } else {
        setRecommendations(filteredResults.map(movie => ({
          id: movie.id,
          Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          Title: movie.title,
        })));
      }
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      setRecommendations([{ id: null, Poster: null, Title: 'Error loading recommendations. Please try again later.' }]);
    } finally {
      setIsLoading(false);
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
            <option value="short">Short (&lt;90 min)</option>
            <option value="medium">Medium (90-120 min)</option>
            <option value="long">Long (&gt;120 min)</option>
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
          <label>Actress/Actor</label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Enter Actress/Actor"
          />
        </div>
        <div className="input-group">
          <img src={iconDirector} alt="Director Icon" />
          <label>Director</label>
          <input
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            placeholder="Enter Director"
          />
        </div>
      </div>

      <div className="input-group button-group">
        <button 
          onClick={getRecommendations} 
          disabled={isLoading}
          className={isLoading ? 'button-disabled' : ''}
        >
          {isLoading ? 'Loading...' : 'Get My Film!'}
        </button>
      </div>

      <div className="recommendation">
        {isLoading ? (
          <div className="spinner"></div>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              {rec.Poster ? (
                <img
                  src={rec.Poster}
                  alt={`Movie Poster ${index + 1}`}
                  className="poster"
                  onClick={() => fetchMovieDetails(rec.id)}
                />
              ) : (
                <p>{rec.Title}</p>
              )}
            </div>
          ))
        ) : (
          <p>No recommendations yet. Select your preferences and click "Get My Film!"</p>
        )}
      </div>

      {trendingFilms.length > 0 && (
        <div className="trending-section">
          <h2>Top 3 Trending Films Weekly</h2>
          <div className="trending-recommendation">
            {trendingFilms.map((film, index) => (
              <div key={index} className="recommendation-item">
                {film.Poster ? (
                  <img
                    src={film.Poster}
                    alt={`Trending Movie Poster ${index + 1}`}
                    className="trending-poster"
                    onClick={() => fetchMovieDetails(film.id)}
                  />
                ) : (
                  <p>{film.Title}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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