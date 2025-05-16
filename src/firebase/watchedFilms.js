// watchedFilms.js
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Add a film to the user's watched list
 * @param {string} userId - The user's ID
 * @param {object} film - The film object to add
 * @returns {Promise<string>} - The ID of the newly created document
 */
export const addWatchedFilm = async (userId, film) => {
  try {
    const watchedFilmData = {
      userId,
      filmId: film.id,
      title: film.title || film.Title,
      posterPath: film.poster_path || film.poster || (film.Poster ? film.Poster.replace('https://image.tmdb.org/t/p/w500', '') : null),
      addedAt: serverTimestamp(),
    };
    
    // Check if film is already in watched list
    const existingQuery = query(
      collection(db, 'watchedFilms'),
      where('userId', '==', userId),
      where('filmId', '==', film.id)
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      console.log('Film already in watched list');
      return existingDocs.docs[0].id;
    }
    
    const docRef = await addDoc(collection(db, 'watchedFilms'), watchedFilmData);
    console.log('Film added to watched list with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding film to watched list:', error);
    throw error;
  }
};

/**
 * Remove a film from the user's watched list
 * @param {string} userId - The user's ID
 * @param {string} filmId - The film ID to remove
 * @returns {Promise<void>}
 */
export const removeWatchedFilm = async (userId, filmId) => {
  try {
    const watchedQuery = query(
      collection(db, 'watchedFilms'),
      where('userId', '==', userId),
      where('filmId', '==', filmId)
    );
    
    const querySnapshot = await getDocs(watchedQuery);
    
    if (querySnapshot.empty) {
      console.log('Film not found in watched list');
      return;
    }
    
    // Delete the document
    await deleteDoc(doc(db, 'watchedFilms', querySnapshot.docs[0].id));
    console.log('Film removed from watched list');
  } catch (error) {
    console.error('Error removing film from watched list:', error);
    throw error;
  }
};

/**
 * Get all films in the user's watched list
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of watched films
 */
export const getWatchedFilms = async (userId) => {
  try {
    const watchedQuery = query(
      collection(db, 'watchedFilms'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(watchedQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to JS Date
      addedAt: doc.data().addedAt ? doc.data().addedAt.toDate() : new Date(),
    }));
  } catch (error) {
    console.error('Error getting watched films:', error);
    throw error;
  }
};

/**
 * Check if a film is in the user's watched list
 * @param {string} userId - The user's ID
 * @param {string} filmId - The film ID to check
 * @returns {Promise<boolean>} - True if film is in watched list
 */
export const isFilmWatched = async (userId, filmId) => {
  try {
    const watchedQuery = query(
      collection(db, 'watchedFilms'),
      where('userId', '==', userId),
      where('filmId', '==', filmId)
    );
    
    const querySnapshot = await getDocs(watchedQuery);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if film is watched:', error);
    throw error;
  }
};
