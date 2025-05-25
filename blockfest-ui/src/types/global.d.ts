// src/types/global.d.ts

export interface EventDetails {
  isActive: boolean;
  maxTickets: number;
  currentTickets: number;
  ticketPrice: string;
  ticketPriceInsider: string;
  ticketPriceOutsider: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

// Fix Window interface declaration
interface Window {
  ethereum?: {
    isMetaMask?: true;
    request: (...args: any[]) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}