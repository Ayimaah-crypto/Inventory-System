import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 1. Added getAuth
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFw3W9Z3FKTUA5v8_iab96db7sY7xyJNg",
  authDomain: "brownside-f02b4.firebaseapp.com",
  projectId: "brownside-f02b4",
  storageBucket: "brownside-f02b4.firebasestorage.app",
  messagingSenderId: "698178833216",
  appId: "1:698178833216:web:408b7d1dd5ec10a5e9c8a5"
};

const app = initializeApp(firebaseConfig);

// Export Auth Service
export const auth = getAuth(app); // 2. Exported auth

// Export Firestore Database
export const db = getFirestore(app);

// Export Firebase Storage
export const storage = getStorage(app);

export default app;