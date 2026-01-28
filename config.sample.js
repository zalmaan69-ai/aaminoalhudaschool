// AL-Huda School System - Configuration Template
// Copy this to config.js and fill in your actual credentials
const CONFIG = {
    FIREBASE: {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID",
        measurementId: "YOUR_MEASUREMENT_ID"
    }
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
