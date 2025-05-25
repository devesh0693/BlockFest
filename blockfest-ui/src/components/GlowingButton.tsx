import React, { ButtonHTMLAttributes } from 'react';

interface GlowingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  pulse?: boolean; // Optional prop to enable pulsing animation
}

const GlowingButton: React.FC<GlowingButtonProps> = ({ children, className = '', pulse = false, ...props }) => {
  const pulseClass = pulse ? 'animate-pulse-glow' : '';

  return (
    <button
      className={`
        px-4 py-2 rounded-md font-medium
        bg-accent-glow text-white
        border border-transparent
        shadow-glow-sm hover:shadow-glow-md focus:shadow-glow-md
        transition-all duration-300 ease-in-out
        transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-light focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
        ${pulseClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlowingButton;