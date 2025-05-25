import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-dark/50 mt-12 py-6 border-t border-accent-glow/20">
      <div className="container mx-auto px-4 text-center text-text-secondary text-sm">
        <p>&copy; {new Date().getFullYear()} BlockFest. The Future of Event Ticketing.</p>
        <p className="mt-1">Built with ❤ by Sidharth,Pranay, Saloni,& Devesh</p>
         {/* Add social links or other info if needed */}
      </div>
    </footer>
  );
};

export default Footer;