// firebase-config.js
import { initializeApp } from "firebase/app";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    onValue, 
    push, 
    child, 
    remove,
    query,
    orderByChild,
    equalTo,
    limitToLast,
    onChildAdded,
    onChildChanged,
    onChildRemoved
} from "firebase/database";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged, 
    signOut,
    updateProfile
} from "firebase/auth";

// ============== FIREBASE CONFIG ==============
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

// ============== KHỞI TẠO ==============
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// ============== EXPORT ==============
export { 
    database, 
    auth, 
    ref, 
    set, 
    get, 
    update, 
    onValue, 
    push, 
    child, 
    remove,
    query,
    orderByChild,
    equalTo,
    limitToLast,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    signInAnonymously,
    onAuthStateChanged,
    signOut,
    updateProfile
};

console.log('🔥 Firebase initialized!');
