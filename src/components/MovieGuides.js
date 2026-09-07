import React from 'react';
import { Link, useParams } from 'react-router-dom';
import guides from '../data/movieGuides.json';
import './MovieGuides.css';
import { languageName } from '../services/tonightPreferences';

export function GuideLinks() {
  return <section className="guide-links" aria-labelledby="guide-links-title">
    <div className="guide-section-heading"><h2 id="guide-links-title">A little direction for movie night</h2><Link to="/movie-guides">All movie guides →</Link></div>
    <div className="guide-grid">{guides.map(guide => <Link className="guide-card" to={`/movie-guides/${guide.slug}`} key={guide.slug}><div className="guide-poster-strip" aria-hidden="true">{guide.picks.map(pick => <img key={pick.id} src={`https://image.tmdb.org/t/p/w185${pick.posterPath}`} alt="" width="185" height="278" loading="lazy" />)}</div><h3>{guide.title}</h3><p>{guide.description}</p><span>Explore the picks →</span></Link>)}</div>
  </section>;
}

export function GuideIndex() {
  return <div className="guide-page" data-page-ready="true"><p className="guide-eyebrow">THE FILMSEEKER SHORTLIST</p><h1>Less scrolling. More movie nights.</h1><p className="guide-intro">A few thoughtful picks beat an endless list. Explore films by the time you have, the mood you share, or a story you already love.</p><GuideLinks /><Link className="guide-cta" to="/chat">Ask Dr. FilmBot for a personal recommendation →</Link></div>;
}

export function MovieGuide() {
  const { slug } = useParams();
  const guide = guides.find(g => g.slug === slug);
  if (!guide) return <NotFound />;
  return <article className="guide-page" data-page-ready="true">
    <Link to="/movie-guides">← Movie guides</Link>
    <p className="guide-eyebrow">A SHORTLIST WITH A REASON</p><h1>{guide.title}</h1>
    <p className="guide-intro">{guide.intro}</p>
    <section className="guide-method"><h2>How to choose</h2><p>{guide.method}</p></section>
    <ol className="guide-picks">{guide.picks.map(pick => <li key={pick.id} className="guide-film"><Link className="guide-poster-link" to={`/movie/${pick.id}`} aria-label={`View ${pick.title}`}><img className="guide-poster" src={`https://image.tmdb.org/t/p/w342${pick.posterPath}`} alt={`${pick.title} poster`} width="154" height="231" loading="lazy" /></Link><div className="guide-film-copy">
      <h2><Link to={`/movie/${pick.id}`}>{pick.title} <span>({pick.year})</span></Link></h2>
      <div className="guide-film-badges"><span>{pick.runtime} min</span><span>{languageName(pick.originalLanguage)}</span></div><p>{pick.reason}</p><p className="guide-fit"><strong>Tonight’s fit:</strong> {pick.fit}</p>
      <Link to={`/movie/${pick.id}`}>Runtime, cast, and trailer →</Link></div>
    </li>)}</ol>
    <section className="guide-method"><h2>Make it your movie night</h2><p>{guide.tip}</p><div className="guide-actions"><Link className="guide-cta" to="/">Find my movie</Link><Link className="guide-cta secondary" to="/match">Match with a friend</Link></div></section>
    <GuideLinks />
  </article>;
}

export function NotFound() {
  return <section className="guide-page" data-page-ready="true"><p className="guide-eyebrow">404 · PAGE NOT FOUND</p><h1>This page is out of the picture.</h1><p>The link may be incorrect or the page may have moved.</p><Link className="guide-cta" to="/">Find a movie instead →</Link></section>;
}
