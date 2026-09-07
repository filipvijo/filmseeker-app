import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFilm } from '../context/FilmContext';
import { X, Film } from 'lucide-react';
import './WatchedView.css';

const WatchedView = () => {
    const { watchedFilms, toggleWatched } = useFilm();
    const navigate = useNavigate();

    const handleFilmClick = (filmId) => {
        navigate(`/movie/${filmId}`);
    };

    const handleRemove = (e, film) => {
        e.stopPropagation();
        toggleWatched(film);
    };

    if (!watchedFilms || watchedFilms.length === 0) {
        return (
            <div className="watched-view">
                <h1 className="section-title">Your Watched Films</h1>
                <div className="watched-empty-state">
                    <Film size={48} strokeWidth={1.5} />
                    <p>Your taste profile starts here.</p>
                    <p className="watched-empty-hint">
                        Mark films as watched and FilmSeeker will learn what you actually like — not just what is trending.
                    </p>
                    <div className="watched-empty-actions">
                        <Link to="/" className="watched-empty-btn primary">Explore recommendations</Link>
                        <Link to="/movie-guides/movies-like-school-ties" className="watched-empty-btn">Explore films like School Ties</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="watched-view">
            <h1 className="section-title">Your Watched Films</h1>
            <p className="watched-count">{watchedFilms.length} film{watchedFilms.length !== 1 ? 's' : ''} watched</p>
            <div className="watched-grid">
                {watchedFilms.map((film) => (
                    <div
                        key={film.id}
                        className="watched-card"
                        onClick={() => handleFilmClick(film.id)}
                    >
                        {film.poster || film.Poster ? (
                            <img
                                src={film.poster || film.Poster}
                                alt={film.title || film.Title}
                                className="watched-poster"
                            />
                        ) : film.poster_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w300${film.poster_path}`}
                                alt={film.title || film.Title}
                                className="watched-poster"
                            />
                        ) : (
                            <div className="watched-poster-placeholder">
                                <Film size={32} />
                            </div>
                        )}
                        <div className="watched-card-overlay">
                            <h3 className="watched-title">{film.title}</h3>
                            <button
                                className="watched-remove-btn"
                                onClick={(e) => handleRemove(e, film)}
                                title="Remove from watched"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WatchedView;
