// src/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Optional: If frontend needs direct Firestore access

// --- IMPORTANT: Replace with your Firebase project's configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAemhmXycykHg24Qwjh8mKUNklcNd9z7Pc",
    authDomain: "ticket-48fd0.firebaseapp.com",
    projectId: "ticket-48fd0",
    storageBucket: "ticket-48fd0.firebasestorage.app",
    messagingSenderId: "22880188156",
    appId: "1:22880188156:web:e17cfcf59bc357cb7cc979"
};
// ---------------------------------------------------------------------


// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const authClient = getAuth(app); // Export auth instance for client-side use
export const dbClient = getFirestore(app); // Optional: Export Firestore client instance

export default app;