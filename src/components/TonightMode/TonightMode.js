import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Sparkles, Users, Languages, Wand2 } from 'lucide-react';
import { useFilm } from '../../context/FilmContext';
import './TonightMode.css';

const moodConfig = {
    tense: { label: 'Tense', genres: '53,80,9648', copy: 'nervy, gripping, suspense-first' },
    funny: { label: 'Funny', genres: '35', copy: 'light, comic, easy to enter' },
    beautiful: { label: 'Beautiful', genres: '18,10749', copy: 'visually rich and emotionally textured' },
    weird: { label: 'Weird', genres: '14,878,9648', copy: 'strange, memorable, slightly off-center' },
    romantic: { label: 'Romantic', genres: '10749,35,18', copy: 'warm, intimate, emotionally direct' },
    brainy: { label: 'Brainy', genres: '878,9648,18', copy: 'idea-driven and conversation-worthy' },
    comfort: { label: 'Comfort', genres: '35,10751,12', copy: 'low-friction, warm, satisfying' }
};

const timeConfig = {
    short: { label: '< 90 min', query: '&with_runtime.lte=90' },
    medium: { label: '90–120 min', query: '&with_runtime.gte=90&with_runtime.lte=120' },
    long: { label: '2h+', query: '&with_runtime.gte=120' }
};

const intensityConfig = {
    easy: { label: 'Easy', minVote: 6.0, sort: 'popularity.desc' },
    medium: { label: 'Medium', minVote: 6.6, sort: 'vote_count.desc' },
    demanding: { label: 'Demanding', minVote: 7.0, sort: 'vote_average.desc' }
};

const languageConfig = {
    any: { label: 'Any language', query: '' },
    noSubtitles: { label: 'No subtitles', query: '&with_original_language=en' },
    subtitlesOk: { label: 'Subtitles ok', query: '' },
    foreign: { label: 'Foreign cinema', query: '&with_original_language=fr' }
};

const audienceConfig = {
    alone: 'Sharper personal pick',
    partner: 'Good two-person compromise',
    friends: 'Good group-night energy'
};

const pickLabels = ['Safest Pick', 'Bold Pick', 'Wildcard'];

const TonightMode = () => {
    const { apiKey } = useFilm();
    const [form, setForm] = useState({
        time: 'medium',
        mood: 'tense',
        intensity: 'medium',
        language: 'subtitlesOk',
        audience: 'partner'
    });
    const [picks, setPicks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const summary = useMemo(() => {
        return `${timeConfig[form.time].label} · ${moodConfig[form.mood].label} · ${intensityConfig[form.intensity].label}`;
    }, [form]);

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const getTonightPicks = async () => {
        setLoading(true);
        setError(null);
        setPicks([]);

        try {
            const mood = moodConfig[form.mood];
            const time = timeConfig[form.time];
            const intensity = intensityConfig[form.intensity];
            const language = languageConfig[form.language];

            const baseParams = [
                `sort_by=${intensity.sort}`,
                'include_adult=false',
                'include_video=false',
                'vote_count.gte=120',
                `vote_average.gte=${intensity.minVote}`,
                `with_genres=${mood.genres}`
            ].join('&');

            const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&${baseParams}${time.query}${language.query}&page=1`;
            const response = await axios.get(url);
            const candidates = response.data.results
                .filter(movie => movie.poster_path && movie.overview)
                .slice(0, 18);

            if (candidates.length < 3) {
                setError('Not enough strong matches. Try a broader mood or language setting.');
                return;
            }

            const selected = [
                candidates[0],
                candidates[Math.min(4, candidates.length - 1)],
                candidates[Math.min(9, candidates.length - 1)]
            ].map((movie, index) => ({
                ...movie,
                pickLabel: pickLabels[index],
                reason: index === 0
                    ? `The most reliable ${mood.copy} option for tonight.`
                    : index === 1
                        ? `A stronger-flavored pick if you want something less obvious.`
                        : `${audienceConfig[form.audience]} with a little surprise factor.`
            }));

            setPicks(selected);
        } catch (err) {
            console.error('Tonight Mode failed', err);
            setError('Tonight Mode could not load picks. Try again in a moment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="tonight-mode" aria-labelledby="tonight-mode-title">
            <div className="tonight-header">
                <div>
                    <span className="tonight-kicker"><Sparkles size={16} /> Tonight Mode</span>
                    <h2 id="tonight-mode-title">Decide what to watch in 30 seconds.</h2>
                    <p>Three picks only: safe, bold, wildcard. No endless scrolling.</p>
                </div>
                <div className="tonight-summary">{summary}</div>
            </div>

            <div className="tonight-controls">
                <label>
                    <Clock size={18} /> Time
                    <select value={form.time} onChange={(e) => update('time', e.target.value)}>
                        {Object.entries(timeConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                </label>

                <label>
                    <Sparkles size={18} /> Mood
                    <select value={form.mood} onChange={(e) => update('mood', e.target.value)}>
                        {Object.entries(moodConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                </label>

                <label>
                    <Wand2 size={18} /> Intensity
                    <select value={form.intensity} onChange={(e) => update('intensity', e.target.value)}>
                        {Object.entries(intensityConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                </label>

                <label>
                    <Languages size={18} /> Language
                    <select value={form.language} onChange={(e) => update('language', e.target.value)}>
                        {Object.entries(languageConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                </label>

                <label>
                    <Users size={18} /> Watching
                    <select value={form.audience} onChange={(e) => update('audience', e.target.value)}>
                        <option value="alone">Alone</option>
                        <option value="partner">With partner</option>
                        <option value="friends">With friends</option>
                    </select>
                </label>
            </div>

            <button className="tonight-button" onClick={getTonightPicks} disabled={loading}>
                {loading ? 'Finding three picks…' : 'Pick Tonight’s Movies'}
            </button>

            {error && <p className="tonight-error">{error}</p>}

            {picks.length > 0 && (
                <div className="tonight-picks">
                    {picks.map(movie => (
                        <Link to={`/movie/${movie.id}`} className="tonight-card" key={`${movie.pickLabel}-${movie.id}`}>
                            <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={movie.title} loading="lazy" decoding="async" />
                            <div>
                                <span>{movie.pickLabel}</span>
                                <h3>{movie.title}</h3>
                                <p className="tonight-card-meta">{movie.release_date?.split('-')[0]} · {movie.vote_average?.toFixed(1)}/10</p>
                                <p>{movie.reason}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
};

export default TonightMode;
