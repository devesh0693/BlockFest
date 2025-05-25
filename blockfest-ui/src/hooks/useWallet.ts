// src/hooks/useWallet.ts

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// No need to declare Window interface here since it's already declared in global.d.ts

export const useWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connectWallet = async (): Promise<string | null> => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWalletAddress(address);
      setConnected(true);
      return address;
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      throw new Error(err.message || "Wallet connection failed");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setConnected(false);
  };

  useEffect(() => {
    // Auto-connect if already connected
    const checkWallet = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
          setConnected(true);
        }
      }
    };
    checkWallet();
  }, []);

  return {
    walletAddress,
    connected,
    connectWallet,
    disconnectWallet,
  };
};