import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SponsorLogoProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackText?: string;
}

export const SponsorLogo: React.FC<SponsorLogoProps> = ({
  src,
  alt,
  className = 'w-full h-full object-contain',
  containerClassName = 'w-16 h-16 rounded-xl bg-white p-2 flex items-center justify-center shadow-sm overflow-hidden border border-slate-200/80',
  fallbackText
}) => {
  const [hasError, setHasError] = useState(false);

  // Generate 2-3 letters monogram fallback
  const getInitials = (text: string) => {
    if (!text) return 'SP';
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.substring(0, 3).toUpperCase();
  };

  const initials = fallbackText || getInitials(alt);

  if (hasError || !src) {
    return (
      <div 
        className={`${containerClassName} bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-amber-400 select-none`}
        title={alt}
      >
        <span className="font-mono font-black text-xs tracking-wider">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={className}
        loading="lazy"
      />
    </div>
  );
};
