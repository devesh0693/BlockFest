// Place this in your NFTTicketCard.tsx file

export interface NFTTicketCardProps {
    ticket: {
      id: number;
      eventName: string;
      price: string;
      seatNumber: string;
      qrValue: string;
      imageUrl?: string;
    };
    onBuy: (id: string | number) => void;
    isOwned: boolean;
    isBuying?: boolean;
    onResell?: (tokenId: number) => Promise<void>;
    isReselling?: boolean;
  }
  