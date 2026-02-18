import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilm } from '../../context/FilmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Share2, Heart, Copy, Users } from 'lucide-react';
import { 
    createMatchSession, 
    getMatchSession, 
    submitUserBSwipes 
} from '../../services/matchService';
import './SwipeMatch.css';

const MatchSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { getRecommendations, recommendations, isLoading } = useFilm();
    
    // Session state
    const mode = sessionId ? 'join' : 'create'; // 'create' or 'join'
    const [session, setSession] = useState(null);
    const [stack, setStack] = useState([]);
    const [likes, setLikes] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(null);
    const [userName, setUserName] = useState('');
    
    // UI state
    const [showNameInput, setShowNameInput] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [matchResults, setMatchResults] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Load session if joining
    useEffect(() => {
        const loadSessionData = async () => {
            try {
                const sessionData = await getMatchSession(sessionId);
                if (!sessionData) {
                    setError('Session not found. The link may be invalid or expired.');
                    return;
                }
                if (sessionData.status === 'completed') {
                    // Show results directly
                    setMatchResults({
                        mutualMatches: sessionData.movies.filter(m =>
                            sessionData.mutualMatches.includes(m.id)
                        ),
                        userAName: sessionData.userA.name,
                        userBName: sessionData.userB.name,
                        matchCount: sessionData.mutualMatches.length,
                        totalMovies: sessionData.movies.length
                    });
                    return;
                }
                setSession(sessionData);
                setStack(sessionData.movies);
            } catch (err) {
                setError('Failed to load session. Please try again.');
                console.error(err);
            }
        };

        if (sessionId) {
            loadSessionData();
        }
    }, [sessionId]);

    // Load recommendations for new session
    useEffect(() => {
        if (mode === 'create' && !showNameInput && recommendations.length > 0) {
            setStack(recommendations);
        } else if (mode === 'create' && !showNameInput && stack.length === 0 && !isLoading) {
            getRecommendations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, showNameInput, recommendations, isLoading]);

    const handleSwipe = (dir) => {
        if (direction) return;
        setDirection(dir);

        const currentMovie = stack[currentIndex];
        if (dir === 'right' && currentMovie) {
            setLikes(prev => [...prev, currentMovie.id]);
        }

        setTimeout(() => {
            setDirection(null);
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    const handleStartSession = () => {
        if (!userName.trim()) {
            setUserName('Anonymous');
        }
        setShowNameInput(false);
        if (mode === 'create') {
            getRecommendations();
        }
    };

    const handleSessionComplete = async () => {
        if (mode === 'create') {
            // Create session and show share modal
            try {
                const newSessionId = await createMatchSession(stack, likes, userName);
                const link = `${window.location.origin}/match/${newSessionId}`;
                setShareLink(link);
                setShowShareModal(true);
            } catch (err) {
                setError('Failed to create session. Please try again.');
                console.error(err);
            }
        } else {
            // Submit User B's swipes and show results
            try {
                const results = await submitUserBSwipes(sessionId, likes, userName);
                setMatchResults(results);
            } catch (err) {
                setError('Failed to submit your choices. Please try again.');
                console.error(err);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isFinished = currentIndex >= stack.length && stack.length > 0;

    // Trigger completion when finished
    useEffect(() => {
        if (isFinished && !showShareModal && !matchResults) {
            handleSessionComplete();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    // Error state
    if (error) {
        return (
            <div className="match-error">
                <h2>Oops!</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/swipe')}>Start New Session</button>
            </div>
        );
    }

    // Match Results
    if (matchResults) {
        return (
            <div className="match-results-container">
                <div className="match-results-header">
                    <Heart size={48} className="heart-icon" />
                    <h2>It's a Match!</h2>
                    <p className="match-subtitle">
                        {matchResults.userAName} & {matchResults.userBName} both liked{' '}
                        <strong>{matchResults.matchCount}</strong> movie{matchResults.matchCount !== 1 ? 's' : ''}!
                    </p>
                </div>
                
                {matchResults.matchCount > 0 ? (
                    <>
                        <h3 className="match-section-title">Your Movie Night Options 🍿</h3>
                        <div className="match-grid">
                            {matchResults.mutualMatches.map(movie => (
                                <div 
                                    key={movie.id} 
                                    className="match-card"
                                    onClick={() => navigate(`/movie/${movie.id}`)}
                                >
                                    <img src={movie.Poster} alt={movie.Title} />
                                    <span>{movie.Title}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="no-matches">
                        <p>No mutual matches this time 😅</p>
                        <p>Try another round with different movies!</p>
                    </div>
                )}
                
                <button className="restart-btn" onClick={() => navigate('/match')}>
                    <Users size={16} /> Start New Match
                </button>
            </div>
        );
    }

    // Share Modal
    if (showShareModal) {
        return (
            <div className="share-modal-container">
                <div className="share-modal">
                    <Share2 size={48} className="share-icon" />
                    <h2>Share with Your Friend!</h2>
                    <p>Send this link to see which movies you both want to watch:</p>

                    <div className="share-link-box">
                        <input type="text" value={shareLink} readOnly />
                        <button onClick={copyToClipboard}>
                            <Copy size={18} />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="share-buttons">
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`🎬 Let's find a movie to watch together! Swipe on these films and see what we match on: ${shareLink}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="share-btn whatsapp"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`sms:?body=${encodeURIComponent(`🎬 Let's find a movie to watch together! ${shareLink}`)}`}
                            className="share-btn sms"
                        >
                            Text Message
                        </a>
                    </div>

                    <p className="share-note">
                        You liked <strong>{likes.length}</strong> movies.
                        Once your friend swipes, you'll both see your matches!
                    </p>

                    <button className="done-btn" onClick={() => navigate('/')}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // Name Input Screen
    if (showNameInput) {
        return (
            <div className="match-intro">
                <Helmet>
                    <title>Movie Match | FilmSeeker</title>
                    <meta name="description" content="Swipe on movies with a friend and discover what you both want to watch together. Perfect for movie night!" />
                    <link rel="canonical" href="https://www.filmseeker.net/match" />
                    <meta property="og:title" content="Movie Match | FilmSeeker" />
                    <meta property="og:description" content="Swipe on movies with a friend and discover what you both want to watch together. Perfect for movie night!" />
                    <meta property="og:url" content="https://www.filmseeker.net/match" />
                </Helmet>
                <div className="match-icon-container">
                    <Users size={64} color="#00E5FF" />
                </div>
                <h2>{mode === 'create' ? 'Movie Match' : `${session?.userA?.name || 'Someone'} invited you!`}</h2>
                <p className="match-description">
                    {mode === 'create'
                        ? 'Swipe on movies, then share with a friend to find your perfect movie night pick!'
                        : 'Swipe on the same movies and see what you both want to watch!'}
                </p>

                <div className="name-input-container">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleStartSession()}
                    />
                    <button className="start-btn" onClick={handleStartSession}>
                        Start Swiping
                    </button>
                </div>
            </div>
        );
    }

    // Loading State
    if (stack.length === 0 && isLoading) {
        return <div className="match-intro"><h2>Loading Movies...</h2></div>;
    }

    // Swipe UI
    const currentCard = stack[currentIndex];
    if (!currentCard) return null;

    return (
        <div className="swipe-container">
            <Helmet>
                <title>Movie Match | FilmSeeker</title>
                <meta name="description" content="Swipe on movies with a friend and discover what you both want to watch together. Perfect for movie night!" />
                <link rel="canonical" href="https://www.filmseeker.net/match" />
                <meta property="og:title" content="Movie Match | FilmSeeker" />
                <meta property="og:url" content="https://www.filmseeker.net/match" />
            </Helmet>
            <h3 className="section-title">
                {mode === 'create' ? 'Pick Your Movies' : `Matching with ${session?.userA?.name}`}
            </h3>
            <p className="swipe-progress">{currentIndex + 1} / {stack.length}</p>

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
                        <div className="swipe-overlay like" style={{ opacity: direction === 'right' ? 1 : 0 }}>
                            <Check size={48} />
                        </div>
                        <div className="swipe-overlay nope" style={{ opacity: direction === 'left' ? 1 : 0 }}>
                            <X size={48} />
                        </div>
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

export default MatchSession;

