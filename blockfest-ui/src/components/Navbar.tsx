// src/components/Navbar.tsx

// --- ALL IMPORTS AT THE TOP ---
import React, { useState,useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Keep if using mobile menu animation
import { toast } from 'react-hot-toast';

// Import context hooks (assuming they are exported from App.tsx - adjust path if needed)
// If contexts were moved to src/contexts/, import from there instead.
import { useWallet, useAuth } from '../contexts/AuthContext'; // Adjust relative path if necessary

// Import Firebase sign out function (the helper we created)
import { signOutUser as firebaseSignOutUser } from '../firebase/auth'; // Renamed to avoid conflict

// Import UI components and icons
import GlowingButton from './GlowingButton';
import { UserIcon, CogIcon, LogoutIcon, LoginIcon, MenuIcon, XIcon, WifiIcon, ExclamationCircleIcon } from '@heroicons/react/outline'; // Or @heroicons/react/solid if needed

// --- Component Definition ---
const Navbar: React.FC = () => {
    // Hooks must be called inside the component body
    const { walletAddress, connectWallet, disconnectWallet, networkState, switchNetwork } = useWallet();
    const { user, loading, isAdmin } = useAuth(); // Get isAdmin status
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- Event Handlers ---
    // Example login/signup functions (replace with modals or page redirects)
    const handleLoginRedirect = () => { /* TODO: Navigate to login page or open modal */ toast.error("Login page/modal not implemented"); };
    const handleSignupRedirect = () => { /* TODO: Navigate to signup page or open modal */ toast.error("Signup page/modal not implemented"); };

    // Use the imported Firebase helper for signing out
    const handleSignOut = async () => {
         try {
             await firebaseSignOutUser(); // Use the imported helper function
             toast.success("Signed out.");
             setIsMobileMenuOpen(false); // Close mobile menu on sign out
         } catch (error: any) {
             toast.error(`Sign out failed: ${error.message}`);
         }
     };
    // TODO: Implement Google/Facebook sign-in calls here or trigger from dedicated components/modals

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    // --- Render Logic ---
    return (
        <nav className="bg-secondary-dark/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link to="/" className="text-2xl font-bold text-accent-light hover:text-white transition duration-300">
                        BlockFest
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex space-x-6 items-center">
                        <a href="/#about" className="text-text-secondary hover:text-text-main transition duration-300">About</a>
                        <a href="/#why-blockchain" className="text-text-secondary hover:text-text-main transition duration-300">Why Blockchain</a>
                        <Link to="/marketplace" className="text-text-secondary hover:text-text-main transition duration-300">Marketplace</Link>
                        {isAdmin && ( // Show Admin link only if user is admin
                            <Link to="/admin" className="text-text-secondary hover:text-text-main transition duration-300">Admin</Link>
                        )}
                    </div>

                     {/* Right Side: Wallet, Auth, Network Status, Hamburger */}
                    <div className="flex items-center space-x-3">
                        {/* Network Status Indicator */}
                        {walletAddress && networkState && (
                            <button
                                onClick={!networkState.isCorrect ? switchNetwork : undefined}
                                title={networkState.isCorrect
                                       ? `Connected to ${networkState.currentNetwork?.name || 'correct network'}`
                                       : `Wrong Network: ${networkState.currentNetwork?.name || 'Unknown'}. Click to switch.`}
                                aria-label={networkState.isCorrect ? `Network status: Connected to ${networkState.currentNetwork?.name}` : `Network status: Wrong Network - ${networkState.currentNetwork?.name}. Click to switch.`}
                                className={`flex items-center px-2 py-1 rounded text-xs transition-colors duration-200 ${
                                    networkState.isCorrect
                                        ? 'bg-success/20 text-success hover:bg-success/30'
                                        : 'bg-error/20 text-error hover:bg-error/30 animate-pulse'
                                }`}
                            >
                                {networkState.isCorrect ? <WifiIcon className="h-4 w-4 mr-1 flex-shrink-0" /> : <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
                                 <span className="hidden sm:inline">{networkState.currentNetwork?.name || (networkState.isCorrect ? 'Correct Network' : 'Wrong Network')}</span>
                            </button>
                        )}

                       {/* Wallet Button */}
                       {/* Use standard JSX template literal */}
                       <GlowingButton onClick={!walletAddress ? connectWallet : disconnectWallet} disabled={loading} className="text-sm !px-3 !py-1.5">
                           {walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Connect'}
                       </GlowingButton>

                       {/* Auth Section (Desktop) */}
                       <div className="hidden md:flex items-center">
                           {!loading && !user && (
                               <button onClick={handleLoginRedirect} className="text-text-secondary hover:text-text-main transition duration-300 text-sm ml-2">Login</button>
                               // {/* Add Signup Button Here if needed */}
                           )}
                           {!loading && user && (
                               <div className="relative group">
                                   <button className="flex items-center text-text-secondary hover:text-text-main focus:outline-none" aria-label="User menu">
                                       <UserIcon className="h-6 w-6 mr-1" />
                                       {/* Add user name if available */}
                                   </button>
                                   {/* Dropdown Menu */}
                                   <div className="absolute right-0 mt-2 w-48 bg-secondary-dark rounded-md shadow-xl z-20 hidden group-hover:block py-1 border border-accent-glow/30">
                                       <div className="px-4 py-2 text-sm text-text-main border-b border-accent-glow/20 truncate" title={user.email || ''}>{user.email}</div>
                                        {isAdmin && ( // Link to Admin panel in dropdown
                                            <Link to="/admin" className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-accent-glow/20 hover:text-text-main">
                                                <CogIcon className="h-4 w-4 mr-2"/> Admin Panel
                                            </Link>
                                        )}
                                       <button
                                           onClick={handleSignOut}
                                           className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-accent-glow/20 hover:text-text-main"
                                       >
                                          <LogoutIcon className="h-4 w-4 mr-2"/> Sign Out
                                       </button>
                                   </div>
                               </div>
                           )}
                            {loading && <span className="text-sm text-text-secondary ml-2">...</span>}
                       </div>

                       {/* Hamburger Menu Button */}
                       <div className="md:hidden flex items-center">
                           <button onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}>
                               {isMobileMenuOpen ? <XIcon className="h-6 w-6 text-text-main" /> : <MenuIcon className="h-6 w-6 text-text-main" />}
                           </button>
                       </div>
                    </div>
                </div>

                 {/* Mobile Menu */}
                 {isMobileMenuOpen && (
                     <motion.div
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.2 }}
                         className="md:hidden pt-2 pb-4 space-y-2 border-t border-accent-glow/20"
                      >
                          {/* Links */}
                          <a href="/#about" className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark" onClick={toggleMobileMenu}>About</a>
                          <a href="/#why-blockchain" className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark" onClick={toggleMobileMenu}>Why Blockchain</a>
                          <Link to="/marketplace" className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark" onClick={toggleMobileMenu}>Marketplace</Link>
                          {isAdmin && <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark" onClick={toggleMobileMenu}>Admin</Link>}
                          <hr className="border-accent-glow/10 my-2"/>

                          {/* Auth Buttons for Mobile */}
                          {!loading && !user && (
                             <>
                                <button onClick={() => { handleLoginRedirect(); toggleMobileMenu(); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark">Login</button>
                                {/* Add Signup button */}
                             </>
                          )}
                          {!loading && user && (
                             <>
                                <div className="px-3 py-2 text-text-main text-sm truncate" title={user.email || ''}>{user.email}</div>
                                <button onClick={() => { handleSignOut(); toggleMobileMenu(); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text-main hover:bg-secondary-dark">Sign Out</button>
                             </>
                          )}
                           {loading && <div className="px-3 py-2 text-text-secondary text-sm">Loading...</div>}
                      </motion.div>
                 )}
            </div>
        </nav>
    );
};

export default Navbar; // Ensure default export matches import style in App.tsx


// const Navbar = () => {
//     return (
//         <div>Navbar</div>
//     )
// }

// export default Navbar;
