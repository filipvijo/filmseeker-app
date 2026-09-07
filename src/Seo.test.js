import { render, cleanup } from '@testing-library/react';
import { RouteSeo } from './components/Seo';

let mockPath = '/';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }) }), { virtual: true });

afterEach(() => { cleanup(); document.head.innerHTML = ''; });

test('navigation replaces metadata instead of accumulating canonical tags', () => {
  mockPath = '/';
  const view = render(<RouteSeo />);
  mockPath = '/chat';
  view.rerender(<RouteSeo />);
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://www.filmseeker.net/chat');
  expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.title).toContain('AI Movie Recommendations with Dr. FilmBot');
});

test.each(['/watched', '/login', '/swipe', '/match/example-session', '/not-a-page', '/movie-guides/not-a-guide'])('%s is noindex even before content loads', path => {
  mockPath = path;
  render(<RouteSeo />);
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, follow');
});

test('leaving a private page restores indexing on a public guide', () => {
  mockPath = '/match/private-session';
  const view = render(<RouteSeo />);
  mockPath = '/movie-guides/thrillers-under-90-minutes';
  view.rerender(<RouteSeo />);
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
  expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');
  expect(document.querySelector('link[rel="canonical"]').href).toBe(`https://www.filmseeker.net${mockPath}`);
});
