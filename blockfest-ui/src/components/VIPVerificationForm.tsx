import React, { useState, useEffect } from 'react';
import { useVIP } from '../contexts/VIPContext'; // Adjust path if needed
import GlowingButton from './GlowingButton';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/solid';
import { toast } from 'react-hot-toast'; // Import toastify

interface VIPVerificationFormProps {
    onVerified?: (name: string, rollNumber: string, walletAddress: string) => void; // Optional callback when verification is successful
    navigateToMarketplace?: () => void;
}

const VIPVerificationForm: React.FC<VIPVerificationFormProps> = ({ onVerified, navigateToMarketplace }) => {
    const { checkVIPStatus, checkingVIP, isVIP, resetVIP, walletAddress } = useVIP();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [walletAddressInput, setWalletAddress] = useState('');
    const [verificationAttempted, setVerificationAttempted] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    useEffect(() => {
        // If we have a stored wallet address, pre-fill it
        if (walletAddress) {
            setWalletAddress(walletAddress);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (isVIP === true) {
            console.log("VIP verified, calling onVerified callback with credentials");
            if (onVerified) {
                onVerified(name, rollNumber, walletAddressInput); // Pass the credentials
            }
        }
    }, [isVIP, onVerified, name, rollNumber, walletAddressInput]); // Add name, rollNumber, and walletAddressInput to dependencies

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !rollNumber || !walletAddressInput || checkingVIP) return;

        setVerificationAttempted(true);
        setVerificationError(null);

        try {
            const success = await checkVIPStatus(name, rollNumber, walletAddressInput);
            if (success) {
                console.log("VIP verification successful");
                if (onVerified) {
                    onVerified(name, rollNumber, walletAddressInput);
                }
                
                // Use either the provided navigateToMarketplace or useNavigate
                if (navigateToMarketplace) {
                    navigateToMarketplace();
                } else {
                    navigate('/marketplace');
                }
            } else {
                toast.error('VIP verification failed. Please try again.');
            }
        } catch (error: any) {
            console.error("VIP verification failed:", error);
            setVerificationError(error.message || "Verification failed. Please try again.");
            toast.error(error.message || 'Error checking VIP status. Please try again.');
        }
    };

    const handleReset = () => {
        resetVIP();
        setVerificationAttempted(false);
        setVerificationError(null);
        setName('');
        setRollNumber('');
        setWalletAddress('');
    };

    // If already verified, show success message
    if (isVIP === true) {
        return (
            <div className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/30 text-center animate-fade-in">
                <ShieldCheckIcon className="h-16 w-16 text-success mx-auto mb-4"/>
                <h3 className="text-xl font-semibold text-text-main mb-2">VIP Status Verified!</h3>
                <p className="text-text-secondary mb-4">You can now access the ticket marketplace.</p>
                <button onClick={handleReset} className="text-xs text-accent-light hover:underline">
                    Check different credentials
                </button>
            </div>
        );
    }

    return (
        <div className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/30 animate-fade-in">
            <h3 className="text-xl font-semibold text-text-main mb-4 text-center">VIP Verification</h3>
            <p className="text-text-secondary text-sm mb-6 text-center">Enter your details to check for VIP access.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="vipName" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input
                        type="text"
                        id="vipName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-primary-dark border border-accent-glow/50 rounded-md text-text-main focus:ring-accent-light focus:border-accent-light focus:outline-none"
                        placeholder="Enter your name"
                        disabled={checkingVIP}
                    />
                </div>
                <div>
                    <label htmlFor="vipRollNumber" className="block text-sm font-medium text-text-secondary mb-1">Roll Number</label>
                    <input
                        type="text"
                        id="vipRollNumber"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-primary-dark border border-accent-glow/50 rounded-md text-text-main focus:ring-accent-light focus:border-accent-light focus:outline-none"
                        placeholder="Enter your roll number"
                        disabled={checkingVIP}
                    />
                </div>
                <div>
                    <label htmlFor="vipWalletAddress" className="block text-sm font-medium text-text-secondary mb-1">Wallet Address</label>
                    <input
                        type="text"
                        id="vipWalletAddress"
                        value={walletAddressInput}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-primary-dark border border-accent-glow/50 rounded-md text-text-main focus:ring-accent-light focus:border-accent-light focus:outline-none"
                        placeholder="Enter your wallet address"
                        disabled={checkingVIP}
                    />
                </div>
                {verificationError && (
                    <p className="text-red-500 text-sm">{verificationError}</p>
                )}
                <button 
                    type="submit"
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors duration-200 relative ${
                        checkingVIP || !name || !rollNumber || !walletAddressInput
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-accent-glow hover:bg-accent-light text-primary-dark'
                    }`}
                    disabled={checkingVIP || !name || !rollNumber || !walletAddressInput}
                >
                    {checkingVIP ? (
                        <>
                            <span className="opacity-0">Verifying...</span>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            </div>
                        </>
                    ) : (
                        'Verify VIP Status'
                    )}
                </button>
            </form>
            {verificationAttempted && isVIP === false && !verificationError && (
                <div className="text-center mt-4">
                    <p className="text-error">VIP Access Denied. Please check your credentials.</p>
                    <button 
                        onClick={handleReset} 
                        className="text-xs text-accent-light hover:underline mt-2"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
};

export default VIPVerificationForm;