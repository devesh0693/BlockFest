// src/App.tsx

// --- ALL IMPORTS AT THE TOP ---
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { User } from 'firebase/auth';

// Import Pages and Components
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css';

// Import Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VIPProvider } from './contexts/VIPContext';

// Import Network utilities
import {
    checkNetwork,
    switchNetwork as switchNetworkUtil
} from './utils/blockchain';

// --- Network State Types ---
interface NetworkState { 
    isCorrect: boolean; 
    currentNetwork: { 
        chainId: number; 
        name: string 
    } | null;
}

// --- Main App Component ---
function App() {
    return (
        <AuthProvider>
            <VIPProvider>
                <Router>
                    <AppContent />
                    <Toaster position="top-right" />
                </Router>
            </VIPProvider>
        </AuthProvider>
    );
}

// --- AppContent Component with Router-dependent logic ---
function AppContent() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/marketplace/*" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/admin" element={
                        <RequireAuth adminRequired={true}>
                            <AdminDashboard />
                        </RequireAuth>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

// --- Protected Route Component ---
function RequireAuth({ children, adminRequired = false }: { children: React.ReactElement, adminRequired?: boolean }) {
    const { user, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="text-center p-10">Checking authentication...</div>;
    }

    if (!user) {
        toast.error("Please log in to access this page.");
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (adminRequired && !isAdmin) {
        toast.error("Forbidden: Admin privileges required.");
        return <Navigate to="/" replace />;
    }

    return children;
}

export default App;