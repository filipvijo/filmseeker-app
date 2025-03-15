// FilmDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const FilmDetail = () => {
  const { id } = useParams(); // Get the movie ID from the URL
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // Append credits to get director and cast info
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits`
        );
        setMovie(response.data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details.');
      }
    };
    fetchMovie();
  }, [id, API_KEY]);

  if (error)
    return (
      <div
        style={{
          backgroundColor: '#19225E',
          color: '#fff',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  if (!movie)
    return (
      <div
        style={{
          backgroundColor: '#19225E',
          color: '#fff',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        Loading...
      </div>
    );

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
    <div
      style={{
        backgroundColor: '#19225E',
        minHeight: '100vh',
        color: '#fff',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
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

      <h1 style={{ marginBottom: '20px' }}>{movie.title}</h1>
      {movie.poster_path && (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={`${movie.title} Poster`}
          style={{ width: '300px', borderRadius: '8px', marginBottom: '20px' }}
        />
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', fontSize: '1.1em', lineHeight: '1.6' }}>
        <p>
          <strong>Critic Score:</strong> {movie.vote_average}/10 <span role="img" aria-label="star">⭐️</span>
        </p>
        <p>
          <strong>Duration:</strong> {movie.runtime} min
        </p>
        <p>
          <strong>Director:</strong> {directorName}
        </p>
        <p>
          <strong>Main Actors:</strong> {actorNames.length > 0 ? actorNames.join(', ') : 'N/A'}
        </p>
        <p>
          <strong>Year:</strong> {productionYear}
        </p>
      </div>

      <p style={{ maxWidth: '600px', margin: '20px auto', fontSize: '1.1em', lineHeight: '1.6' }}>
        {movie.overview}
      </p>
    </div>
  );
};

export default FilmDetail;
