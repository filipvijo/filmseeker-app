import { db } from '../firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

// Generate a short unique ID for the session
const generateSessionId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Create a new match session with User A's movies and swipes
 * @param {Array} movies - The 12 movies shown to User A
 * @param {Array} userALikes - Movie IDs that User A swiped right on
 * @param {string} userName - Optional name for User A
 * @returns {string} - The session ID for sharing
 */
export const createMatchSession = async (movies, userALikes, userName = 'Someone') => {
    const sessionId = generateSessionId();
    
    const sessionData = {
        id: sessionId,
        movies: movies.map(m => ({
            id: m.id,
            Title: m.Title,
            Poster: m.Poster,
            release_date: m.release_date,
            vote_average: m.vote_average,
            overview: m.overview
        })),
        userA: {
            name: userName,
            likes: userALikes, // Array of movie IDs
            completedAt: serverTimestamp()
        },
        userB: null, // Will be filled when friend swipes
        createdAt: serverTimestamp(),
        status: 'pending' // pending, completed
    };

    await setDoc(doc(db, 'matchSessions', sessionId), sessionData);
    
    return sessionId;
};

/**
 * Get a match session by ID
 * @param {string} sessionId 
 * @returns {Object|null} - Session data or null if not found
 */
export const getMatchSession = async (sessionId) => {
    const docRef = doc(db, 'matchSessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

/**
 * Submit User B's swipes and calculate matches
 * @param {string} sessionId 
 * @param {Array} userBLikes - Movie IDs that User B swiped right on
 * @param {string} userName - Optional name for User B
 * @returns {Object} - Match results
 */
export const submitUserBSwipes = async (sessionId, userBLikes, userName = 'Friend') => {
    const docRef = doc(db, 'matchSessions', sessionId);
    
    // Get current session to calculate matches
    const session = await getMatchSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }
    
    // Calculate mutual matches
    const userALikes = session.userA.likes;
    const mutualMatches = userALikes.filter(id => userBLikes.includes(id));
    
    // Update the session with User B's data
    await updateDoc(docRef, {
        userB: {
            name: userName,
            likes: userBLikes,
            completedAt: serverTimestamp()
        },
        mutualMatches: mutualMatches,
        status: 'completed'
    });
    
    // Return the match results
    const matchedMovies = session.movies.filter(m => mutualMatches.includes(m.id));
    
    return {
        mutualMatches: matchedMovies,
        userAName: session.userA.name,
        userBName: userName,
        userALikesCount: userALikes.length,
        userBLikesCount: userBLikes.length,
        matchCount: mutualMatches.length,
        totalMovies: session.movies.length
    };
};

/**
 * Get match results for a completed session
 * @param {string} sessionId 
 * @returns {Object|null} - Match results or null
 */
export const getMatchResults = async (sessionId) => {
    const session = await getMatchSession(sessionId);
    
    if (!session || session.status !== 'completed') {
        return null;
    }
    
    const matchedMovies = session.movies.filter(m => 
        session.mutualMatches.includes(m.id)
    );
    
    return {
        mutualMatches: matchedMovies,
        userAName: session.userA.name,
        userBName: session.userB.name,
        userALikesCount: session.userA.likes.length,
        userBLikesCount: session.userB.likes.length,
        matchCount: session.mutualMatches.length,
        totalMovies: session.movies.length,
        allMovies: session.movies
    };
};

