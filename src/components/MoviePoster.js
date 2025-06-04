import React, { useState } from 'react';
import './MoviePoster.css';

/**
 * MoviePoster component for consistent movie poster styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size] - Poster size ('small', 'medium', 'large')
 * @param {boolean} [props.isWatched] - Whether the movie has been watched
 * @param {Function} [props.onClick] - Click handler
 * @param {Function} [props.onMarkWatched] - Handler for marking as watched
 * @returns {JSX.Element} - Rendered component
 */
const MoviePoster = ({ 
  src, 
  alt, 
  className = '', 
  size = 'medium',
  isWatched = false,
  onClick,
  onMarkWatched
}) => {
  const [imageError, setImageError] = useState(false);
  const [watchedButtonClicked, setWatchedButtonClicked] = useState(false);
  
  const sizeClass = `movie-poster--${size}`;
  const watchedClass = isWatched ? 'movie-poster--watched' : '';
  const clickableClass = onClick ? 'movie-poster--clickable' : '';
  
  const handleError = () => {
    setImageError(true);
  };
  
  const handleMarkWatched = (e) => {
    if (onMarkWatched) {
      e.stopPropagation();
      setWatchedButtonClicked(true);
      
      // Reset animation after it completes
      setTimeout(() => {
        setWatchedButtonClicked(false);
      }, 500);
      
      onMarkWatched();
    }
  };
  
  return (
    <div className={`movie-poster-container ${className}`}>
      {imageError ? (
        <div 
          className={`movie-poster-placeholder ${sizeClass} ${watchedClass} ${clickableClass}`}
          onClick={onClick}
        >
          <span>{alt}</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`movie-poster ${sizeClass} ${watchedClass} ${clickableClass}`}
          onClick={onClick}
          onError={handleError}
        />
      )}
      
      {isWatched && (
        <div className="movie-poster-badge">Watched</div>
      )}
      
      {onMarkWatched && !isWatched && (
        <button 
          className={`movie-poster-watched-button ${watchedButtonClicked ? 'movie-poster-watched-button--clicked' : ''}`}
          onClick={handleMarkWatched}
          aria-label="Mark as watched"
        >
          Already watched it
        </button>
      )}
    </div>
  );
};

export default MoviePoster;
