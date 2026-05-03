import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  disabled, 
  className = '', 
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
};
