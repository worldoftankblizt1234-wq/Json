// === FIREBASE-CONFIG.JS ===

const firebaseConfig = {
    apiKey: "AIzaSyCGXq3xpUv_qaH5R7RB9LlJwsnVhrlewoA",
    authDomain: "country-61ecf.firebaseapp.com",
    databaseURL: "https://country-61ecf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "country-61ecf",
    storageBucket: "country-61ecf.firebasestorage.app",
    messagingSenderId: "91679803947",
    appId: "1:91679803947:web:4700703e957e9c1b1cb86e",
    measurementId: "G-XQFVPJLF7R"
};

// Khởi tạo Firebase
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully!');
    } else if (typeof firebase !== 'undefined' && firebase.apps.length) {
        console.log('✅ Firebase already initialized!');
    } else {
        console.warn('⚠️ Firebase SDK not loaded!');
    }
} catch (e) {
    console.warn('⚠️ Firebase initialization error:', e);
}
