import React from 'react';
import { ShieldCheck, HelpCircle, AlertTriangle, EyeOff, Lock, Flame, Github, Terminal } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl mt-auto z-10 relative">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Section 1: How It Works */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs shrink-0 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">1</div>
                <div>
                  <h4 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">Generate Identity</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Instant secure temporary email address. Copy and use immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs shrink-0 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">2</div>
                <div>
                  <h4 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">Use Anywhere</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Perfect for verifications, sign-ups, and avoiding spam.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs shrink-0 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">3</div>
                <div>
                  <h4 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">Receive Instantly</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Real-time inbox updates with auto-refresh.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs shrink-0 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">4</div>
                <div>
                  <h4 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">Fake Persona</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Generate complete identities and autofill forms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Privacy & Security */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Privacy Protocol
            </h3>
            <div className="space-y-4">
               <div className="p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-2 text-gray-200 font-bold text-sm mb-2 group-hover:text-emerald-400 transition-colors">
                  <EyeOff className="w-4 h-4 text-emerald-500" />
                  <span>Zero-Log Policy</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                  Mephisto operates on volatile memory only. No IP logging. Data is permanently wiped upon session closure.
                </p>
              </div>
              <div className="p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-2 text-gray-200 font-bold text-sm mb-2 group-hover:text-emerald-400 transition-colors">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>TLS Encryption</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                  End-to-end encryption for all data transmission between your browser and our secure tunnels.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: FAQ */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              FAQ
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-gray-300 font-bold text-sm">Validity Duration?</h4>
                <p className="text-xs text-gray-500">
                  Active until you close the browser. Recommended for tasks under 30 mins.
                </p>
              </div>
               <div className="space-y-1">
                <h4 className="text-gray-300 font-bold text-sm">Is it free?</h4>
                <p className="text-xs text-gray-500">
                  Yes, 100% free for personal use.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-gray-300 font-bold text-sm">Can I recover emails?</h4>
                <p className="text-xs text-gray-500">
                  No. Once deleted or session closed, data is irretrievable.
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-[10px] text-yellow-200/60 leading-tight">
                    <strong>Disclaimer:</strong> Do not use this service for illegal activities. We are not responsible for misuse.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <Terminal className="w-4 h-4 text-gray-600" />
             <p className="text-xs text-gray-600 font-mono">
               SYSTEM: ONLINE // v2.4.0
             </p>
          </div>
          <p className="text-xs text-gray-600">
            © 2024 MephistoTempMail. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <span className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
             <span className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
             <a href="#" className="text-gray-600 hover:text-white transition-colors">
               <Github className="w-4 h-4" />
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;