// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';

// Load environment variables
dotenv.config();

// Import routes
import vipRoutes from './routes/vipRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
// Ensure Firebase is initialized before routes might need it
import './utils/firebase.js'; // This executes the init code
import './utils/blockchain.js'; // This executes the init code

const app = express();
const PORT = process.env.PORT || 5001;
const corsOrigin = process.env.CORS_ORIGIN || '*'; // Be specific in production

// === Core Middleware ===
// Enable CORS - configure allowed origins in production
app.use(cors({ origin: corsOrigin }));
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded bodies (optional, if using forms)
app.use(express.urlencoded({ extended: true }));
// --- End Core Middleware ---


// === Route Mounting ===
app.use('/api', vipRoutes); // Mount VIP routes under /api prefix
app.use('/api', ticketRoutes); // Mount Ticket routes under /api prefix
// --- End Route Mounting ---


// === Basic Root Route (Health Check) ===
app.get('/', (req, res) => {
    res.status(200).send(`BlockFest Backend is running! Time: ${new Date().toLocaleTimeString()}`);
});
// --- End Basic Root Route ---


// === Global Error Handler (Optional but Recommended) ===
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);

    // Handle Multer errors specifically
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `File upload error: ${err.message}`});
    } else if (err.message && err.message.includes('Invalid file type')) {
        // Handle custom file filter error
        return res.status(400).json({ message: err.message });
    }

    // Default error response
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        // error: process.env.NODE_ENV === 'development' ? err : {} // Optionally include stack trace in dev
    });
});
// --- End Global Error Handler ---


// === Start Server ===
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`CORS enabled for origin: ${corsOrigin}`);
    console.log(`Firebase service account path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
    console.log(`VIP Storage Method: ${process.env.VIP_STORAGE_METHOD || 'firestore'}`);
    console.log(`Blockchain RPC URL: ${process.env.ETH_RPC_URL}`);
    console.log(`Contract Address: ${process.env.CONTRACT_ADDRESS}`);
});
// --- End Start Server ---


