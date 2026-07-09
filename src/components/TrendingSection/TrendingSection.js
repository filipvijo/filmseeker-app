import React, { useState } from 'react';
import { useFilm } from '../../context/FilmContext';
import { motion } from 'framer-motion';
import { Star, Play, Calendar, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TrendingSection.css';
import { getFilmOfMonthEditorial } from '../../data/filmOfMonthEditorial';

const TrendingSection = () => {
    const { trendingFilms, movieOfTheMonthDetails: fotm } = useFilm();
    const [copied, setCopied] = useState(false);
    const editorial = getFilmOfMonthEditorial(fotm);

    const shareFilmOfMonth = async () => {
        if (!fotm) return;
        const shareUrl = `${window.location.origin}/movie/${fotm.id}`;
        const shareText = `FilmSeeker's Film of the Month: ${fotm.title}`;

        if (navigator.share) {
            await navigator.share({ title: shareText, text: shareText, url: shareUrl });
            return;
        }

        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="trending-section">

            {/* Film of the Month - Hero Section */}
            {fotm && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fotm-hero"
                    style={{
                        backgroundImage: `linear-gradient(90deg, rgba(5, 10, 28, 0.94) 0%, rgba(5, 10, 28, 0.78) 48%, rgba(5, 10, 28, 0.38) 100%), url(https://image.tmdb.org/t/p/original${fotm.backdrop_path || fotm.poster_path})`
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

                        {editorial && (
                            <div className="fotm-editorial">
                                <article>
                                    <span>Why we picked it</span>
                                    <p>{editorial.whyPicked}</p>
                                </article>
                                <article>
                                    <span>Best watched when</span>
                                    <p>{editorial.bestWatchedWhen}</p>
                                </article>
                                <article>
                                    <span>If you liked</span>
                                    <p>{editorial.ifYouLiked.join(' · ')}</p>
                                </article>
                            </div>
                        )}

                        {fotm.trailerKey && (
                            <div className="fotm-trailer-embed" aria-label={`${fotm.title} trailer`}>
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${fotm.trailerKey}`}
                                    title={`${fotm.title} trailer`}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        <div className="fotm-actions">
                            <Link to={`/movie/${fotm.id}`} className="hero-btn">
                                <Play size={20} fill="currentColor" /> Watch Details
                            </Link>
                            <button type="button" className="hero-btn hero-btn-secondary" onClick={shareFilmOfMonth}>
                                {copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? 'Copied' : 'Share Pick'}
                            </button>
                        </div>
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
