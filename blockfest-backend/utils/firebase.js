// utils/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs'; // To read the service account key

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
    console.error("Error: FIREBASE_SERVICE_ACCOUNT_PATH is not defined in .env file.");
    process.exit(1);
}

try {
    // Read the service account key file synchronously during initialization
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com" // Optional: Add if using Realtime Database
    });

    console.log("Firebase Admin SDK initialized successfully.");

} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    process.exit(1);
}

// Export specific services or the whole admin object as needed
export const firestore = admin.firestore();
export const auth = admin.auth();
export default admin; // Export the default admin object