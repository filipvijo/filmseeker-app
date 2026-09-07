import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import TonightMode from './TonightMode';
import axios from 'axios';

const mockToggle = jest.fn();
jest.mock('axios', () => ({ get: jest.fn(), isCancel: jest.fn() }));
jest.mock('react-router-dom', () => ({ Link: ({ to, ...props }) => <a href={to} {...props} /> }), { virtual: true });
jest.mock('../../context/FilmContext', () => ({ useFilm: () => {
  const React = require('react');
  const [watchedFilms, setWatched] = React.useState([]);
  return { apiKey: 'test', watchedFilms, toggleWatched: async movie => {
    mockToggle(movie.id);
    setWatched(previous => previous.some(m => m.id === movie.id) ? previous.filter(m => m.id !== movie.id) : [...previous, movie]);
  } };
} }));

beforeEach(() => {
  sessionStorage.clear(); mockToggle.mockClear();
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  axios.isCancel.mockReturnValue(false);
  axios.get.mockImplementation(async url => ({ data: url.includes('/discover/')
    ? { total_pages: 1, results: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: `Test film ${i + 1}`, poster_path: '/p.jpg', overview: 'A film.', vote_average: 7, release_date: '2001-01-01' })) }
    : { runtime: 100, original_language: 'en' } }));
});
afterEach(cleanup);
const start = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Find my six picks' }));
  await screen.findByText('Your six picks are ready.');
};

test('skip replaces one card without changing Watched, and Undo restores the shortlist', async () => {
  render(<TonightMode />); await start();
  expect(screen.getAllByText('100 min')).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: 'Not tonight: Test film 1' }));
  await screen.findByRole('heading', { name: 'Test film 7' });
  expect(screen.queryByRole('heading', { name: 'Test film 1', exact: true })).not.toBeInTheDocument();
  expect(mockToggle).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await screen.findByRole('heading', { name: 'Test film 1', exact: true });
  expect(screen.queryByRole('heading', { name: 'Test film 7', exact: true })).not.toBeInTheDocument();
});

test('watched replacement and Undo update the watched list in both directions', async () => {
  render(<TonightMode />); await start();
  fireEvent.click(screen.getByRole('button', { name: 'Already watched Test film 1', exact: true }));
  await screen.findByRole('heading', { name: 'Test film 7' });
  expect(mockToggle).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await waitFor(() => expect(mockToggle).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole('heading', { name: 'Test film 1', exact: true })).toBeInTheDocument();
});

test('shortlist and collapsed filters survive unmounting and returning', async () => {
  const first = render(<TonightMode />); await start();
  first.unmount();
  render(<TonightMode />);
  expect(screen.getAllByText('100 min')).toHaveLength(6);
  expect(screen.getByRole('button', { name: 'Edit preferences' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Not tonight: Test film 1' }));
  await screen.findByRole('heading', { name: 'Test film 7' });
});


