// middleware/authMiddleware.js
import { auth } from '../utils/firebase.js'; // Import auth service

/**
 * Middleware to verify Firebase ID token from Authorization header.
 * Attaches decoded user info to req.user.
 */
export const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken; // Attach user info (uid, email, custom claims etc.)
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        if (error.code === 'auth/id-token-expired') {
             return res.status(401).json({ message: 'Unauthorized: Token expired.' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

/**
 * Middleware to check if the authenticated user has admin privileges.
 * Must run after verifyFirebaseToken.
 */
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.admin === true) {
        // User has the 'admin: true' custom claim
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden: Admin privileges required.' });
    }
};

// --- How to Set Admin Claim (Run this once manually or via a secure function) ---

export const setUserAdminClaim = async (uid) => {
    try {
        await auth.setCustomUserClaims(uid, { admin: true });
        console.log(`Successfully set admin claim for user ${uid}`);
    } catch (error) {
        console.error(`Error setting admin claim for user ${uid}:`, error);
    }
};

