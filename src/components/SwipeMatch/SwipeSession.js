import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilm } from '../../context/FilmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Users, RefreshCw } from 'lucide-react';
import './SwipeMatch.css';

const SwipeSession = () => {
    const { getRecommendations, recommendations, isLoading } = useFilm();
    const navigate = useNavigate();
    const [stack, setStack] = useState([]);
    const [matches, setMatches] = useState([]);
    const [direction, setDirection] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Initial load
    useEffect(() => {
        if (recommendations.length > 0) {
            setStack(recommendations);
            setCurrentIndex(0);
        } else if (stack.length === 0 && !isLoading) {
            getRecommendations();
        }
    }, [recommendations, getRecommendations, isLoading, stack.length]);

    const handleSwipe = (dir) => {
        if (direction) return; // Prevent double swipe
        setDirection(dir);

        // Immediate logic for match
        const currentMovie = stack[currentIndex];
        if (dir === 'right' && currentMovie) {
            setMatches(prev => [...prev, currentMovie]);
        }

        // Wait for animation then advance index
        setTimeout(() => {
            setDirection(null);
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    const startSession = () => {
        getRecommendations();
    };

    const isFinished = currentIndex >= stack.length;

    // Loading State
    if (stack.length === 0 && !isFinished && isLoading) {
        return <div className="swipe-intro"><h2>Loading Films...</h2></div>;
    }

    // Intro State
    if (stack.length === 0 && !isFinished && !isLoading) {
        return (
            <div className="swipe-intro">
                <div className="swipe-icon-container"><Users size={64} color="#00E5FF" /></div>
                <h2>Sync & Swipe</h2>
                <button className="start-btn" onClick={startSession}>Start Session</button>
            </div>
        );
    }

    // Finished State
    if (isFinished) {
        return (
            <div className="match-results">
                <h2>Session Complete!</h2>
                <div className="match-grid">
                    {matches.map(m => (
                        <div
                            key={m.id}
                            className="match-card"
                            onClick={() => navigate(`/movie/${m.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img src={m.Poster} alt={m.Title} />
                            <span>{m.Title}</span>
                        </div>
                    ))}
                </div>
                <button className="restart-btn" onClick={() => { setMatches([]); setCurrentIndex(0); startSession(); }}>
                    <RefreshCw size={16} /> Play Again
                </button>
            </div>
        );
    }

    const currentCard = stack[currentIndex];

    // Ensure we have a card to show
    if (!currentCard) return null;

    return (
        <div className="swipe-container">
            <h3 className="section-title">Swipe Mode</h3>
            <div className="card-stack">
                <AnimatePresence>
                    <motion.div
                        key={currentCard.id}
                        className="swipe-card"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            x: direction === 'left' ? -1000 : direction === 'right' ? 1000 : 0,
                            rotate: direction === 'left' ? -45 : direction === 'right' ? 45 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(e, { offset }) => {
                            if (offset.x < -50) handleSwipe('left');
                            else if (offset.x > 50) handleSwipe('right');
                        }}
                    >
                        <img src={currentCard.Poster} alt={currentCard.Title} draggable="false" />
                        <div className="swipe-info">
                            <h3>{currentCard.Title}</h3>
                            <p>{currentCard.release_date?.split('-')[0]} • {currentCard.vote_average?.toFixed(1)}/10</p>
                        </div>

                        <div className="swipe-overlay like" style={{ opacity: direction === 'right' ? 1 : 0 }}><Check size={48} /></div>
                        <div className="swipe-overlay nope" style={{ opacity: direction === 'left' ? 1 : 0 }}><X size={48} /></div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="swipe-controls">
                <button className="control-btn nope" onClick={() => handleSwipe('left')}><X size={32} /></button>
                <button className="control-btn like" onClick={() => handleSwipe('right')}><Check size={32} /></button>
            </div>
        </div>
    );
};

export default SwipeSession;
