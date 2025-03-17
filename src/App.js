import React, { useState, useEffect } from 'react';
import './App.css';
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

// Helper function to convert a string to a URL-friendly slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
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
  const [showDetails, setShowDetails] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // Dr FilmBot States (previously AI Concierge)
  const [drFilmBotUserInput, setDrFilmBotUserInput] = useState('');
  const [drFilmBotSuggestions, setDrFilmBotSuggestions] = useState([]);
  const [isDrFilmBotLoading, setIsDrFilmBotLoading] = useState(false);

  const [message, setMessage] = useState('');

  // TMDB API key from your .env file
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // Map language names to ISO codes
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
        const trailer = videosResponse.data.results.find(
          (video) => video.type === 'Trailer' && video.site === 'YouTube'
        );
        setMovieOfTheMonthDetails({
          ...detailsResponse.data,
          trailerKey: trailer ? trailer.key : null,
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

    // Clear local storage and reset filters on mount
    localStorage.clear();
    setGenre('');
    setDuration('');
    setDecade('');
    setLanguage('');
    setActor('');
    setDirector('');

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

  // getRecommendations (Updated for 16 suggestions)
  const getRecommendations = async () => {
    setIsLoading(true);
    setRecommendations([]);

    const trimmedActor = actor.trim();
    const trimmedDirector = director.trim();
    const hasPreferences =
      genre || duration || decade || language || trimmedActor || trimmedDirector;

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
        const genreId = genres.find((g) => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
        const decadeFilter = decade
          ? `&primary_release_date.gte=${decade}-01-01&primary_release_date.lte=${parseInt(decade) + 9}-12-31`
          : '';
        const languageFilter = language
          ? `&with_original_language=${languageMap[language.toLowerCase()] || language.toLowerCase()}`
          : '';
        const actorFilter = actorId ? `&with_cast=${actorId}` : '';
        const durationFilter = {
          short: '&with_runtime.lte=90',
          medium: '&with_runtime.gte=90&with_runtime.lte=120',
          long: '&with_runtime.gte=120',
        }[duration.toLowerCase()] || '';

        for (let page = 1; page <= 3; page++) {
          const query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}` +
            `${genreId ? `&with_genres=${genreId}` : ''}` +
            `${decadeFilter}${languageFilter}${actorFilter}${durationFilter}` +
            `&sort_by=popularity.desc&page=${page}`;
          const response = await axios.get(query);
          allResults = [...allResults, ...response.data.results];
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
      const genreId = genres.find((g) => g.name.toLowerCase() === genre.toLowerCase())?.id || '';
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
        const matchesGenre = genre ? movie.genres.includes(genreId) : true;
        const matchesLanguage = language
          ? (movie.original_language === languageMap[language.toLowerCase()] ||
             movie.original_language === language.toLowerCase())
          : true;
        const matchesActor = actorId ? movie.cast.includes(parseInt(actorId)) : true;
        return matchesDuration && matchesDecade && matchesGenre && matchesLanguage && matchesActor;
      }).slice(0, 16);  // Changed from 10 to 16

      if (filteredResults.length === 0) {
        setRecommendations([{ id: null, Poster: null, Title: 'No movies found matching your criteria. Try adjusting your preferences.' }]);
      } else {
        setRecommendations(filteredResults.map((movie) => ({
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
      const randomPage = Math.floor(Math.random() * 500) + 1;
      const response = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${randomPage}`
      );
      const movies = response.data.results;
      if (movies.length > 0) {
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        setRecommendations([
          {
            id: randomMovie.id,
            Poster: randomMovie.poster_path ? `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}` : null,
            Title: randomMovie.title,
          },
        ]);
      } else {
        setRecommendations([{ id: null, Poster: null, Title: 'No movies found. Try again!' }]);
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
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&_=${timestamp}`
      );
      const videosResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&_=${timestamp}`
      );
      if (detailsResponse.data.id !== movieId) {
        throw new Error(`Movie ID mismatch: requested ${movieId}, received ${detailsResponse.data.id}`);
      }
      const trailer = videosResponse.data.results.find(
        (video) => video.type === 'Trailer' && video.site === 'YouTube'
      );
      setMovieDetails({
        ...detailsResponse.data,
        trailerKey: trailer ? trailer.key : null,
      });
      setSelectedMovie(movieId);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setMovieDetails({ error: 'Failed to load movie details.' });
    }
  };

  // Fetch movie poster from TMDB
  const fetchMoviePoster = async (movieTitle) => {
    try {
      // Clean the movie title by removing the number, year, and extra spaces
      const cleanTitle = movieTitle.replace(/^\d+\.\s*/, '').replace(/\(\d{4}\)/, '').trim();
      console.log('Fetching poster for movie title:', cleanTitle);
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(cleanTitle)}`
      );
      console.log('TMDB API response for', cleanTitle, ':', response.data);
      const movie = response.data.results[0];
      if (movie && movie.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        console.log('Poster found for', cleanTitle, ':', posterUrl);
        return { id: movie.id, poster: posterUrl };
      } else {
        console.log('No poster found for', cleanTitle);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching poster for ${movieTitle}:`, error);
      return null;
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

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const playMovieOfTheMonthTrailer = () => {
    if (movieOfTheMonthDetails && movieOfTheMonthDetails.trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${movieOfTheMonthDetails.trailerKey}`, '_blank');
    }
  };

  // Social Sharing
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

  // Dr FilmBot Integration (previously AI Concierge)
  const askDrFilmBot = async (userPrompt) => {
    const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    setIsDrFilmBotLoading(true);
    setDrFilmBotSuggestions([]);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a friendly and knowledgeable movie expert named Dr FilmBot who provides personalized film recommendations. When asked for a recommendation, suggest exactly three movies that match the user’s mood or preferences. For each movie, provide the title, year, a short description, and one memorable quote to spark interest. Format your response as a list: 1. Movie Title (Year) - Short Description - "Memorable Quote". 2. Movie Title (Year) - Short Description - "Memorable Quote". 3. Movie Title (Year) - Short Description - "Memorable Quote".',
            },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500, // Increased to accommodate multiple suggestions and quotes
          temperature: 0.8,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
      const aiMessage = response.data.choices[0].message.content.trim();
      console.log('OpenAI response:', aiMessage);
      // Parse the response into a list of movies with titles, descriptions, and quotes
      const suggestions = aiMessage.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split(' - ');
        if (parts.length >= 3) {
          const title = parts[0].trim();
          const quote = parts[parts.length - 1].replace(/"/g, '').trim();
          const description = parts.slice(1, parts.length - 1).join(' - ').trim();
          return { title, description, quote };
        }
        return null;
      }).filter(suggestion => suggestion);
      console.log('Parsed suggestions:', suggestions);
      // Fetch posters for each suggestion
      const suggestionsWithPosters = await Promise.all(
        suggestions.map(async (suggestion) => {
          const posterData = await fetchMoviePoster(suggestion.title);
          return {
            ...suggestion,
            poster: posterData?.poster || null,
            id: posterData?.id || null,
          };
        })
      );
      console.log('Suggestions with posters:', suggestionsWithPosters);
      setDrFilmBotSuggestions(suggestionsWithPosters.slice(0, 3)); // Ensure max 3 suggestions
    } catch (error) {
      console.error('Error fetching Dr FilmBot recommendation:', error);
      setDrFilmBotSuggestions([{ title: 'Error', description: 'Oops! Something went wrong. Please try again.', quote: '' }]);
    } finally {
      setIsDrFilmBotLoading(false);
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

      {/* About Us Modal */}
      {showAboutUs && (
        <div className="modal" onClick={closeAboutUs}>
          <div className="modal-content about-us-modal" onClick={(e) => e.stopPropagation()}>
            <h2>THANK YOU</h2>
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
              <button className="close-button" onClick={closeAboutUs}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Popup */}
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

      {/* Trending Films */}
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

      {/* Film of the Month Button */}
      <div className="film-of-the-month-button-container">
        <button onClick={() => setShowMovieOfTheMonth(true)} className="film-of-the-month-button">
          Film Of The Month
        </button>
      </div>

      {/* Preferences Form */}
      <h1>Add your Preferences</h1>
      <div className="input-container">
        <div className="input-group">
          <img src={iconGenre} alt="Genre Icon" />
          <label>Select a Genre!</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Choose a genre</option>
            {genres.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
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
            {Object.keys(languageMap)
              .filter((lang) => lang !== '')
              .sort()
              .map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
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
        <button onClick={getRecommendations} disabled={isLoading} className={isLoading ? 'button-disabled' : ''}>
          {isLoading ? 'Loading...' : 'Get My Film!'}
        </button>
        <button onClick={getRandomRecommendation} disabled={isLoading} className={isLoading ? 'button-disabled surprise-button' : 'surprise-button'} style={{ marginLeft: '40px' }}>
          {isLoading ? 'Loading...' : 'Surprise Me!'}
        </button>
      </div>

      {/* No Recommendations Message */}
      {recommendations.length === 0 && !isLoading && (
        <p className="no-recommendations">
          No recommendations yet. Select your preferences and click "Get My Film!"
        </p>
      )}

      {/* Recommendations */}
      <div className="recommendation">
        {isLoading ? (
          <div className="spinner"></div>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              {rec.Poster ? (
                <img src={rec.Poster} alt={`Movie Poster ${index + 1}`} className="poster" onClick={() => fetchMovieDetails(rec.id)} />
              ) : (
                <p>{rec.Title}</p>
              )}
            </div>
          ))
        ) : null}
      </div>

      {/* Dr FilmBot Section */}
      <div className="dr-filmbot-section">
        <img
          src={drFilmBotIllustration}
          alt="Dr FilmBot Illustration"
          className="dr-filmbot-illustration"
        />
        <h2>Ask Dr FilmBot</h2>
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
        <button
          className="dr-filmbot-button"
          onClick={() => askDrFilmBot(drFilmBotUserInput)}
          disabled={isDrFilmBotLoading || !drFilmBotUserInput.trim()}
        >
          {isDrFilmBotLoading ? 'Loading...' : 'Get Recommendation'}
        </button>
        {isDrFilmBotLoading ? (
          <div className="spinner" style={{ marginTop: '20px' }}></div>
        ) : drFilmBotSuggestions.length > 0 ? (
          <div className="dr-filmbot-response">
            <h3>Movie Prescription:</h3>
            <div className="recommendation">
              {drFilmBotSuggestions.map((suggestion, index) => (
                <div key={index} className="recommendation-item">
                  {suggestion.poster ? (
                    <img
                      src={suggestion.poster}
                      alt={`${suggestion.title} Poster`}
                      className="poster"
                      onClick={() => suggestion.id && fetchMovieDetails(suggestion.id)}
                      onError={(e) => {
                        console.log(`Failed to load poster for ${suggestion.title}:`, suggestion.poster);
                        e.target.style.display = 'none'; // Hide broken image
                      }}
                    />
                  ) : (
                    <p>{suggestion.title} (No poster available)</p>
                  )}
                  <p>{suggestion.description}</p>
                  {suggestion.quote && (
                    <p className="movie-quote">"{suggestion.quote}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Movie of the Month Modal */}
      {showMovieOfTheMonth && movieOfTheMonthDetails && (
        <div className="modal" onClick={closeMovieOfTheMonth}>
          <div className="modal-content movie-of-the-month-modal" onClick={(e) => e.stopPropagation()}>
            {!showDetails ? (
              <div className="movie-of-the-month-container">
                <h2>Our Movie of the Month</h2>
                <img
                  src={
                    movieOfTheMonthDetails.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movieOfTheMonthDetails.poster_path}`
                      : 'https://via.placeholder.com/300x450?text=No+Poster'
                  }
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
                    <h3>
                      {movieOfTheMonthDetails.title} (
                      {movieOfTheMonthDetails.release_date ? movieOfTheMonthDetails.release_date.split('-')[0] : 'N/A'}
                      )
                    </h3>
                    <p className="rating">Rating: {movieOfTheMonthDetails.vote_average}/10</p>
                    <p className="overview">{movieOfTheMonthDetails.overview}</p>
                    {movieOfTheMonthDetails.trailerKey && (
                      <button className="trailer-button" onClick={playMovieOfTheMonthTrailer}>
                        Watch Trailer
                      </button>
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

      {/* Movie Details Modal */}
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
                  <img src={`https://image.tmdb.org/t/p/w200${movieDetails.poster_path}`} alt={`${movieDetails.title} Poster`} className="modal-poster" onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }} />
                )}
                <h2>
                  {movieDetails.title} (
                  {movieDetails.release_date ? movieDetails.release_date.split('-')[0] : 'N/A'}
                  )
                </h2>
                <p className="rating">Rating: {movieDetails.vote_average}/10</p>
                <p className="overview">{movieDetails.overview}</p>
                {/* Watch Trailer Button */}
                {movieDetails.trailerKey && (
                  <button className="trailer-button" onClick={playTrailer}>
                    Watch Trailer
                  </button>
                )}
                {/* New Watch Now Button */}
                <button
                  className="watch-now-button"
                  onClick={() =>
                    window.open(
                      `https://moviesanywhere.com/movie/${slugify(movieDetails.title)}?show=retailers`,
                      '_blank'
                    )
                  }
                  style={{ marginLeft: '10px' }}
                >
                  Watch Now
                </button>
                {/* Disclaimer for Movies Anywhere */}
                <p className="disclaimer" style={{ fontSize: '0.8em', marginTop: '5px', color: '#d1d5db' }}>
                  Note: Some movies may not be available on Movies Anywhere.
                </p>
                <div className="share-buttons">
                  <img src={xIcon} alt="Share on X" className="share-icon" onClick={() => shareOnX(movieDetails)} />
                  <img src={facebookIcon} alt="Share on Facebook" className="share-icon" onClick={() => shareOnFacebook(movieDetails)} />
                  <img src={whatsappIcon} alt="Share on WhatsApp" className="share-icon" onClick={() => shareOnWhatsApp(movieDetails)} />
                  <img src={instagramIcon} alt="Share on Instagram" className="share-icon" onClick={() => shareOnInstagram(movieDetails)} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tip Button */}
      <a
        href="https://buymeacoffee.com/filmseeker"
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