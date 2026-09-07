import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import guides from '../data/movieGuides.json';

const origin = 'https://www.filmseeker.net';
export default function Seo({ title, description, path, noindex = false, image = `${origin}/logo512.png`, type = 'website' }) {
  return <Helmet defer={false}>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
    {path && <link rel="canonical" href={`${origin}${path}`} />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:image" content={image} />
    {path && <meta property="og:url" content={`${origin}${path}`} />}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>;
}

export function RouteSeo() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  // Movie metadata belongs to FilmDetail, including its loading and error states.
  if (/^\/movie\/[^/]+$/.test(path)) return null;
  const guide = guides.find(g => path === `/movie-guides/${g.slug}`);
  const pages = {
    '/': ['AI Movie Recommendations & Film Finder | FilmSeeker', 'Find your next movie by mood, time, and taste. Get six picks for tonight, chat with Dr. FilmBot, or match movies with a friend.'],
    '/tonight': ['Tonight Mode: Find Six Movies to Watch | FilmSeeker', 'Get six movie recommendations for tonight. Mark films you have already watched to replace them immediately, and discover new picks by mood and runtime.'],
    '/chat': ['AI Movie Recommendations with Dr. FilmBot | FilmSeeker', 'Describe your mood, favorite films, and time limit. Dr. FilmBot helps you find movies through a conversation, with examples to get started.'],
    '/movie-guides': ['Movie Guides for Your Next Film Night | FilmSeeker', 'Browse curated movie guides with specific reasons to watch: short thrillers, films like School Ties, and picks for an evening together.'],
    '/swipe': ['Swipe Movie Picks | FilmSeeker', 'Swipe through films and build a shortlist for your next movie night.'],
    '/match': ['Find a Movie You Both Want to Watch | FilmSeeker', 'Create a movie matching session, share the link, and discover films you and a friend both want to watch.'],
    '/watched': ['Your Watched Films | FilmSeeker', 'Keep track of the films you have watched.'],
    '/login': ['Sign In | FilmSeeker', 'Sign in to save your FilmSeeker movie preferences.']
  };
  const page = guide ? [`${guide.title} | FilmSeeker`, guide.description] : pages[path];
  const noindex = !page || ['/watched', '/login', '/swipe'].includes(path) || path.startsWith('/match/');
  return <Seo title={page?.[0] || 'FilmSeeker'} description={page?.[1] || 'Find your next movie with FilmSeeker.'} path={page ? path : undefined} noindex={noindex} />;
}
