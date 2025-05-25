import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, getCurrentUserIdToken } from '../firebase/auth';
import { checkVIPApi } from '../firebase/index';
import { toast } from 'react-hot-toast';

interface CheckVIPResponse {
    isVIP: boolean;
    walletAddress?: string;
    message?: string;
}

interface VIPContextType {
    isVIP: boolean | null;
    checkingVIP: boolean;
    walletAddress: string | null;
    checkVIPStatus: (name: string, rollNumber: string, walletAddress: string) => Promise<boolean>;
    resetVIP: () => void;
}

const VIPContext = createContext<VIPContextType | undefined>(undefined);

export const VIPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVIP, setIsVIP] = useState<boolean | null>(null);
    const [lastVerificationTime, setLastVerificationTime] = useState<number>(0);
    const [checkingVIP, setCheckingVIP] = useState<boolean>(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const { user } = useAuth();
    
    const checkVIPStatus = async (name: string, rollNumber: string, walletAddress: string): Promise<boolean> => {
        if (!user) {
            toast.error("Please log in before checking VIP status.");
            return false;
        }

        // Check cooldown
        const now = Date.now();
        const cooldownTime = 10000; // 10 seconds in milliseconds
        if (now - lastVerificationTime < cooldownTime) {
            const remainingTime = Math.ceil((lastVerificationTime + cooldownTime - now) / 1000);
            toast.error(`Please wait ${remainingTime} seconds before trying again.`);
            return false;
        }

        // First check if we have a valid token
        const token = await getCurrentUserIdToken();
        if (!token) {
            console.error('No valid token found');
            
            // Try to refresh the token
            try {
                const refreshedToken = await user.getIdToken(true); // Force refresh
                if (refreshedToken) {
                    console.log('Successfully refreshed token');
                } else {
                    toast.error("Failed to refresh token. Please log in again.");
                    return false;
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
                toast.error("Failed to refresh token. Please log in again.");
                return false;
            }
        }

        // Only show loading toast if we're actually making the API call
        const toastId = 'vip-check';
        toast.loading('Verifying VIP Status...', { id: toastId });
        
        try {
            // Log the data being sent to help with debugging
            console.log("Sending VIP verification with:", {
                name,
                rollNumber,
                walletAddress
            });
            
            const response = await checkVIPApi(name, rollNumber, walletAddress);
            
            // Clean up loading toast
            toast.dismiss(toastId);
            
            if (response.isVIP) {
                // Store the wallet address for this user
                if (user) {
                    localStorage.setItem(`vip_wallet_${user.uid}`, walletAddress);
                }
                setWalletAddress(walletAddress);
                setIsVIP(true);
                toast.success('✅ VIP Status Verified!');
            } else {
                setIsVIP(false);
                toast.error(response.message || '❌ Access Denied. Not on VIP list.');
            }
            
            // Update last verification time and reset checking state
            setLastVerificationTime(now);
            setCheckingVIP(false);
            
            return response.isVIP;
        } catch (error: any) {
            // Clean up loading toast on error
            toast.dismiss(toastId);
            console.error("VIP Check API Error:", {
                error,
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            if (error.response?.status === 403) {
                toast.error('Authentication required. Please try logging in again.');
            } else if (error.response?.status === 400) {
                toast.error('Please fill in all required fields: name, roll number, and wallet address.');
            } else {
                toast.error(error.message || 'Error checking VIP status. Please try again.');
            }
            
            setIsVIP(false);
            setCheckingVIP(false);
            return false;
        }
    };

    const resetVIP = () => {
        setIsVIP(null);
        setWalletAddress(null);
        if (user) {
            localStorage.removeItem(`vip_wallet_${user.uid}`);
        }
    };

    // Only check VIP status when entering marketplace
    useEffect(() => {
        if (user && window.location.pathname === '/marketplace') {
            // Only check VIP status if not already verified
            if (!isVIP) {
                toast.error('VIP verification required before accessing marketplace.');
            }
        }
    }, [user, window.location.pathname, isVIP]);

    const value = { isVIP, checkingVIP, walletAddress, checkVIPStatus, resetVIP };

    return (
        <VIPContext.Provider value={value}>
            {children}
        </VIPContext.Provider>
    );
};

export const useVIP = () => {
    const context = useContext(VIPContext);
    if (context === undefined) {
        throw new Error('useVIP must be used within a VIPProvider');
    }
    return context;
};