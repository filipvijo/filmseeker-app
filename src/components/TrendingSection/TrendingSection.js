import React from 'react';
import { useFilm } from '../../context/FilmContext';
import { motion } from 'framer-motion';
import { Star, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TrendingSection.css';

const TrendingSection = () => {
    const { trendingFilms, movieOfTheMonthDetails: fotm } = useFilm();

    return (
        <div className="trending-section">

            {/* Film of the Month - Hero Section */}
            {fotm && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fotm-hero"
                    style={{
                        backgroundImage: `linear-gradient(to top, #1a2151 10%, transparent 90%), url(https://image.tmdb.org/t/p/original${fotm.backdrop_path || fotm.poster_path})`
                    }}
                >
                    <div className="fotm-content">
                        <div className="fotm-badge">Film of the Month</div>
                        <h2>{fotm.title}</h2>
                        <p className="fotm-overview">{fotm.overview?.slice(0, 150)}...</p>

                        <div className="fotm-meta">
                            <span><Star size={16} fill="gold" stroke="none" /> {fotm.vote_average?.toFixed(1)}</span>
                            <span><Calendar size={16} /> {fotm.release_date?.split('-')[0]}</span>
                        </div>

                        <Link to={`/movie/${fotm.id}`} className="hero-btn">
                            <Play size={20} fill="currentColor" /> Watch Details
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Trending Carousel */}
            <div className="trending-list-container">
                <h3 className="section-title">Trending This Week</h3>
                <div className="trending-grid">
                    {trendingFilms.map((film, index) => (
                        <motion.div
                            key={film.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="trending-card"
                        >
                            <Link to={`/movie/${film.id}`}>
                                <img src={film.Poster} alt={film.Title} />
                                <div className="trending-idx">#{index + 1}</div>
                                <div className="trending-overlay">
                                    <h4>{film.Title}</h4>
                                    <span>{film.vote_average.toFixed(1)} ★</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrendingSection;
