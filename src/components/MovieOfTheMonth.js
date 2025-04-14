import React from 'react';
import '../styles/MovieOfTheMonth.css';

const MovieOfTheMonth = ({ 
  movieOfTheMonthDetails, 
  showDetails, 
  toggleDetails, 
  closeMovieOfTheMonth,
  playMovieOfTheMonthTrailer 
}) => {
  return (
    <div className="modal" onClick={closeMovieOfTheMonth}>
      <div className="modal-content movie-of-the-month-modal" onClick={(e) => e.stopPropagation()}>
        {!showDetails ? (
          <div className="movie-of-the-month-container">
            <h2>Our Movie of the Month</h2>
            <img
              src={
                movieOfTheMonthDetails.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movieOfTheMonthDetails.poster_path}`
                  : 'https://via.placeholder.com/300x450?text=No+Poster'
              }
              alt={`${movieOfTheMonthDetails.title} Poster`}
              className="movie-of-the-month-poster"
              onClick={toggleDetails}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
            />
            <p className="spotlight-text">Click poster for details</p>
          </div>
        ) : (
          <div className="movie-details-container">
            <h2>Our Movie of the Month</h2>
            <div className="movie-details-header">
              {movieOfTheMonthDetails.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${movieOfTheMonthDetails.poster_path}`}
                  alt={`${movieOfTheMonthDetails.title} Poster`}
                  className="modal-poster"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                />
              )}
              <div className="movie-details-info">
                <h3>
                  {movieOfTheMonthDetails.title} (
                  {movieOfTheMonthDetails.release_date ? movieOfTheMonthDetails.release_date.split('-')[0] : 'N/A'}
                  )
                </h3>
                <p className="rating">{movieOfTheMonthDetails.vote_average.toFixed(1)}/10</p>
                {movieOfTheMonthDetails.genres && movieOfTheMonthDetails.genres.length > 0 && (
                  <div className="genres">
                    {movieOfTheMonthDetails.genres.map(genre => (
                      <span key={genre.id} className="genre-tag">{genre.name}</span>
                    ))}
                  </div>
                )}

                {/* Credits Information */}
                <div className="credits-info">
                  {movieOfTheMonthDetails.directors && movieOfTheMonthDetails.directors.length > 0 && (
                    <div className="credit-section">
                      <span className="credit-label">Director:</span>
                      <span className="credit-names">
                        {movieOfTheMonthDetails.directors.map(director => director.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.writers && movieOfTheMonthDetails.writers.length > 0 && (
                    <div className="credit-section">
                      <span className="credit-label">Writer{movieOfTheMonthDetails.writers.length > 1 ? 's' : ''}:</span>
                      <span className="credit-names">
                        {movieOfTheMonthDetails.writers.map(writer => writer.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {movieOfTheMonthDetails.topCast && movieOfTheMonthDetails.topCast.length > 0 && (
                    <div className="credit-section">
                      <span className="credit-label">Starring:</span>
                      <span className="credit-names">
                        {movieOfTheMonthDetails.topCast.map(actor => actor.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Streaming Services Section - Inline */}
                {movieOfTheMonthDetails.streamingServices && movieOfTheMonthDetails.streamingServices.length > 0 && (
                  <div className="credits-info streaming-section">
                    <div className="credit-section">
                      <span className="credit-label">Watch On:</span>
                      <div className="streaming-logos">
                        {movieOfTheMonthDetails.streamingServices.map(provider => (
                          <a
                            key={provider.provider_id || provider.name}
                            href={provider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Search for ${movieOfTheMonthDetails.title} on ${provider.name}`}
                            className="provider-link"
                          >
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              className="provider-logo"
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
            <div className="overview-container">
              <p className="overview">{movieOfTheMonthDetails.overview}</p>
            </div>

            <div className="movie-actions">
              {movieOfTheMonthDetails.trailerKey && (
                <button className="trailer-button" onClick={playMovieOfTheMonthTrailer}>
                  <span className="trailer-icon">▶</span> Watch Trailer
                </button>
              )}
              <a
                href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(movieOfTheMonthDetails.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="watch-now-button"
              >
                <span>🎬</span> Watch Now
              </a>
              <button className="back-button" onClick={toggleDetails}>
                Back to Poster
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieOfTheMonth;
