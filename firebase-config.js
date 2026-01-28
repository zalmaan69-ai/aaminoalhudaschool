// Firebase Configuration for AL-Huda School System
// IMPORTANT: Replace these placeholder values with your actual Firebase project credentials
// Follow the FIREBASE_SETUP_GUIDE.md for detailed instructions

// Load config from window.APP_CONFIG (defined in config.js)
// DO NOT EDIT THE BLOCK BELOW. It will automatically use the real keys from config.js.
const firebaseConfig = window.APP_CONFIG?.FIREBASE || {
    apiKey: "AIzaSyBEVNs8bQGi0IFeukLZOHMqTcOBV-OYMH0",
    authDomain: "al-hudaschool-b3e7b.firebaseapp.com",
    projectId: "al-hudaschool-b3e7b",
    storageBucket: "al-hudaschool-b3e7b.firebasestorage.app",
    messagingSenderId: "492870311296",
    appId: "1:492870311296:web:34f1cbc4e1656fac98f565",
    measurementId: "G-25CLFP6WSP"
};
window.firebaseConfig = firebaseConfig; // Expose for App.js check

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        window.firebaseAuth = firebase.auth();
        window.firebaseDB = firebase.firestore();

        console.log('✅ Firebase initialized successfully');

        // Enable offline persistence
        window.firebaseDB.enablePersistence()
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ The current browser does not support offline persistence');
                }
            });
    } else {
        console.error('❌ Firebase SDK not loaded. Please check your internet connection.');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Cloud Sync is active.
// Login with your registered Firebase account.
