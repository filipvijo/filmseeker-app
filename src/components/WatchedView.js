import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
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
                <h2 className="section-title">Your Watched Films</h2>
                <div className="watched-empty-state">
                    <Film size={48} strokeWidth={1.5} />
                    <p>No films marked as watched yet.</p>
                    <p className="watched-empty-hint">
                        When you watch a film, click "Mark Watched" on the film detail page to add it here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="watched-view">
            <Helmet>
                <title>Watched Films | FilmSeeker</title>
                <meta name="description" content="Track all the movies you've watched. Your personal film diary on FilmSeeker." />
                <link rel="canonical" href="https://www.filmseeker.net/watched" />
                <meta property="og:title" content="Watched Films | FilmSeeker" />
                <meta property="og:description" content="Track all the movies you've watched. Your personal film diary on FilmSeeker." />
                <meta property="og:url" content="https://www.filmseeker.net/watched" />
            </Helmet>
            <h2 className="section-title">Your Watched Films</h2>
            <p className="watched-count">{watchedFilms.length} film{watchedFilms.length !== 1 ? 's' : ''} watched</p>
            <div className="watched-grid">
                {watchedFilms.map((film) => (
                    <div
                        key={film.id}
                        className="watched-card"
                        onClick={() => handleFilmClick(film.id)}
                    >
                        {film.poster_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w300${film.poster_path}`}
                                alt={film.title}
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
