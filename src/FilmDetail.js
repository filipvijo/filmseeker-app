import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Star, Play, User as UserIcon, Check, Share2, Twitter, Facebook as FacebookIcon, Instagram as InstagramIcon } from 'lucide-react';
import './FilmDetail.css';
import { useFilm } from './context/FilmContext';

const FilmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiKey, toggleWatched, isWatched } = useFilm();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);

  const watched = movie ? isWatched(movie.id) : false;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [movieRes, creditsRes, videosRes, providersRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`)
        ]);

        setMovie(movieRes.data);
        setCredits(creditsRes.data);
        setVideos(videosRes.data.results);
        // Get providers with the JustWatch link
        const providerData = providersRes.data.results.US || providersRes.data.results.GB;
        setProviders(providerData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch movie details", err);
        setLoading(false);
      }
    };

    if (apiKey) fetchDetails();
  }, [id, apiKey]);

  if (loading) return <div className="loading-screen">Loading Cinema...</div>;
  if (!movie) return <div className="error-screen">Movie not found.</div>;

  const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube");
  const director = credits?.crew.find(p => p.job === "Director");
  const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
  const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  // Helper for providers
  const streaming = providers?.flatrate || providers?.rent || providers?.buy || [];
  const topProviders = streaming.slice(0, 5); // Limit to 5

  // Crew Helpers
  const getCrew = (job) => credits?.crew?.find(p => p.job === job)?.name || 'N/A';
  const displayCrew = (job, label) => {
    const name = getCrew(job);
    return name !== 'N/A' ? (
      <div className="film-detail-meta-item">
        <span className="film-detail-meta-label">{label}:</span>
        <span className="film-detail-meta-value">{name}</span>
      </div>
    ) : null;
  };

  const shareText = `Check out ${movie.title} on FilmSeeker!`;
  const shareUrl = window.location.href;

  return (
    <motion.div
      className="film-detail-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Backdrop */}
      <div className="detail-hero" style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className="hero-overlay"></div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} /> Back
        </button>

        <div className="hero-content">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="poster-container"
          >
            <img src={posterUrl} alt={movie.title} className="detail-poster" />

            {/* Watched Toggle (Desktop) */}
            <button
              className={`watched-btn-hero ${watched ? 'active' : ''}`}
              onClick={() => toggleWatched(movie)}
            >
              {watched ? <Check size={20} /> : <UserIcon size={20} />}
              {watched ? 'Watched' : 'Mark Watched'}
            </button>
          </motion.div>

          <div className="info-container">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {movie.title} <span className="release-year">({movie.release_date?.split('-')[0]})</span>
            </motion.h1>

            {/* Watched Toggle (Mobile) */}
            <button
              className={`watched-btn-mobile ${watched ? 'active' : ''}`}
              onClick={() => toggleWatched(movie)}
              style={{ display: 'none' }} // Hidden via logic normally, but added for structure
            >
              {watched ? 'Watched' : 'Seen it?'}
            </button>

            <div className="meta-row">
              <span className="meta-tag"><Star size={16} fill="#FFD700" stroke="none" /> {movie.vote_average.toFixed(1)}</span>
              <span className="meta-tag"><Clock size={16} /> {movie.runtime} min</span>
              <span className="meta-tag"><Calendar size={16} /> {movie.release_date}</span>
            </div>

            <div className="genres-row">
              {movie.genres.map(g => (
                <span key={g.id} className="genre-pill">{g.name}</span>
              ))}
            </div>

            <p className="tagline">{movie.tagline}</p>

            <div className="action-row">
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="trailer-btn"
                >
                  <Play size={20} fill="currentColor" /> Watch Trailer
                </a>
              )}
            </div>

            {/* Removed cluttered sections from hero */}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="detail-body">
        <section className="overview-section">
          <h2>Overview</h2>
          <p>{movie.overview}</p>

          <div className="film-detail-meta" style={{ marginTop: '30px' }}>
            <div className="film-detail-meta-item">
              <span className="film-detail-meta-label">Director:</span>
              <span className="film-detail-meta-value">{director?.name}</span>
            </div>

            {displayCrew('Screenplay', 'Writer') || displayCrew('Writer', 'Writer')}
            {displayCrew('Director of Photography', 'Cinematography')}
            {displayCrew('Editor', 'Editing')}
            {displayCrew('Original Music Composer', 'Music')}
            {displayCrew('Production Design', 'Production Design')}
          </div>
        </section>

        <section className="cast-section">
          <h2>Top Cast</h2>
          <div className="cast-grid">
            {credits?.cast.slice(0, 6).map(actor => (
              <div key={actor.id} className="cast-card">
                <div className="cast-img-wrapper">
                  {actor.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`} alt={actor.name} />
                  ) : (
                    <div className="no-img"><UserIcon size={24} /></div>
                  )}
                </div>
                <h3>{actor.name}</h3>
                <p>{actor.character}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Where to Watch */}
        {topProviders.length > 0 && (
          <div className="providers-section">
            <h3>Where to Watch</h3>
            <div className="providers-list">
              {topProviders.map(p => (
                <a
                  key={p.provider_id}
                  className="provider-item"
                  href={providers?.link || `https://www.justwatch.com/us/search?q=${encodeURIComponent(movie.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Watch on ${p.provider_name}`}
                >
                  <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} />
                  <span>{p.provider_name}</span>
                </a>
              ))}
            </div>
            <p className="providers-attribution">
              <a href={providers?.link || `https://www.justwatch.com/us/search?q=${encodeURIComponent(movie.title)}`} target="_blank" rel="noreferrer">
                View all options on JustWatch →
              </a>
            </p>
          </div>
        )}

        {/* Share this film */}
        <div className="share-section">
          <h3>Share this film</h3>
          <div className="share-icons">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="share-icon">
              <Twitter size={18} />
              <span>X</span>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="share-icon">
              <FacebookIcon size={18} />
              <span>Facebook</span>
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="share-icon">
              <Share2 size={18} />
              <span>WhatsApp</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="share-icon">
              <InstagramIcon size={18} />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FilmDetail;
