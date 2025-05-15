// FilmDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './FilmDetail.css';

const FilmDetail = () => {
  const { id } = useParams(); // Get the movie ID from the URL
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [watchProviders, setWatchProviders] = useState([]);
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // Append credits to get director and cast info
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits`
        );
        setMovie(response.data);
        // Fetch watch providers
        const providersRes = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${API_KEY}`
        );
        // Default to US, fallback to any available country
        const country = providersRes.data.results['US']
          ? 'US'
          : Object.keys(providersRes.data.results)[0];
        const providerData = country ? providersRes.data.results[country] : null;
        if (providerData && providerData.flatrate) {
          setWatchProviders(providerData.flatrate);
        } else {
          setWatchProviders([]);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details.');
      }
    };
    fetchMovie();
  }, [id, API_KEY]);

  if (error) {
    return (
      <div className="film-detail-error">
        <div>{error}</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="film-detail-loading">
        <div>Loading...</div>
      </div>
    );
  }

  // Extract director from credits.crew (if available)
  const directorObj =
    movie.credits && movie.credits.crew
      ? movie.credits.crew.find((person) => person.job === 'Director')
      : null;
  const directorName = directorObj ? directorObj.name : 'N/A';

  // Get top 3 main actors from credits.cast
  const actorNames =
    movie.credits && movie.credits.cast
      ? movie.credits.cast.slice(0, 3).map((actor) => actor.name)
      : [];

  // Extract production year from release_date
  const productionYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

  return (
    <div className="film-detail-container">
      <Helmet>
        <title>{movie.title} - FilmSeeker</title>
        <meta property="og:title" content={movie.title} />
        <meta property="og:description" content={movie.overview} />
        {movie.poster_path && (
          <meta
            property="og:image"
            content={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          />
        )}
        <meta property="og:url" content={`https://filmseeker-app.vercel.app/movie/${id}`} />
      </Helmet>

      <div className="film-detail-content">
        <div className="film-detail-header">
          <h1 className="film-detail-title">{movie.title}</h1>
        </div>

        <div className="film-detail-main">
          {movie.poster_path && (
            <div className="film-detail-poster-container">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={`${movie.title} Poster`}
                className="film-detail-poster"
              />
            </div>
          )}

          <div className="film-detail-info">
            <div className="film-detail-meta">
              <div className="film-detail-meta-item">
                <span className="film-detail-meta-label">Critic Score:</span>
                <span className="film-detail-meta-value film-detail-rating">
                  {movie.vote_average.toFixed(1)}/10
                  <span className="film-detail-rating-star" role="img" aria-label="star">⭐</span>
                </span>
              </div>

              <div className="film-detail-meta-item">
                <span className="film-detail-meta-label">Duration:</span>
                <span className="film-detail-meta-value">{movie.runtime} min</span>
              </div>

              <div className="film-detail-meta-item">
                <span className="film-detail-meta-label">Director:</span>
                <span className="film-detail-meta-value">{directorName}</span>
              </div>

              <div className="film-detail-meta-item">
                <span className="film-detail-meta-label">Main Actors:</span>
                <span className="film-detail-meta-value">
                  {actorNames.length > 0 ? actorNames.join(', ') : 'N/A'}
                </span>
              </div>

              <div className="film-detail-meta-item">
                <span className="film-detail-meta-label">Year:</span>
                <span className="film-detail-meta-value">{productionYear}</span>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="film-detail-meta-item">
                  <span className="film-detail-meta-label">Genres:</span>
                  <span className="film-detail-meta-value">
                    {movie.genres.map(genre => genre.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="film-detail-overview">
          {movie.overview}
        </div>

        {/* Streaming Providers Section */}
        {watchProviders.length > 0 && (
          <div className="film-detail-streaming">
            <h3 className="film-detail-streaming-title">Available on:</h3>
            <div className="film-detail-streaming-logos">
              {watchProviders.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={`https://www.justwatch.com/us/provider/${provider.provider_name.toLowerCase().replace(/\s+/g, '-')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={provider.provider_name}
                  className="film-detail-provider-link"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="film-detail-provider-logo"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sharing Section */}
        <div className="film-detail-sharing">
          <h3 className="film-detail-sharing-title">Share this film:</h3>
          <div className="film-detail-sharing-buttons">
            <button
              className="film-detail-share-button"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out ${movie.title} on FilmSeeker!&url=https://filmseeker-app.vercel.app/movie/${id}`, '_blank')}
            >
              <span>🐦</span> Twitter
            </button>
            <button
              className="film-detail-share-button"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://filmseeker-app.vercel.app/movie/${id}`, '_blank')}
            >
              <span>📘</span> Facebook
            </button>
            <button
              className="film-detail-share-button"
              onClick={() => {
                navigator.clipboard.writeText(`https://filmseeker-app.vercel.app/movie/${id}`);
                alert('Link copied to clipboard!');
              }}
            >
              <span>📋</span> Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmDetail;
