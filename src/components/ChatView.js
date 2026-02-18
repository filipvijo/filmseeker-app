import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { askDrFilmBot } from '../services/aiService';
import AIPersonaSelector, { PERSONAS } from './AIPersonaSelector/AIPersonaSelector';
import { Send, User } from 'lucide-react';
import drFilmBotImg from '../dr-filmbot-illustration.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilm } from '../context/FilmContext';
import './ChatView.css';

const ChatView = () => {
    const navigate = useNavigate();
    const { watchedFilms, toggleWatched, isWatched } = useFilm();

    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: "Hello! I'm Dr. FilmBot. How can I help you find a movie today?", persona: 'dr_filmbot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState('dr_filmbot');
    const messagesEndRef = useRef(null);
    const sendingRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading || sendingRef.current) return;
        sendingRef.current = true;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const persona = PERSONAS[selectedPersona];
            // Pass conversation history (excluding the initial greeting) so the model has context
            const history = messages.filter(m => m.id !== 1);
            const response = await askDrFilmBot(input, watchedFilms, persona, history);

            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                responseType: response.type,
                movies: response.movies || [],
                text: response.content || '',
                rawContent: response.rawContent || response.content || '',
                persona: selectedPersona
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: error.message || "I'm having trouble connecting to my movie database right now.",
                isError: true
            }]);
        } finally {
            setLoading(false);
            sendingRef.current = false;
        }
    };

    const handleMovieClick = (movieId) => {
        if (movieId) {
            navigate(`/movie/${movieId}`);
        }
    };

    const handleMarkWatched = (movie) => {
        if (movie.id) {
            toggleWatched({
                id: movie.id,
                title: movie.title,
                poster: movie.poster
            });
        }
    };

    return (
        <div className="chat-container">
            <Helmet>
                <title>Dr. FilmBot - AI Film Concierge | FilmSeeker</title>
                <meta name="description" content="Chat with Dr. FilmBot, your AI-powered film concierge. Get personalized movie recommendations through natural conversation." />
                <link rel="canonical" href="https://www.filmseeker.net/chat" />
                <meta property="og:title" content="Dr. FilmBot - AI Film Concierge | FilmSeeker" />
                <meta property="og:description" content="Chat with Dr. FilmBot, your AI-powered film concierge. Get personalized movie recommendations through natural conversation." />
                <meta property="og:url" content="https://www.filmseeker.net/chat" />
            </Helmet>
            <div className="chat-hero">
                <div className="bot-hero-avatar">
                    <img src={drFilmBotImg} alt="Dr. FilmBot" />
                </div>
                <h2 className="section-title">AI Film Concierge</h2>
            </div>

            <AIPersonaSelector
                selectedId={selectedPersona}
                onSelect={setSelectedPersona}
            />

            <div className="chat-window">
                <div className="messages-list">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`message ${msg.role}`}
                            >
                                {msg.role === 'user' && (
                                    <div className="message-avatar">
                                        <User size={20} />
                                    </div>
                                )}
                                <div className="message-content">
                                    {msg.role === 'assistant' && (
                                        <div className="persona-badge">
                                            {PERSONAS[msg.persona || 'dr_filmbot']?.name}
                                        </div>
                                    )}

                                    {/* Render movie cards if response contains movies */}
                                    {msg.responseType === 'movies' && msg.movies?.length > 0 ? (
                                        <div className="movie-recommendations">
                                            {msg.movies.map((movie, index) => (
                                                <div key={index} className="movie-card">
                                                    {movie.poster ? (
                                                        <img
                                                            src={movie.poster}
                                                            alt={movie.title}
                                                            className="movie-card-poster"
                                                            onClick={() => handleMovieClick(movie.id)}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="movie-card-poster-placeholder"
                                                            onClick={() => handleMovieClick(movie.id)}
                                                        >
                                                            {movie.title}
                                                        </div>
                                                    )}
                                                    <div className="movie-card-info">
                                                        <h4
                                                            className="movie-card-title"
                                                            onClick={() => handleMovieClick(movie.id)}
                                                        >
                                                            {index + 1}. {movie.title} {movie.year && `(${movie.year})`}
                                                        </h4>

                                                        {movie.id && (
                                                            <button
                                                                className={`movie-card-watched-btn ${isWatched(movie.id) ? 'watched' : ''}`}
                                                                onClick={() => handleMarkWatched(movie)}
                                                            >
                                                                {isWatched(movie.id) ? '✓ Watched' : 'Already watched it'}
                                                            </button>
                                                        )}

                                                        {movie.description && (
                                                            <p className="movie-card-description">{movie.description}</p>
                                                        )}

                                                        {movie.quote && (
                                                            <blockquote className="movie-card-quote">
                                                                "{movie.quote}"
                                                            </blockquote>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="message-bubble">{msg.text}</div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {loading && (
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        placeholder={`Ask ${PERSONAS[selectedPersona].name}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
