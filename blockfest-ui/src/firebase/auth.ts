// src/firebase/auth.ts
import {
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signOut,
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    getIdToken,
    getIdTokenResult
} from "firebase/auth";
import { authClient } from "./config"; // Use the configured client auth instance
import { useState, useEffect, createContext } from 'react';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Define the auth context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Export the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Get ID Token (for Backend Auth) ---
export const getCurrentUserIdToken = async (): Promise<string | null> => {
    try {
        // First try to get the current user
        const user = authClient.currentUser;
        if (!user) {
            console.log('No user is currently logged in');
            return null;
        }

        // Try to get the ID token
        const token = await user.getIdToken();
        if (!token) {
            console.log('No ID token obtained');
            return null;
        }

        console.log('Successfully obtained Firebase token:', token.substring(0, 20) + '...');
        return token;
    } catch (error: any) {
        console.error('Error getting Firebase token:', {
            error,
            message: error.message,
            code: error.code
        });
        return null;
    }
};

// --- Auth State Management ---
export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(authClient, async (authUser) => {
            setUser(authUser);
            setLoading(false);
            
            if (authUser) {
                try {
                    // Try to get the ID token immediately
                    await authUser.getIdToken();
                    console.log('Successfully verified user token');
                } catch (error) {
                    console.error('Error verifying user token:', error);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
};

// --- Sign-in Functions ---
export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(authClient, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error("Google Sign-in Error:", error);
        throw new Error(error.message || "Google Sign-in failed.");
    }
};

export const signInWithFacebook = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(authClient, facebookProvider);
        return result.user;
    } catch (error: any) {
        console.error("Facebook Sign-in Error:", error);
        throw new Error(error.message || "Facebook Sign-in failed.");
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
        const userCredential = await signInWithEmailAndPassword(authClient, email, password);
        return userCredential.user;
    } catch (error: any) {
        console.error("Email Sign-in Error:", error);
        throw new Error(error.message || "Email Sign-in failed.");
    }
};

export const registerWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(authClient, email, password);
        // Optionally send verification email here: await sendEmailVerification(userCredential.user);
        return userCredential.user;
    } catch (error: any) {
        console.error("Email Registration Error:", error);
        // Handle errors like email already in use, weak password
        throw new Error(error.message || "Email Registration failed.");
    }
}

export const signOutUser = async () => {
    try {
        await signOut(authClient);
    } catch (error: any) {
        console.error("Sign-out Error:", error);
        throw new Error(error.message || "Sign-out failed.");
    }
};

// --- Auth State Listener ---

export const listenToAuthChanges = (callback: (user: User | null) => void) => {
    // Returns the unsubscribe function
    return onAuthStateChanged(authClient, callback);
};

// --- Check Admin Claim ---
export const checkAdminStatus = async (): Promise<boolean> => {
    if (!authClient.currentUser) {
        return false;
    }
    try {
        const idTokenResult = await getIdTokenResult(authClient.currentUser);
        return idTokenResult.claims.admin === true;
    } catch (error) {
        console.error("Error getting ID token result/claims:", error);
        return false;
    }
};