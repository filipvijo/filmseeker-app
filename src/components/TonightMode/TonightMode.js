import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, SlidersHorizontal, Check, X, Undo2 } from 'lucide-react';
import { useFilm } from '../../context/FilmContext';
import { createTonightSession, moodGenreQuery } from '../../services/tonightPicks';
import { defaults, timeOptions, moodOptions, sortOptions, languageOptions, languageName, loadTonight, saveTonight, fitsPreferences } from '../../services/tonightPreferences';
import './TonightMode.css';

const movieDetails = new Map();
const summary = form => `${timeOptions[form.time].label} · ${moodOptions[form.mood].label} · ${languageOptions[form.language]} · ${sortOptions[form.sort].label}`;

export default function TonightMode() {
    const { apiKey, watchedFilms, toggleWatched } = useFilm();
    const [state, setState] = useState(() => loadTonight() || { form: defaults, activeForm: defaults, picks: [], skipped: [], collapsed: false, more: false, scrollY: 0, notice: '', undo: null, session: null });
    const current = useRef(state);
    const watched = useRef(watchedFilms);
    watched.current = watchedFilms;
    const session = useRef(null);
    const controllers = useRef(new Set());
    const busy = useRef(false);
    const mounted = useRef(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const results = useRef(null);
    const filters = useRef(null);

    const commit = changes => {
        const next = { ...current.current, ...changes };
        if (session.current) next.session = session.current.snapshot();
        current.current = next;
        setState(next);
        saveTonight(next);
    };

    useLayoutEffect(() => {
        const frame = requestAnimationFrame(() => window.scrollTo(0, current.current.scrollY || 0));
        return () => cancelAnimationFrame(frame);
    }, []);
    useEffect(() => {
        mounted.current = true;
        let frame;
        const rememberScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                current.current = { ...current.current, scrollY: window.scrollY };
                saveTonight(current.current);
            });
        };
        window.addEventListener('scroll', rememberScroll, { passive: true });
        const pending = controllers.current;
        return () => {
            mounted.current = false;
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', rememberScroll);
            pending.forEach(controller => controller.abort());
        };
    }, []);
    useEffect(() => {
        if (!state.undo) return;
        const timer = setTimeout(() => {
            current.current = { ...current.current, undo: null };
            setState(current.current);
            saveTonight(current.current);
        }, Math.max(0, state.undo.expires - Date.now()));
        return () => clearTimeout(timer);
    }, [state.undo]);

    const makeSession = (form, snapshot) => createTonightSession(async page => {
        const controller = new AbortController();
        controllers.current.add(controller);
        try {
            const time = timeOptions[form.time];
            const params = { api_key: apiKey, page, sort_by: sortOptions[form.sort].query, include_adult: false, include_video: false,
                'vote_count.gte': 120, 'vote_average.gte': 6, with_genres: moodGenreQuery(moodOptions[form.mood].genres),
                'with_runtime.gte': time.min, ...(time.max ? { 'with_runtime.lte': time.max } : {}),
                ...(form.language !== 'any' ? { with_original_language: form.language } : {}) };
            const response = await axios.get('https://api.themoviedb.org/3/discover/movie', { params, signal: controller.signal, timeout: 15000 });
            const candidates = response.data.results.filter(movie => movie.poster_path && movie.overview);
            const detailed = await Promise.all(candidates.map(async movie => {
                if (!movieDetails.has(movie.id)) {
                    const detail = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, { params: { api_key: apiKey }, signal: controller.signal, timeout: 15000 });
                    movieDetails.set(movie.id, { runtime: detail.data.runtime, original_language: detail.data.original_language });
                }
                return { ...movie, ...movieDetails.get(movie.id) };
            }));
            return { ...response.data, results: detailed.filter(movie => fitsPreferences(movie, form)) };
        } finally { controllers.current.delete(controller); }
    }, snapshot);

    const activeSession = () => {
        if (!session.current) session.current = makeSession(current.current.activeForm, current.current.session);
        return session.current;
    };
    const excluded = extra => new Set([...watched.current.map(movie => movie.id), ...current.current.skipped, ...extra]);
    const finish = () => { busy.current = false; if (mounted.current) setLoading(false); };

    const search = async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError('');
        const { form, activeForm, picks } = current.current;
        try {
            const nextSession = JSON.stringify(form) === JSON.stringify(activeForm) ? activeSession() : makeSession(form);
            const found = await nextSession.take(6, () => excluded(picks.map(movie => movie.id)));
            if (!mounted.current) return;
            if (!found.length && picks.length) {
                commit({ notice: 'No new matches found. Try a different mood, runtime, or language.', undo: null });
                return;
            }
            session.current = nextSession;
            commit({ picks: found, activeForm: { ...form }, collapsed: found.length > 0, undo: null,
                notice: found.length === 6 ? 'Your six picks are ready.' : `Found ${found.length} unwatched ${found.length === 1 ? 'match' : 'matches'}. Broaden your preferences for more choices.` });
            requestAnimationFrame(() => { results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); results.current?.focus({ preventScroll: true }); });
        } catch (err) {
            if (!axios.isCancel(err) && mounted.current) setError('Could not find new picks. Your shortlist is safe; please try again.');
        } finally { finish(); }
    };

    const replace = async (movie, kind) => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError('');
        const engine = activeSession();
        const before = current.current;
        const slot = before.picks.findIndex(pick => pick.id === movie.id);
        const remaining = before.picks.filter(pick => pick.id !== movie.id);
        const addedWatched = kind === 'watched' && !watched.current.some(pick => pick.id === movie.id);
        const undo = { movie, kind, addedWatched, picks: before.picks, skipped: before.skipped, session: engine.snapshot(), expires: Date.now() + 30000 };
        commit({ picks: remaining, skipped: [...new Set([...before.skipped, movie.id])], undo,
            notice: kind === 'watched' ? `Added ${movie.title} to Watched. Finding a replacement…` : `Skipped ${movie.title} for this session. Finding a replacement…` });
        // Wait for the existing sync operation before enabling Undo, so an add
        // cannot race a subsequent remove on a signed-in account.
        try {
            if (addedWatched) await toggleWatched({ ...movie, poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}` });
            const found = await engine.take(1, () => excluded([...remaining.map(pick => pick.id), movie.id]));
            if (!mounted.current) return;
            const next = [...remaining];
            if (found.length) next.splice(slot, 0, found[0]);
            commit({ picks: next, undo: { ...undo, expires: Date.now() + 30000 },
                notice: `${kind === 'watched' ? 'Marked watched' : 'Not tonight'}: ${movie.title}.${found.length ? ` Replaced with ${found[0].title}.` : ' No replacement found; try broader preferences.'}` });
        } catch (err) {
            if (!axios.isCancel(err) && mounted.current) {
                commit({ undo: { ...undo, expires: Date.now() + 30000 } });
                setError('The replacement could not load. Undo restores the previous shortlist, or find more picks.');
            }
        } finally { finish(); }
    };

    const undoLast = async () => {
        const undo = current.current.undo;
        if (!undo || undo.expires <= Date.now() || busy.current) return;
        busy.current = true;
        setLoading(true);
        if (undo.addedWatched && watched.current.some(movie => movie.id === undo.movie.id)) await toggleWatched(undo.movie);
        if (mounted.current) {
            session.current = makeSession(current.current.activeForm, undo.session);
            commit({ picks: undo.picks, skipped: undo.skipped, undo: null, notice: `Restored ${undo.movie.title} and your previous shortlist.` });
            setError('');
        }
        finish();
    };
    const update = (key, value) => commit({ form: { ...current.current.form, [key]: value } });
    const select = (label, key, options) => <label>{label}<select aria-label={label} disabled={loading} value={state.form[key]} onChange={e => update(key, e.target.value)}>{Object.entries(options).map(([value, option]) => <option key={value} value={value}>{option.label || option}</option>)}</select></label>;

    return <section className="tonight-mode" data-page-ready="true" aria-labelledby="tonight-mode-title">
        <header className="tonight-header"><div><span className="tonight-kicker"><Sparkles size={16} /> Tonight Mode</span><h1 id="tonight-mode-title">Your evening. Six possibilities.</h1><p>Find something worth settling in for. Keep the picks you like, swap the rest.</p></div></header>
        {state.collapsed ? <div className="tonight-filter-summary"><p>{summary(state.activeForm)}</p><button onClick={() => { commit({ collapsed: false }); requestAnimationFrame(() => filters.current?.focus()); }} disabled={loading}><SlidersHorizontal size={16} /> Edit preferences</button></div> : <div className="tonight-filter-panel" ref={filters} tabIndex={-1}>
            <div className="tonight-controls tonight-primary-controls">{select('Time available', 'time', timeOptions)}{select('Mood / genre', 'mood', moodOptions)}</div>
            <button className="tonight-more" aria-expanded={state.more} aria-controls="tonight-more-preferences" onClick={() => commit({ more: !state.more })}><SlidersHorizontal size={16} /> {state.more ? 'Fewer preferences' : 'More preferences'}</button>
            <div id="tonight-more-preferences" hidden={!state.more}><div className="tonight-controls tonight-extra-controls">{select('Sort by', 'sort', sortOptions)}{select('Original language', 'language', languageOptions)}</div><p className="tonight-help">Films rated 6+/10 with at least 120 ratings. Language refers to the original audio; available dubs and subtitles depend on your streaming service.</p></div>
        </div>}
        <div className="tonight-search-actions"><button className="tonight-button" onClick={search} disabled={loading}>{loading ? 'Finding your next pick…' : !state.picks.length ? 'Find my six picks' : !state.collapsed && JSON.stringify(state.form) !== JSON.stringify(state.activeForm) ? 'Apply preferences' : 'Find six more'}</button>{state.skipped.length > 0 && <span className="tonight-help">Skipped films stay out of this session.</span>}</div>
        <div className="tonight-feedback"><p className="tonight-notice" role="status" aria-live="polite">{state.notice}</p>{state.undo && <button className="tonight-undo" onClick={undoLast} disabled={loading}><Undo2 size={16} /> Undo</button>}</div>
        {error && <p className="tonight-error" role="alert">{error}</p>}
        {state.picks.length > 0 && <section className="tonight-results" ref={results} tabIndex={-1} aria-label="Your movie shortlist"><div className="tonight-results-heading"><h2>Your shortlist</h2><span>{state.picks.length} films · Pick one to explore</span></div><div className="tonight-picks">{state.picks.map(movie => <article className="tonight-card" key={movie.id}>
            <Link className="tonight-card-link" to={`/movie/${movie.id}`} onClick={() => saveTonight({ ...current.current, scrollY: window.scrollY })}><img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} width="154" height="231" alt="" loading="lazy" decoding="async" /><div className="tonight-card-copy"><h3>{movie.title}</h3><p className="tonight-card-meta">{movie.release_date?.slice(0,4)} · ★ {movie.vote_average?.toFixed(1)}</p><div className="tonight-badges"><span>{movie.runtime} min</span><span>{languageName(movie.original_language)}</span></div><p className="tonight-overview">{movie.overview}</p><span className="tonight-details">Details & trailer →</span></div></Link>
            <div className="tonight-card-actions"><button onClick={() => replace(movie, 'skip')} disabled={loading} aria-label={`Not tonight: ${movie.title}`}><X size={16} /> Not tonight</button><button onClick={() => replace(movie, 'watched')} disabled={loading} aria-label={`Already watched ${movie.title}`}><Check size={16} /> Already watched</button></div>
        </article>)}</div></section>}
    </section>;
}
