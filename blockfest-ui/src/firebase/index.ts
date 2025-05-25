// src/api/index.ts
import axios from 'axios';
import { getCurrentUserIdToken } from '../firebase/auth';

// --- IMPORTANT: Set your backend URL ---
// Use environment variables for this in a real app
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
// ---------------------------------------

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000, // Reduced timeout to 5 seconds
});

// Add auth token for all endpoints
apiClient.interceptors.request.use(
    async (config) => {
        const token = await getCurrentUserIdToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// === API Functions ===

// --- VIP API Functions ---
interface CheckVIPResponse {
    isVIP: boolean;
    walletAddress?: string;
    message?: string;
}

export const checkVIPApi = async (name: string, rollNumber: string, walletAddress: string): Promise<CheckVIPResponse> => {
    try {
        console.log("Sending VIP check request for:", { name, rollNumber, walletAddress });
        const response = await apiClient.post<CheckVIPResponse>(
            '/check-vip', // This is the correct endpoint
            { name, rollNumber, walletAddress },
            {
                timeout: 3000,
            }
        );
        console.log("VIP check response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("VIP check API error:", {
            error,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        
        if (error.response?.status === 403) {
            return {
                isVIP: false,
                message: 'Authentication required. Please log in first.'
            };
        }
        
        return {
            isVIP: false,
            message: error.response?.data?.message || 'Error checking VIP status'
        };
    }
};

export const uploadVipCsvApi = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('vipCsvFile', file); // Key must match multer field name in backend

    try {
        // Need to override Content-Type for multipart/form-data
        const response = await apiClient.post('/upload-vip-csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        console.error("API Error (uploadVipCsv):", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to upload VIP CSV.");
    }
};

// --- Ticket API Functions ---
export interface TicketData {
    tokenId: number;
    owner: string;
    eventName?: string;
    seat?: string;
    qrHash?: string;
    // metadataURI?: string | null; // If used
}

export const getAllTicketsApi = async (): Promise<TicketData[]> => {
    try {
        const response = await apiClient.get<TicketData[]>('/get-all-tickets');
        return response.data;
    } catch (error: any) {
        console.error("API Error (getAllTickets):", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch ticket data.");
    }
};

export default apiClient; // Export configured instance if needed elsewhere