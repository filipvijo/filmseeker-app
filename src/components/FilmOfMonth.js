import React from 'react';
import './FilmOfMonth.css';

const FilmOfMonth = ({
  movieOfTheMonthDetails,
  closeMovieOfTheMonth,
  playMovieOfTheMonthTrailer
}) => {
  return (
    <div className="film-modal-overlay" onClick={closeMovieOfTheMonth}>
      <div className="film-modal-content" onClick={(e) => e.stopPropagation()}>
        {
          <div className="film-detail-container">
            <div className="film-detail-header">
              <h2 className="film-detail-title">
                {movieOfTheMonthDetails.title}
                <span className="film-detail-year">
                  ({movieOfTheMonthDetails.release_date ? movieOfTheMonthDetails.release_date.split('-')[0] : 'N/A'})
                </span>
              </h2>
            </div>

            <div className="film-detail-content">
              <div className="film-detail-poster-container">
                {movieOfTheMonthDetails.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movieOfTheMonthDetails.poster_path}`}
                    alt={`${movieOfTheMonthDetails.title} Poster`}
                    className="film-detail-poster"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                  />
                )}
              </div>

              <div className="film-detail-info">
                <div className="film-detail-meta">
                  <div className="film-detail-rating">
                    <span className="rating-star">★</span> {movieOfTheMonthDetails.vote_average.toFixed(1)}/10
                  </div>

                  {movieOfTheMonthDetails.genres && movieOfTheMonthDetails.genres.length > 0 && (
                    <div className="film-detail-genres">
                      {movieOfTheMonthDetails.genres.map(genre => (
                        <span key={genre.id} className="film-genre-tag">{genre.name}</span>
                      ))}
                    </div>
                  )}

                  {movieOfTheMonthDetails.runtime && (
                    <div className="film-detail-runtime">
                      <span className="detail-label">Runtime:</span> {movieOfTheMonthDetails.runtime} min
                    </div>
                  )}

                  {movieOfTheMonthDetails.directors && movieOfTheMonthDetails.directors.length > 0 && (
                    <div className="film-detail-director">
                      <span className="detail-label">Director:</span>
                      <span className="detail-value">
                        {movieOfTheMonthDetails.directors.map(director => director.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.writers && movieOfTheMonthDetails.writers.length > 0 && (
                    <div className="film-detail-writer">
                      <span className="detail-label">Writer{movieOfTheMonthDetails.writers.length > 1 ? 's' : ''}:</span>
                      <span className="detail-value">
                        {movieOfTheMonthDetails.writers.map(writer => writer.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.topCast && movieOfTheMonthDetails.topCast.length > 0 && (
                    <div className="film-detail-cast">
                      <span className="detail-label">Starring:</span>
                      <span className="detail-value">
                        {movieOfTheMonthDetails.topCast.map(actor => actor.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="film-detail-overview">
              <h3 className="overview-title">Overview</h3>
              <p>{movieOfTheMonthDetails.overview}</p>
            </div>

            {/* Streaming Services Section */}
            {movieOfTheMonthDetails.streamingServices && movieOfTheMonthDetails.streamingServices.length > 0 && (
              <div className="film-detail-streaming">
                <h3 className="streaming-title">Where to Watch</h3>
                <div className="streaming-providers">
                  {movieOfTheMonthDetails.streamingServices.map(provider => (
                    <a
                      key={provider.provider_id || provider.name}
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Watch ${movieOfTheMonthDetails.title} on ${provider.name}`}
                      className="provider-link"
                    >
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="provider-logo"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/45x45?text=Logo'; }}
                      />
                      <span className="provider-name">{provider.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="film-detail-actions">
              {movieOfTheMonthDetails.trailerKey && (
                <button className="film-trailer-button" onClick={playMovieOfTheMonthTrailer}>
                  <span className="trailer-icon">▶</span> Watch Trailer
                </button>
              )}

              <a
                href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(movieOfTheMonthDetails.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="film-watch-button"
              >
                <span>🎬</span> Watch Now
              </a>

              <button className="film-back-button" onClick={closeMovieOfTheMonth}>
                Close
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default FilmOfMonth;
