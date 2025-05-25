// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  listenToAuthChanges,
  getCurrentUserIdToken,
  checkAdminStatus,
} from "../firebase/auth";
import { User } from "firebase/auth";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { checkNetwork, switchNetwork as switchNetworkUtil } from "../utils/blockchain";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// --------- NETWORK STATE TYPES ---------
interface NetworkState { 
  isCorrect: boolean; 
  currentNetwork: { 
    chainId: number; 
    name: string 
  } | null;
}

// --------- CONTEXT TYPES ---------
interface AuthContextType {
  // Auth properties
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;

  // Wallet properties
  walletAddress: string | null;
  connected: boolean;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  
  // Network properties (from WalletContext)
  networkState: NetworkState | null;
  switchNetwork: () => Promise<boolean>;
}

// --------- SESSION CLEANUP UTILITY ---------
const clearSessionData = () => {
  // Clear VIP file info from session storage
  sessionStorage.removeItem('vipFileInfo');
  
  // Add any other session data that needs to be cleared on logout
};

// --------- CONTEXT CREATION ---------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --------- PROVIDER COMPONENT ---------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firebase Auth States
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Wallet States
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Network States
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);

  // --------- Firebase Auth Logic ---------
  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const admin = await checkAdminStatus();
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      setUser(user);
      const admin = await checkAdminStatus();
      setIsAdmin(admin);
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const user = await signInWithFacebook();
      setUser(user);
      const admin = await checkAdminStatus();
      setIsAdmin(admin);
    } catch (error: any) {
      toast.error(error.message || "Facebook sign-in failed");
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      const user = await signInWithEmail(email, password);
      setUser(user);
      const admin = await checkAdminStatus();
      setIsAdmin(admin);
    } catch (error: any) {
      toast.error(error.message || "Email sign-in failed");
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const user = await registerWithEmail(email, password);
      setUser(user);
      const admin = await checkAdminStatus();
      setIsAdmin(admin);
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear session data before signing out
      clearSessionData();
      
      await signOutUser();
      setUser(null);
      setIsAdmin(false);
      disconnectWallet(); // Also disconnect wallet on logout
    } catch (error: any) {
      toast.error(error.message || "Sign out failed");
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    return await getCurrentUserIdToken();
  };

  // --------- Wallet Logic ---------
  const connectWallet = async (): Promise<string | null> => {
    toast.loading('Connecting Wallet...', { id: 'wallet-connect' });
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWalletAddress(address);
      setConnected(true);
      toast.success(`Wallet Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`, { id: 'wallet-connect' });
      
      // Check network after connection
      checkCurrentNetwork();
      
      return address;
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      toast.error(err.message || "Wallet connection failed", { id: 'wallet-connect' });
      return null;
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setConnected(false);
    setNetworkState(null);
    toast('Wallet state cleared. Disconnect via MetaMask extension.', { icon: '🔌' });
  };
  
  // --------- Network Logic ---------
  const checkCurrentNetwork = async () => {
    // Check window.ethereum existence before accessing properties
    if (window.ethereum) {
      const state = await checkNetwork();
      setNetworkState(state);
      if (walletAddress && !state.isCorrect) {
        // Use environment variable for network name display
        const targetNetworkName = process.env.REACT_APP_TARGET_NETWORK_NAME || 'the correct network';
        toast.error(`Wrong Network! Please switch to ${targetNetworkName}.`, { id: 'network-toast', duration: 5000 });
      } else {
        toast.dismiss('network-toast');
      }
    } else {
      setNetworkState(null);
    }
  };
  
  const switchNetwork = async (): Promise<boolean> => {
    toast.loading('Requesting Network Switch...', { id: 'network-switch'});
    try {
      // Check if switchNetworkUtil was imported correctly
      if (typeof switchNetworkUtil !== 'function') {
        throw new Error("Switch network function not available.");
      }
      const success = await switchNetworkUtil();
      if (success) {
        toast.success('Network switch successful or already correct.', { id: 'network-switch'});
        const state = await checkNetwork(); // Re-check state
        setNetworkState(state);
      } else {
        toast.error('Network switch request rejected or failed.', { id: 'network-switch'});
      }
      return success;
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network', { id: 'network-switch'});
      return false;
    }
  };

  // --------- Combined useEffect for Ethereum events ---------
  useEffect(() => {
    // Initial wallet check
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].address);
            setConnected(true);
            checkCurrentNetwork();
          }
        } catch (error) {
          console.error("Error checking wallet:", error);
        }
      }
    };
    checkWallet();

    // Event handlers
    const handleChainChanged = (_chainId: string) => {
      console.log("Network changed, re-checking...");
      checkCurrentNetwork();
    };
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        console.log("MetaMask disconnected.");
        setWalletAddress(null);
        setConnected(false);
        setNetworkState(null);
      } else {
        setWalletAddress(accounts[0]);
        setConnected(true);
        checkCurrentNetwork();
      }
    };

    // Add listeners only if window.ethereum exists
    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      // Remove listeners only if window.ethereum exists
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [walletAddress]); // Dependency on walletAddress

  // Combine all values for the context
  const value: AuthContextType = {
    // Auth values
    user,
    loading,
    isAdmin,
    signInWithGoogle: handleGoogleSignIn,
    signInWithFacebook: handleFacebookSignIn,
    signInWithEmail: handleEmailSignIn,
    registerWithEmail: handleRegister,
    signOut: handleSignOut,
    getIdToken,

    // Wallet values
    walletAddress,
    connected,
    connectWallet,
    disconnectWallet,
    
    // Network values
    networkState,
    switchNetwork
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-primary-dark text-text-main">Authenticating...</div>}
    </AuthContext.Provider>
  );
};

// --------- useAuth Hook ---------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// --------- Specialized Hooks ---------
// These hooks are convenience wrappers that extract specific functionality from useAuth
export const useWallet = () => {
  const { walletAddress, connected, connectWallet, disconnectWallet, networkState, switchNetwork } = useAuth();
  return { walletAddress, connected, connectWallet, disconnectWallet, networkState, switchNetwork };
};