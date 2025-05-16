// WatchedFilmsPage.js
import React, { useState, useEffect } from 'react';
import { getWatchedFilms, removeWatchedFilm } from '../firebase/watchedFilms';
import '../App.css';

const WatchedFilmsPage = ({ user, onClose, fetchMovieDetails }) => {
  const [watchedFilms, setWatchedFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatchedFilms = async () => {
      if (!user || !user.uid) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Try to get films from Firebase first
        try {
          const films = await getWatchedFilms(user.uid);
          setWatchedFilms(films);
        } catch (firebaseErr) {
          console.error('Firebase error:', firebaseErr);

          // If Firebase fails, get films from localStorage
          const localWatchedFilms = localStorage.getItem('watchedFilms');
          if (localWatchedFilms) {
            const parsedFilms = JSON.parse(localWatchedFilms);
            // Convert the stored data to match the format expected by the component
            const formattedFilms = parsedFilms.map(film => ({
              id: film.id,
              filmId: film.id,
              title: film.title,
              posterPath: film.poster,
              addedAt: new Date()
            }));
            setWatchedFilms(formattedFilms);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching watched films:', err);
        setError('Failed to load your watched films. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchWatchedFilms();
  }, [user]);

  const handleRemoveFilm = async (filmId) => {
    if (!user || !user.uid) return;

    try {
      // Try to remove from Firebase
      try {
        await removeWatchedFilm(user.uid, filmId);
      } catch (firebaseErr) {
        console.error('Firebase error removing film:', firebaseErr);

        // If Firebase fails, update localStorage
        const localWatchedFilms = localStorage.getItem('watchedFilms');
        if (localWatchedFilms) {
          const parsedFilms = JSON.parse(localWatchedFilms);
          const updatedFilms = parsedFilms.filter(film => film.id !== filmId);
          localStorage.setItem('watchedFilms', JSON.stringify(updatedFilms));
        }
      }

      // Update the local state to reflect the removal
      setWatchedFilms(prevFilms => prevFilms.filter(film => film.filmId !== filmId));
    } catch (err) {
      console.error('Error removing film:', err);
      setError('Failed to remove film. Please try again.');
    }
  };

  const handleFilmClick = (filmId) => {
    if (fetchMovieDetails) {
      fetchMovieDetails(filmId);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content watched-films-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="watched-films-title">Your Watched Films</h2>

        {isLoading ? (
          <div className="spinner"></div>
        ) : error ? (
          <div>
            <p className="error-message">{error}</p>
            <p className="no-watched-films">
              In the meantime, you can still use the "Already watched it" button to keep track of films you've seen.
              Your selections will be stored locally in your browser.
            </p>
          </div>
        ) : watchedFilms.length === 0 ? (
          <p className="no-watched-films">
            You haven't marked any films as watched yet.
            When you find a film you've watched, click the "Already watched it" button to add it to this list.
          </p>
        ) : (
          <div className="watched-films-grid">
            {watchedFilms.map((film) => (
              <div key={film.id || film.filmId} className="watched-film-item">
                {film.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${film.posterPath}`}
                    alt={`${film.title} Poster`}
                    className="watched-film-poster"
                    onClick={() => handleFilmClick(film.filmId || film.id)}
                  />
                ) : (
                  <div
                    className="watched-film-poster-placeholder"
                    onClick={() => handleFilmClick(film.filmId || film.id)}
                  >
                    {film.title}
                  </div>
                )}
                <div className="watched-film-details">
                  <h3 className="watched-film-title">{film.title}</h3>
                  <p className="watched-date">
                    Added: {film.addedAt ? film.addedAt.toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                  <button
                    className="remove-watched-button"
                    onClick={() => handleRemoveFilm(film.filmId || film.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WatchedFilmsPage;
