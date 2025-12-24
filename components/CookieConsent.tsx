import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('mephisto_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('mephisto_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-slate-300 text-sm md:text-base flex-1 text-center md:text-left">
          <span className="font-semibold text-white">We use cookies 🍪</span>
          <p className="mt-1">
            We use cookies to analyze our traffic and improve your experience.
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsVisible(false)} className="p-2 text-slate-400 hover:text-white md:hidden"><X size={20} /></button>
            <button onClick={handleAccept} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20 whitespace-nowrap">
            Accept All
            </button>
        </div>
      </div>
    </div>
  );
};
