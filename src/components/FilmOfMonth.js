import React from 'react';
import './FilmOfMonth.css';

const FilmOfMonth = ({ 
  movieOfTheMonthDetails, 
  showDetails, 
  toggleDetails, 
  closeMovieOfTheMonth,
  playMovieOfTheMonthTrailer 
}) => {
  return (
    <div className="film-modal-overlay" onClick={closeMovieOfTheMonth}>
      <div className="film-modal-content" onClick={(e) => e.stopPropagation()}>
        {!showDetails ? (
          <div className="film-poster-container">
            <h2 className="film-title">Our Movie of the Month</h2>
            <img
              src={
                movieOfTheMonthDetails.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movieOfTheMonthDetails.poster_path}`
                  : 'https://via.placeholder.com/300x450?text=No+Poster'
              }
              alt={`${movieOfTheMonthDetails.title} Poster`}
              className="film-poster"
              onClick={toggleDetails}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
            />
            <p className="film-click-text">Click poster for details</p>
          </div>
        ) : (
          <div className="film-details-container">
            <h2 className="film-title">Our Movie of the Month</h2>
            <div className="film-details-header">
              {movieOfTheMonthDetails.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${movieOfTheMonthDetails.poster_path}`}
                  alt={`${movieOfTheMonthDetails.title} Poster`}
                  className="film-details-poster"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                />
              )}
              <div className="film-details-info">
                <h3 className="film-details-title">
                  {movieOfTheMonthDetails.title} (
                  {movieOfTheMonthDetails.release_date ? movieOfTheMonthDetails.release_date.split('-')[0] : 'N/A'}
                  )
                </h3>
                <p className="film-rating">{movieOfTheMonthDetails.vote_average.toFixed(1)}/10</p>
                {movieOfTheMonthDetails.genres && movieOfTheMonthDetails.genres.length > 0 && (
                  <div className="film-genres">
                    {movieOfTheMonthDetails.genres.map(genre => (
                      <span key={genre.id} className="film-genre-tag">{genre.name}</span>
                    ))}
                  </div>
                )}

                {/* Credits Information */}
                <div className="film-credits">
                  {movieOfTheMonthDetails.directors && movieOfTheMonthDetails.directors.length > 0 && (
                    <div className="film-credit-section">
                      <span className="film-credit-label">Director:</span>
                      <span className="film-credit-names">
                        {movieOfTheMonthDetails.directors.map(director => director.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.writers && movieOfTheMonthDetails.writers.length > 0 && (
                    <div className="film-credit-section">
                      <span className="film-credit-label">Writer{movieOfTheMonthDetails.writers.length > 1 ? 's' : ''}:</span>
                      <span className="film-credit-names">
                        {movieOfTheMonthDetails.writers.map(writer => writer.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.topCast && movieOfTheMonthDetails.topCast.length > 0 && (
                    <div className="film-credit-section">
                      <span className="film-credit-label">Starring:</span>
                      <span className="film-credit-names">
                        {movieOfTheMonthDetails.topCast.map(actor => actor.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Streaming Services Section */}
                {movieOfTheMonthDetails.streamingServices && movieOfTheMonthDetails.streamingServices.length > 0 && (
                  <div className="film-streaming">
                    <div className="film-credit-section">
                      <span className="film-credit-label">Watch On:</span>
                      <div className="film-streaming-logos">
                        {movieOfTheMonthDetails.streamingServices.map(provider => (
                          <a
                            key={provider.provider_id || provider.name}
                            href={provider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Search for ${movieOfTheMonthDetails.title} on ${provider.name}`}
                            className="film-provider-link"
                          >
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              className="film-provider-logo"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=Logo'; }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="film-overview-container">
              <p className="film-overview">{movieOfTheMonthDetails.overview}</p>
            </div>

            <div className="film-actions">
              {movieOfTheMonthDetails.trailerKey && (
                <button className="film-trailer-button" onClick={playMovieOfTheMonthTrailer}>
                  <span className="film-trailer-icon">▶</span> Watch Trailer
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
              <button className="film-back-button" onClick={toggleDetails}>
                Back to Poster
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilmOfMonth;
