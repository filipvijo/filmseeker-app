import React from 'react';
import { useFilm } from '../../context/FilmContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Info } from 'lucide-react';
import './BentoGrid.css';

const BentoGrid = () => {
    const { recommendations, isSearching, searchError } = useFilm();

    if (isSearching) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Curating your cinema experience...</p>
            </div>
        );
    }

    if (searchError) {
        return (
            <div className="error-state">
                <p>{searchError}</p>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null; // or a CTA to start searching
    }

    return (
        <div className="bento-container">
            <h3 className="section-title">Curated Selection</h3>
            <motion.div
                className="bento-grid"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                <AnimatePresence>
                    {recommendations.map((movie, index) => (
                        <motion.div
                            key={movie.id}
                            className={`bento-card ${index % 5 === 0 ? 'large' : ''}`} // Make every 5th item large for bento effect
                            variants={{
                                hidden: { opacity: 0, y: 50 },
                                show: { opacity: 1, y: 0 }
                            }}
                            whileHover={{ y: -10, transition: { duration: 0.2 } }}
                            layout
                        >
                            <div className="card-image-wrapper">
                                {movie.Poster ? (
                                    <img src={movie.Poster} alt={movie.Title} loading="lazy" />
                                ) : (
                                    <div className="no-poster"><span>{movie.Title}</span></div>
                                )}
                                <div className="card-overlay">
                                    <h4 className="movie-title">{movie.Title}</h4>
                                    <div className="movie-meta">
                                        <span className="rating">
                                            <Star size={14} fill="#FFC107" color="#FFC107" />
                                            {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                                        </span>
                                        <span className="year">{movie.release_date?.split('-')[0]}</span>
                                    </div>
                                    <Link to={`/movie/${movie.id}`} className="details-btn">
                                        <Info size={16} /> Details
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default BentoGrid;
