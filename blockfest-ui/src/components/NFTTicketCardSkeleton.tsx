// src/components/NFTTicketCardSkeleton.tsx
import React from 'react';

const NFTTicketCardSkeleton: React.FC = () => {
  return (
    // Base container mimicking NFTTicketCard structure
    <div className="bg-secondary-dark rounded-lg overflow-hidden shadow-lg border border-accent-glow/20 animate-pulse">

      {/* Image Placeholder */}
      <div className="w-full h-48 bg-primary-dark/50"></div>

      {/* Content Placeholder */}
      <div className="p-4 space-y-3"> {/* Use space-y for vertical spacing */}
        {/* Event Name Placeholder */}
        <div className="h-5 bg-primary-dark/50 rounded w-3/4"></div>

        {/* Price Placeholder */}
        <div className="h-4 bg-accent-glow/30 rounded w-1/4"></div>

        {/* Seat Placeholder */}
        <div className="h-4 bg-primary-dark/50 rounded w-1/2"></div>

        {/* QR Code Placeholder */}
        <div className="h-20 bg-gray-300/50 rounded w-20 mx-auto my-2"></div>

        {/* Button Placeholder */}
        <div className="h-9 bg-accent-glow/40 rounded w-full mt-4"></div>
      </div>
    </div>
  );
};

export default NFTTicketCardSkeleton;