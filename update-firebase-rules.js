// update-firebase-rules.js
const { initializeApp } = require('firebase/app');
const { getFirestore, setLogLevel } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirebaseConfig } = require('./firebase-config');
const { updateFirestoreRules } = require('./firebase-admin');

// Suppress Firestore logs
setLogLevel('error');

async function updateRules() {
  try {
    console.log('Updating Firebase security rules...');
    
    // Initialize Firebase
    const firebaseConfig = getFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // You'll need to sign in as an admin user to update rules
    console.log('Please enter your Firebase admin credentials:');
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('Usage: node update-firebase-rules.js <admin-email> <admin-password>');
      process.exit(1);
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Successfully signed in as admin');
    } catch (error) {
      console.error('Error signing in:', error.message);
      process.exit(1);
    }
    
    // Define the security rules
    const securityRules = `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow read/write access to all users for the watchedFilms collection
        match /watchedFilms/{document=**} {
          allow read, write: if request.auth != null;
        }
        
        // Allow read/write access to all users for the messages collection
        match /messages/{document=**} {
          allow read, write: if request.auth != null;
        }
        
        // Default rule - deny access to all other collections
        match /{document=**} {
          allow read, write: if false;
        }
      }
    }
    `;
    
    // Update the rules
    await updateFirestoreRules(securityRules);
    
    console.log('Firebase security rules updated successfully!');
  } catch (error) {
    console.error('Error updating Firebase security rules:', error);
  }
}

updateRules();
