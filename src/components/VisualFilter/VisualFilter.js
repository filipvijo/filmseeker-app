import React from 'react';
import { useFilm } from '../../context/FilmContext';
import { motion } from 'framer-motion';
import {
    Ghost, // Horror
    Swords, // Action
    Heart, // Romance
    Laugh, // Comedy
    Rocket, // Sci-fi
    Drama, // Drama
    Search, // Mystery
    Music, // Musical
    Skull, // Thriller 
    Film // Default icon
} from 'lucide-react';
import './VisualFilter.css';

// Mapping genres to icons and colors
const genreConfig = {
    28: { icon: Swords, color: 'linear-gradient(135deg, #FF4B1F, #FF9068)', label: 'Action' },
    12: { icon: Rocket, color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', label: 'Adventure' },
    16: { icon: Ghost, color: 'linear-gradient(135deg, #FDBB2D, #22C1C3)', label: 'Animation' }, // Just a placeholder
    35: { icon: Laugh, color: 'linear-gradient(135deg, #f7797d, #FBD786, #C6FFDD)', label: 'Comedy' },
    80: { icon: Skull, color: 'linear-gradient(135deg, #000000, #434343)', label: 'Crime' },
    99: { icon: Search, color: 'linear-gradient(135deg, #1D976C, #93F9B9)', label: 'Documentary' },
    18: { icon: Drama, color: 'linear-gradient(135deg, #2b5876, #4e4376)', label: 'Drama' },
    10751: { icon: Heart, color: 'linear-gradient(135deg, #ff9a9e, #fecfef)', label: 'Family' },
    14: { icon: Ghost, color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', label: 'Fantasy' },
    36: { icon: Search, color: 'linear-gradient(135deg, #EF629F, #EECDA3)', label: 'History' },
    27: { icon: Ghost, color: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', label: 'Horror' },
    10402: { icon: Music, color: 'linear-gradient(135deg, #C9FFBF, #FFAFBD)', label: 'Music' },
    9648: { icon: Search, color: 'linear-gradient(135deg, #614385, #516395)', label: 'Mystery' },
    10749: { icon: Heart, color: 'linear-gradient(135deg, #4568DC, #B06AB3)', label: 'Romance' },
    878: { icon: Rocket, color: 'linear-gradient(135deg, #4facfe, #00f2fe)', label: 'Sci-Fi' },
    53: { icon: Skull, color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', label: 'Thriller' },
    10752: { icon: Swords, color: 'linear-gradient(135deg, #1c92d2, #f2fcfe)', label: 'War' },
    37: { icon: Swords, color: 'linear-gradient(135deg, #DA4453, #89216B)', label: 'Western' },
};

const VisualFilter = () => {
    const { genres, preferences, updatePreference } = useFilm();

    // Filter top common genres to keep UI clean, or show all
    // For Bento grid feel, we might want a limited set or a nice grid of all
    const displayGenres = genres.filter(g => genreConfig[g.id]);

    return (
        <div className="visual-filter-container">
            <h3 className="filter-title">Choose your Vibe</h3>
            <div className="genre-grid">
                {displayGenres.map((genre) => {
                    const config = genreConfig[genre.id] || { icon: Film, color: '#333', label: genre.name };
                    const Icon = config.icon;
                    const currentGenres = preferences.genre ? preferences.genre.split(',') : [];
                    const isSelected = currentGenres.includes(genre.id.toString());

                    return (
                        <motion.div
                            key={genre.id}
                            className={`genre-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => updatePreference('genre', genre.id.toString())}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div
                                className="genre-background"
                                style={{ background: config.color }}
                            />
                            <div className="genre-content">
                                <Icon size={24} color="#fff" />
                                <span className="genre-name">{genre.name}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default VisualFilter;
