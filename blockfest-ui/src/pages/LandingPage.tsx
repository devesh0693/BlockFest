import React from "react";
import { motion } from "framer-motion"; // npm install framer-motion
import GlowingButton from "../components/GlowingButton";
import { useWallet, useAuth } from "../contexts/AuthContext"; // Adjust path
import {
  ShieldCheckIcon,
  CubeTransparentIcon,
  UsersIcon,
} from "@heroicons/react/outline"; // Example icons
import { signInWithGoogle, signInWithFacebook } from "../firebase/auth"; // Import auth functions directly

const LandingPage: React.FC = () => {
  const { connectWallet, walletAddress } = useWallet();
  const { user, loading } = useAuth(); // Just get user and loading from auth context

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Handle login with Google
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
      // Handle error (show toast, etc.)
    }
  };

  // Handle login with Facebook
  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook();
    } catch (error) {
      console.error("Facebook login failed:", error);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <div className="space-y-24 md:space-y-32">
      {/* Hero Section */}
      <motion.section
        className="text-center pt-16 md:pt-24"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-text-main mb-4">
          BlockFest: <span className="text-accent-light">The Future</span> of
          Event Ticketing
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
          Experience seamless, secure, and transparent event ticketing powered
          by blockchain technology. Own your tickets as NFTs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {!walletAddress && (
           <GlowingButton 
           onClick={connectWallet} 
           pulse={true} 
           className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition duration-300 text-sm font-medium"
         >
           Connect Wallet
         </GlowingButton>
          )}
          {walletAddress && <p className="text-success">Wallet Connected!</p>}

          {!user && !loading && (
            <div className="flex space-x-4">
              <button
                onClick={handleGoogleLogin}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition duration-300 text-sm font-medium"
              >
                Login with Google
              </button>
              <button
                onClick={handleFacebookLogin}
                className="px-4 py-2 rounded-md bg-blue-800 hover:bg-blue-900 text-white transition duration-300 text-sm font-medium"
              >
                Login with Facebook
              </button>
            </div>
          )}
          {user && <p className="text-success">Logged In!</p>}
          {loading && <p className="text-text-secondary">Checking auth...</p>}
        </div>
      </motion.section>

      {/* About Us Section */}
      <motion.section
        id="about"
        className="max-w-4xl mx-auto scroll-mt-20" // scroll-mt for navbar offset
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-center text-accent-light mb-8">
          About Us
        </h2>
        <div className="bg-secondary-dark p-6 md:p-8 rounded-lg shadow-lg border border-accent-glow/20 space-y-4 text-text-secondary text-center">
          <p>
            BlockFest is revolutionizing the event industry by leveraging
            blockchain technology to create a fairer, more secure, and engaging
            ticketing experience for fans and organizers alike.
          </p>
          <p>
            Our platform ensures ticket authenticity, eliminates scalping
            through transparent ownership, and empowers users with true control
            over their digital assets.
          </p>
          <h3 className="text-xl font-semibold text-text-main pt-4">
            Meet the Team
          </h3>
          <p>Pranay | Saloni | Sidharth</p>
          {/* Add more details or photos if desired */}
        </div>
      </motion.section>

      {/* Why Blockchain? Section */}
      <motion.section
        id="why-blockchain"
        className="max-w-5xl mx-auto scroll-mt-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-center text-accent-light mb-12">
          Why Blockchain for Tickets?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {/* Feature 1 */}
          <motion.div
            className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20 hover:border-accent-glow/50 transition-all duration-300 transform hover:scale-105"
            whileHover={{ y: -5 }}
          >
            <ShieldCheckIcon className="h-12 w-12 text-accent-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-main mb-2">
              Enhanced Security
            </h3>
            <p className="text-text-secondary text-sm">
              NFT tickets prevent counterfeiting and fraud, ensuring
              authenticity through immutable blockchain records.
            </p>
          </motion.div>
          {/* Feature 2 */}
          <motion.div
            className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20 hover:border-accent-glow/50 transition-all duration-300 transform hover:scale-105"
            whileHover={{ y: -5 }}
          >
            <CubeTransparentIcon className="h-12 w-12 text-accent-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-main mb-2">
              True Ownership & Transparency
            </h3>
            <p className="text-text-secondary text-sm">
              Users truly own their tickets as unique digital assets. All
              transactions are transparent on the blockchain.
            </p>
          </motion.div>
          {/* Feature 3 */}
          <motion.div
            className="bg-secondary-dark p-6 rounded-lg shadow-lg border border-accent-glow/20 hover:border-accent-glow/50 transition-all duration-300 transform hover:scale-105"
            whileHover={{ y: -5 }}
          >
            <UsersIcon className="h-12 w-12 text-accent-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-main mb-2">
              Controlled Resale Market
            </h3>
            <p className="text-text-secondary text-sm">
              Smart contracts can enforce rules on ticket resale, combating
              scalping and enabling fair secondary markets.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;


// const LandingPage = () => {
//     return (
//         <div>LandingPage</div>
//     )
// }

// export default LandingPage;
