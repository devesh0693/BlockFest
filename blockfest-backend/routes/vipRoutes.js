import express from 'express';
import multer from 'multer';
import csvParser from 'fast-csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the insider list
const INSIDER_LIST_PATH = path.join(__dirname, '..', '..', 'backend', 'utils', 'insiderLists.csv');

// Cache for VIP list
let vipListCache = null;
let lastModifiedTime = 0;

// Function to ensure CSV file exists
const ensureCSVFileExists = () => {
    // First try to find the file in the backend directory
    const backendPath = path.join(__dirname, '..', '..', 'backend', 'utils', 'insiderLists.csv');
    if (fs.existsSync(backendPath)) {
        console.log('Using existing insiderLists.csv file from backend directory');
        return;
    }

    // If not found in backend directory, try the default location
    if (!fs.existsSync(INSIDER_LIST_PATH)) {
        console.log('Creating new insiderLists.csv file...');
        const defaultContent = 'Name,RollNumber,WalletAddress\nPranay,02717711623,0x1234567890\nSidharth,02217711623,0x9876543210\n';
        fs.writeFileSync(INSIDER_LIST_PATH, defaultContent, 'utf-8');
        console.log('Created default insiderLists.csv file');
    }
};

// Function to load and cache VIP list
const loadVIPList = () => {
    try {
        // Ensure file exists
        ensureCSVFileExists();

        const stats = fs.statSync(INSIDER_LIST_PATH);
        const currentModifiedTime = stats.mtimeMs;

        // Only reload if file has been modified or cache is empty
        if (!vipListCache || currentModifiedTime > lastModifiedTime) {
            console.log('Reading CSV file...');
            const fileContent = fs.readFileSync(INSIDER_LIST_PATH, { encoding: 'utf-8' });
            console.log('File content:', fileContent);
            
            // Create a Map for O(1) lookups
            vipListCache = new Map();
            
            // Split by lines and process each row
            const rows = fileContent.split('\n');
            console.log('Number of rows:', rows.length);
            
            // Skip header and process each row
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].trim();
                if (row) {
                    console.log('Processing row:', row);
                    const [csvName, csvRoll, csvWalletAddress] = row.split(',').map(item => item.trim());
                    console.log('Parsed values:', { csvName, csvRoll, csvWalletAddress });
                    
                    if (csvName && csvRoll && csvWalletAddress) {
                        // Store in lowercase for case-insensitive comparison
                        const key = `${csvName.toLowerCase()}:${csvRoll.toLowerCase()}:${csvWalletAddress.toLowerCase()}`;
                        console.log('Adding to cache:', key);
                        vipListCache.set(key, csvWalletAddress);
                    } else {
                        console.log('Skipping row due to missing values');
                    }
                }
            }
            
            lastModifiedTime = currentModifiedTime;
            console.log(`VIP list cache updated. Total entries: ${vipListCache.size}`);
            console.log('Cache contents:', Array.from(vipListCache.entries()));
        }
    } catch (error) {
        console.error("Error loading VIP list:", error);
        vipListCache = null;
    }
};

// Initial load of VIP list
loadVIPList();

// Watch for file changes
try {
    fs.watch(INSIDER_LIST_PATH, (eventType) => {
        if (eventType === 'change') {
            console.log('VIP list file changed, reloading cache...');
            loadVIPList();
        }
    });
} catch (error) {
    console.error("Error setting up file watcher:", error);
}

// Function to verify VIP status
const verifyVIP = async (req, res) => {
    try {
        const { name, rollNumber, walletAddress } = req.body;
        
        if (!name || !rollNumber || !walletAddress) {
            return res.status(400).json({ 
                isVIP: false, 
                message: 'All fields (name, rollNumber, walletAddress) are required.' 
            });
        }
        
        // Create key using all three fields
        const key = `${name.trim().toLowerCase()}:${rollNumber.trim().toLowerCase()}:${walletAddress.trim().toLowerCase()}`;
        console.log('Checking key:', key);
        console.log('Current cache keys:', Array.from(vipListCache.keys()));
        const vipWalletAddress = vipListCache.get(key);
        
        if (!vipWalletAddress) {
            return res.status(403).json({ 
                isVIP: false, 
                message: 'Not authorized to access VIP features.' 
            });
        }
        
        return res.json({ 
            isVIP: true, 
            walletAddress: vipWalletAddress 
        });
    } catch (error) {
        console.error("Error verifying VIP:", error);
        return res.status(500).json({ 
            isVIP: false, 
            message: 'Error verifying VIP status' 
        });
    }
};

// === Endpoint: Check VIP Status ===
router.post('/check-vip', verifyFirebaseToken, verifyVIP);

export default router;