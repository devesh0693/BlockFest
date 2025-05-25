// src/components/NFTTicketCard.tsx

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code'; // Ensure: npm install react-qr-code
import GlowingButton from './GlowingButton'; // Ensure GlowingButton exists
import { TicketIcon } from '@heroicons/react/solid'; // Ensure: npm install @heroicons/react

// --- Interface Definitions ---

// Define the shape of the ticket data object
export interface NFTTicketData {
    // Match MarketplacePage.tsx: id is number
    id: number;
    eventName: string;
    price: string; // e.g., "0.05 ETH"
    seatNumber: string;
    imageUrl?: string; // Optional image for the event/NFT
    qrValue: string; // Data for the QR code
}

// Define the props accepted by the NFTTicketCard component
export interface NFTTicketCardProps {
    ticket: NFTTicketData;
    // Match MarketplacePage.tsx: handleBuyTicket expects number or string,
    // but handleResaleTicket expects number. Standardize to number.
    onBuy: (ticketId: number) => void; // Function to call when buying
    isOwned: boolean; // Flag if the current user owns this ticket (required)
    isBuying?: boolean; // Flag if the buy transaction is in progress
    // Add the resale props (optional as they are only passed for owned tickets)
    onResell?: (tokenId: number) => void; // Function to call when reselling
    isReselling?: boolean; // Flag if the resell transaction is in progress
}

// --- Component Implementation ---
const NFTTicketCard: React.FC<NFTTicketCardProps> = ({
    ticket,
    onBuy,
    isOwned, // isOwned is required, no default
    isBuying = false, // Default isBuying to false
    onResell,         // onResell might be undefined if not passed
    isReselling = false // Default isReselling to false
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        // If the ticket is owned, always use the provided CID image
        if (isOwned) {
            setImageUrl('https://ipfs.io/ipfs/bafybeidiruone3wadolwzvzm4hgrkvyddqrqoy73pd7c6y2hensxjzrarq');
            setImageError(false);
            return;
        }
        const processImageUrl = (url: string | undefined) => {
            if (!url) return undefined;
            // Handle IPFS URLs
            if (url.startsWith('ipfs://')) {
                const cid = url.substring(7);
                return `https://ipfs.io/ipfs/${cid}`;
            }
            return url;
        };
        setImageUrl(processImageUrl(ticket.imageUrl));
        setImageError(false);
    }, [ticket.imageUrl, isOwned]);

    // Handler for the buy button click
    const handleBuyClick = () => {
        // Only allow buying if the ticket is not owned and not currently being bought
        if (!isOwned && !isBuying) {
            // Pass the numeric ticket ID to the onBuy handler
            onBuy(ticket.id);
        }
    };

    // Handler for the resell button click
    const handleResellClick = () => {
        // Only allow reselling if the ticket is owned, an onResell handler exists,
        // and it's not already being resold.
        if (isOwned && onResell && !isReselling) {
             // Pass the numeric ticket ID to the onResell handler
            onResell(ticket.id);
        }
    }

    const handleImageError = () => {
        console.error(`Failed to load image for ticket ${ticket.id}`);
        setImageError(true);
    };

    // Fallback image URL for when imageUrl is missing or fails to load
    const placeholderImageUrl = `https://via.placeholder.com/300x200/1b1b32/f5f6f7?text=${encodeURIComponent(ticket.eventName || 'Event Ticket')}`;

    return (
        <div className="bg-secondary-dark rounded-lg overflow-hidden shadow-lg border border-accent-glow/20 hover:border-accent-glow/50 transition-all duration-300 transform hover:-translate-y-1 group">
            {/* Image Section */}
            <div className="w-full h-48 bg-primary-dark">
                {imageUrl && !imageError ? (
                    <img 
                        src={imageUrl} 
                        alt={ticket.eventName} 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent-light">
                        <TicketIcon className="h-16 w-16 opacity-50"/>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-6">
                {/* Ticket Details */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-text-main mb-2 truncate" title={ticket.eventName}>
                        {ticket.eventName}
                    </h3>
                    {/* Display price with currency unit */}
                    <p className="text-sm text-accent-light font-medium mb-2">{ticket.price} ETH</p>
                    <p className="text-xs text-text-secondary">Seat: {ticket.seatNumber}</p>
                </div>

                {/* QR Code: Displayed centered, potentially only for owned tickets */}
                {/* (Currently always shown based on original code, adjust if needed) */}
                <div className="mb-6 p-2 bg-white rounded flex justify-center items-center max-w-[120px] mx-auto">
                    {/* Ensure qrValue is a string */}
                    <QRCode value={ticket.qrValue || 'no-qr-data'} size={100} level="M" />
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="mt-4">
                {/* --- Buy Button --- */}
                {/* Render this button only if the ticket is NOT owned */}
                {!isOwned && (
                    <GlowingButton
                        onClick={handleBuyClick}
                        disabled={isBuying}
                        className="w-full py-3 text-base font-semibold bg-accent-glow hover:bg-accent-light transition-colors duration-200"
                    >
                        {isBuying ? 'Processing...' : 'Buy Now'}
                    </GlowingButton>
                )}

                {/* --- Owned Status / Resell Button --- */}
                 {/* Render this section only if the ticket IS owned */}
                {isOwned && (
                    <>
                        {/* If an onResell function IS provided, show the Resell button */}
                        {onResell && (
                             <GlowingButton
                                onClick={handleResellClick}
                                disabled={isReselling}
                                className="w-full py-3 text-base font-semibold bg-accent hover:bg-accent-dark transition-colors duration-200" // Resell button style
                            >
                                {isReselling ? 'Processing Resale...' : 'Resell Ticket'}
                             </GlowingButton>
                        )}
                        {/* If NO onResell function is provided, show a static "Owned" indicator */}
                        {!onResell && (
                             <span className="block w-full text-center py-3 text-base font-semibold rounded bg-gray-600 text-gray-300">
                                Owned (Not Resellable)
                             </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NFTTicketCard;