// AL-Huda School System - Secure Configuration
// This file is NOT committed to Git to prevent secret leaks.
const CONFIG = {
    FIREBASE: {
        apiKey: "AIzaSyBEVNs8bQGi0IFeukLZOHMqTcOBV-OYMH0",
        authDomain: "al-hudaschool-b3e7b.firebaseapp.com",
        projectId: "al-hudaschool-b3e7b",
        storageBucket: "al-hudaschool-b3e7b.firebasestorage.app",
        messagingSenderId: "492870311296",
        appId: "1:492870311296:web:34f1cbc4e1656fac98f565",
        measurementId: "G-25CLFP6WSP"
    }
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
