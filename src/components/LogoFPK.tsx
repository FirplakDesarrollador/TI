import React from 'react';

interface LogoFPKProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const LogoFPK: React.FC<LogoFPKProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  return (
    <div 
      className={`font-black tracking-tighter text-[#254153] select-none ${sizeClasses[size]} ${className}`}
      style={{ letterSpacing: '-0.05em' }}
    >
      FPK
    </div>
  );
};
