import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { db } from './firebase'; // Import Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Firestore methods
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
  const [showMovieOfTheMonth, setShowMovieOfTheMonth] = useState(false);
  const [movieOfTheMonthDetails, setMovieOfTheMonthDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [message, setMessage] = useState('');

  // Define the Movie of the Month (update this monthly with ID only)
  const movieOfTheMonth = {
    id: 207, // Example: Braveheart (1995) - Replace with your chosen movie ID
  };

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

  // Fetch trending films and Movie of the Month on page load
  useEffect(() => {
    const fetchTrendingFilms = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
        const trending = response.data.results
          .slice(0, 3)
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

    const fetchMovieOfTheMonth = async () => {
      try {
        const timestamp = new Date().getTime();
        const detailsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieOfTheMonth.id}?api_key=${API_KEY}&_=${timestamp}`
        );
        const videosResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieOfTheMonth.id}/videos?api_key=${API_KEY}&_=${timestamp}`
        );
        const trailer = videosResponse.data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        setMovieOfTheMonthDetails({
          ...detailsResponse.data,
          trailerKey: trailer ? trailer.key : null,
        });
      } catch (error) {
        console.error('Error fetching Movie of the Month details:', error);
        setMovieOfTheMonthDetails({ error: 'Failed to load Movie of the Month details.' });
      }
    };

    fetchTrendingFilms();
    fetchMovieOfTheMonth();

    // Clear all preferences on page load
    localStorage.clear();
    setGenre('');
    setDuration('');
    setDecade('');
    setLanguage('');
    setActor('');
    setDirector();

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
  }, [API_KEY, movieOfTheMonth.id]); // Added movieOfTheMonth.id to dependency array

  useEffect(() => {
    // Save preferences to localStorage
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

    const trimmedActor = actor.trim();
    const trimmedDirector = director.trim();

    const hasPreferences = genre || duration || decade || language || trimmedActor || trimmedDirector;

    if (!hasPreferences) {
      setRecommendations([{ id: null, Poster: null, Title: 'Please enter at least one preference to get recommendations.' }]);
      setIsLoading(false);
      return;
    }

    try {
      let actorId = '';
      if (trimmedActor) {
        const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(trimmedActor)}`);
        actorId = actorResponse.data.results[0]?.id || '';
      }

      let directedMovies = [];
      let directorId = '';
      if (trimmedDirector) {
        const directorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(trimmedDirector)}`);
        const directorResult = directorResponse.data.results.find(person => 
          person.name.toLowerCase() === trimmedDirector.toLowerCase() || person.known_for_department.toLowerCase().includes("directing")
        );
        directorId = directorResult?.id || '';
        if (directorId) {
          const creditsResponse = await axios.get(`https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=${API_KEY}`);
          directedMovies = creditsResponse.data.crew
            .filter(credit => credit.job === "Director")
            .map(credit => credit.id)
            .map(async (movieId) => {
              try {
                const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
                const directors = detailsResponse.data.credits.crew.filter(crew => crew.job === "Director").map(d => d.id);
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
            });
          directedMovies = await Promise.all(directedMovies.filter(result => result !== null));
        }
      }

      let allResults = directedMovies;
      if (!trimmedDirector) {
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
          const response = await axios.get(query);
          allResults = [...allResults, ...response.data.results];
        }
      }

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
      const timestamp = new Date().getTime();
      const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&_=${timestamp}`);
      const videosResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&_=${timestamp}`);

      if (detailsResponse.data.id !== movieId) {
        throw new Error(`Movie ID mismatch: requested ${movieId}, received ${detailsResponse.data.id}`);
      }

      let watchOption = null;
      let subscriptionMessage = null;
      try {
        // Placeholder for JustWatch API - replace with actual implementation if available
      } catch (justWatchError) {
        console.error('Error fetching JustWatch data:', justWatchError);
      }

      const trailer = videosResponse.data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
      setMovieDetails({
        ...detailsResponse.data,
        trailerKey: trailer ? trailer.key : null,
        watchOption: watchOption ? {
          provider: watchOption.provider_id,
          url: watchOption.urls.standard_web ? watchOption.urls.standard_web : null,
          price: watchOption.retail_price ? `$${watchOption.retail_price.amount}` : 'N/A'
        } : null,
        subscriptionMessage: subscriptionMessage,
      });
      setSelectedMovie(movieId);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setMovieDetails({ error: 'Failed to load movie details.' });
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

  const closeMovieOfTheMonth = () => {
    setShowMovieOfTheMonth(false);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const playMovieOfTheMonthTrailer = () => {
    if (movieOfTheMonthDetails && movieOfTheMonthDetails.trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${movieOfTheMonthDetails.trailerKey}`, '_blank');
    }
  };

  const getMovieUrl = (movieId) => `https://filmseeker-app.vercel.app/movie/${movieId}`;

  const shareOnX = (movie) => {
    if (!movie || !movie.title || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const text = `Check out this movie: ${movie.title}`;
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnFacebook = (movie) => {
    if (!movie || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnWhatsApp = (movie) => {
    if (!movie || !movie.title || !movie.id) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const text = `Check out this movie: ${movie.title}`;
    const url = getMovieUrl(movie.id);
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnInstagram = (movie) => {
    if (!movie || !movie.title || !movie.overview) {
      alert('Error: Movie data is not available for sharing.');
      return;
    }
    const text = `Check out this movie: ${movie.title} - ${movie.overview.substring(0, 100)}...`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Message copied to clipboard! Paste it into Instagram to share.');
    }).catch(() => {
      alert('Failed to copy message. Please try again.');
    });
  };

  const openAboutUs = () => {
    setShowAboutUs(true);
  };

  const closeAboutUs = () => {
    setShowAboutUs(false);
  };

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
        // Add the message to Firestore in a collection called "messages"
        await addDoc(collection(db, 'messages'), {
          message: message,
          timestamp: serverTimestamp(), // Adds a server-side timestamp
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

  return (
    <div className="App">
      <img
        src={logo}
        alt="FilmSeeker Logo"
        className="logo"
        style={{ width: '287.5px', cursor: 'pointer' }}
        onClick={openAboutUs}
      />

      {showAboutUs && (
        <div className="modal" onClick={closeAboutUs}>
          <div className="modal-content about-us-modal" onClick={(e) => e.stopPropagation()}>
            <h2>About Us</h2>
            <p>
              Thank you for being here.<br />
              And most of all, thank you for being curious about films.
            </p>
            <p>
              At FilmSeeker, our purpose is simple:<br />
              To help you find the next film you're going to watch.<br />
              And then come back for another.<br />
              And another.<br />
              And another.<br />
              We believe there's always another story waiting to be found.
            </p>
            <p>
              We don’t ask for your email.<br />
              We don’t gather likes.<br />
              We don’t make watch lists.<br />
              There are plenty of great apps out there for that.<br />
              We just want to help you find your next great film.<br />
              That’s it.
            </p>
            <p>
              And while you’re here, we hope you’ll feel encouraged to explore.<br />
              To experiment.<br />
              To discover films you might not have chosen otherwise.<br />
              Because sometimes, the most unexpected story can awaken something new inside you.<br />
              A film in a foreign language, made in a faraway place, can be surprisingly close to your own life experience.
            </p>
            <p>
              We’re always open to your suggestions, comments, feedback—even emojis.<br />
              Click the Message button and reach out any way you like.<br />
              We’d love to hear from you.
            </p>
            <p>
              And if you enjoyed your film recommendation or found something special through us,<br />
              you can always leave us a tip by clicking the Tip button on the main page.<br />
              It helps us keep the project alive—and makes our day!
            </p>
            <p>
              Thank you for taking the time to read this modest text.<br />
              And thank you on behalf of all the artists who will be discovered—or rediscovered—through you.
            </p>
            <p>Enjoy the Films.</p>
            <div className="modal-buttons">
              <button onClick={openMessagePopup} className="message-button" title="Send us a message">
                Message
              </button>
              <button className="close-button" onClick={closeAboutUs}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showMessagePopup && (
        <div className="modal" onClick={closeMessagePopup}>
          <div className="modal-content message-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Send Us a Message</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="message-input"
            />
            <div className="modal-buttons">
              <button onClick={sendMessage} className="send-button">
                Send It
              </button>
              <button onClick={closeMessagePopup} className="close-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {trendingFilms.length > 0 && (
        <div className="trending-section">
          <div className="trending-container">
            <div className="trending-recommendation">
              <h2>Top 3 Trending Films This Week</h2>
              <div className="poster-container">
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
          </div>
        </div>
      )}

      <div className="film-of-the-month-button-container">
        <button
          onClick={() => setShowMovieOfTheMonth(true)}
          className="film-of-the-month-button"
        >
          Film Of The Month
        </button>
      </div>

      <h1>Add your Preferences</h1>
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
          style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
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

      {showMovieOfTheMonth && movieOfTheMonthDetails && (
        <div className="modal" onClick={closeMovieOfTheMonth}>
          <div className="modal-content movie-of-the-month-modal" onClick={(e) => e.stopPropagation()}>
            {!showDetails ? (
              <div className="movie-of-the-month-container">
                <h2>Our Movie of the Month</h2>
                <img
                  src={movieOfTheMonthDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieOfTheMonthDetails.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster'}
                  alt={`${movieOfTheMonthDetails.title} Poster`}
                  className="movie-of-the-month-poster"
                  onClick={toggleDetails}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                />
              </div>
            ) : (
              <>
                <h2>Our Movie of the Month</h2>
                {movieOfTheMonthDetails.error ? (
                  <p>{movieOfTheMonthDetails.error}</p>
                ) : (
                  <>
                    {movieOfTheMonthDetails.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movieOfTheMonthDetails.poster_path}`}
                        alt={`${movieOfTheMonthDetails.title} Poster`}
                        className="modal-poster"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                      />
                    )}
                    <h3>{movieOfTheMonthDetails.title} ({movieOfTheMonthDetails.release_date ? movieOfTheMonthDetails.release_date.split('-')[0] : 'N/A'})</h3>
                    <p className="rating">Rating: {movieOfTheMonthDetails.vote_average}/10</p>
                    <p className="overview">{movieOfTheMonthDetails.overview}</p>
                    {movieOfTheMonthDetails.trailerKey && (
                      <button className="trailer-button" onClick={playMovieOfTheMonthTrailer}>Watch Trailer</button>
                    )}
                  </>
                )}
                <button className="trailer-button" onClick={toggleDetails} style={{ marginTop: '10px' }}>
                  Back to Poster
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {selectedMovie && movieDetails && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {movieDetails.error ? (
              <p>{movieDetails.error}</p>
            ) : movieDetails.id !== selectedMovie ? (
              <p>Error: Movie ID mismatch.</p>
            ) : (
              <>
                {movieDetails.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movieDetails.poster_path}`}
                    alt={`${movieDetails.title} Poster`}
                    className="modal-poster"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                  />
                )}
                <h2>{movieDetails.title} ({movieDetails.release_date ? movieDetails.release_date.split('-')[0] : 'N/A'})</h2>
                <p className="rating">Rating: {movieDetails.vote_average}/10</p>
                <p className="overview">{movieDetails.overview}</p>
                {movieDetails.trailerKey && (
                  <button className="trailer-button" onClick={playTrailer}>Watch Trailer</button>
                )}
                {movieDetails.watchOption && movieDetails.watchOption.url ? (
                  <a href={movieDetails.watchOption.url} target="_blank" rel="noopener noreferrer">
                    <button className="trailer-button" style={{ marginLeft: '10px' }}>
                      Watch Film Now ({movieDetails.watchOption.price})
                    </button>
                  </a>
                ) : movieDetails.subscriptionMessage ? (
                  <p>{movieDetails.subscriptionMessage}</p>
                ) : (
                  <p>No affordable rental option available at this time.</p>
                )}
                <div className="share-buttons">
                  <img
                    src={xIcon}
                    alt="Share on X"
                    className="share-icon"
                    onClick={() => shareOnX(movieDetails)}
                  />
                  <img
                    src={facebookIcon}
                    alt="Share on Facebook"
                    className="share-icon"
                    onClick={() => shareOnFacebook(movieDetails)}
                  />
                  <img
                    src={whatsappIcon}
                    alt="Share on WhatsApp"
                    className="share-icon"
                    onClick={() => shareOnWhatsApp(movieDetails)}
                  />
                  <img
                    src={instagramIcon}
                    alt="Share on Instagram"
                    className="share-icon"
                    onClick={() => shareOnInstagram(movieDetails)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <a
        href="https://your-payment-link.com" // Replace with your actual payment link
        target="_blank"
        rel="noopener noreferrer"
        className="tip-button"
        aria-label="Send a tip to support FilmSeeker"
      >
        <img src={tipIcon} alt="Tip Icon" className="tip-icon" />
      </a>
    </div>
  );
}

export default App;