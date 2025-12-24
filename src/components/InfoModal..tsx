import React, { useState } from 'react';
import { X, ShieldCheck, HelpCircle, BookOpen, AlertTriangle, EyeOff, Lock, UserCheck } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'how' | 'privacy' | 'faq'>('how');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl shadow-red-900/10 w-full max-w-2xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-500" />
            Mephisto Intelligence Center
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/40">
          <button 
            onClick={() => setActiveTab('how')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'how' ? 'border-red-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            How to Use
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'privacy' ? 'border-red-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Privacy Protocol
          </button>
          <button 
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'faq' ? 'border-red-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            FAQ
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* TAB: How to Use */}
          {activeTab === 'how' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0 border border-red-500/20">1</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Generate Identity</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Upon arrival, a secure, temporary email address is automatically generated for you. You can copy it instantly from the top bar.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0 border border-red-500/20">2</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Use Anywhere</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Paste this address into any service requiring verification (Netflix, Instagram, Forums, etc.). Avoid spam in your personal inbox.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0 border border-red-500/20">3</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Receive Instantly</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Incoming emails appear in real-time. Click to view verification codes, confirm links, or read content.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0 border border-red-500/20">4</div>
                <div>
                  <h4 className="text-white font-bold mb-1">Fake Persona (Advanced)</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Use the <b>Fake Persona</b> tool to generate a complete identity (Name, Address, Password) and autofill sign-up forms with a single click.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                  <EyeOff className="w-5 h-5" />
                  <span>Zero-Log Policy</span>
                </div>
                <p className="text-sm text-gray-400">
                  Mephisto operates on a strict volatile memory basis. We do not store your IP address, generated emails, or incoming messages on permanent storage. Once you close the session or delete an account, it is gone forever.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-200 font-bold mb-2">
                    <Lock className="w-4 h-4" />
                    <span>TLS Encryption</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    All data transmission between your browser and our servers is encrypted using industry-standard TLS 1.3 protocols.
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-200 font-bold mb-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Anonymity</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    No sign-up required. No cookies tracking your personal behavior. Total anonymity for your digital operations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <h4 className="text-white font-bold text-sm">How long does the email address last?</h4>
                <p className="text-xs text-gray-400">
                  The address is valid until you delete it or close your browser session. However, we recommend using it for short-term verification tasks (10-30 minutes).
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-bold text-sm">Can I recover a deleted email?</h4>
                <p className="text-xs text-gray-400">
                  No. For security reasons, once an address is deleted, it cannot be recovered. Ensure you have saved any critical information before deletion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-bold text-sm">Is this service free?</h4>
                <p className="text-xs text-gray-400">
                  Yes, MephistoTempMail is completely free to use for personal and educational purposes.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-xs text-yellow-200/80">
                    <strong>Disclaimer:</strong> Do not use this service for illegal activities. We are not responsible for any misuse of the generated data.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InfoModal;