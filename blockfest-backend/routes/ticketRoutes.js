// routes/ticketRoutes.js
import express from 'express';
import { verifyFirebaseToken, isAdmin } from '../middleware/authMiddleware.js';
import { getAllTicketData } from '../utils/blockchain.js'; // Import the blockchain utility

const router = express.Router();

// === Endpoint: Get All Ticket Data (Admin Only) ===
router.get('/get-all-tickets', verifyFirebaseToken, isAdmin, async (req, res) => {
    console.log(`Admin ${req.user.uid} requesting all ticket data.`);
    try {
        const tickets = await getAllTicketData();
        return res.status(200).json(tickets);
    } catch (error) {
        console.error("Error in /get-all-tickets route:", error);
        // Send back the error message thrown by the utility function
        return res.status(500).json({ message: error.message || 'Internal Server Error fetching ticket data.' });
    }
});

export default router; // Export the router