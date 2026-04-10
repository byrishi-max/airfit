import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled = false }) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20",
    secondary: "bg-gray-800 text-white hover:bg-gray-700",
    outline: "border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
