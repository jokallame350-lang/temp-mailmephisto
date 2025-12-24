// src/components/Footer.tsx
import React from 'react';
import { Github, Shield, Lock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0c] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Sol: Copyright & Status */}
        <div className="flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-indigo-500" />
            <span>© {new Date().getFullYear()} MephistoMail. Secure & Anonymous.</span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Zero-Persistence RAM Storage</span>
          </div>
        </div>

        {/* Sağ: Linkler & GitHub */}
        <div className="flex items-center gap-6 text-slate-500">
          <a href="/privacy-policy.html" className="hover:text-white transition-colors">Privacy</a>
          <a href="/terms.html" className="hover:text-white transition-colors">Terms</a>
          <div className="h-3 w-[1px] bg-white/10"></div> {/* Ayırıcı çizgi */}
          <a 
            href="https://github.com/jokallame350-lang/temp-mailmephisto" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-white transition-colors group"
          >
            <span className="hidden sm:inline">Source Code</span>
            <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
