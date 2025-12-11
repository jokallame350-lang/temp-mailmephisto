import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, CheckCircle2, User, MapPin, Key, Calendar, Wand2, Info, AlertTriangle, Mail } from 'lucide-react';
import { generateRandomPersona, Persona } from '../services/personaService';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
}

const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, currentEmail }) => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPersona(generateRandomPersona());
      setShowHelp(false);
    }
  }, [isOpen]);

  const handleRegenerate = () => {
    setPersona(generateRandomPersona());
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAutofillScript = () => {
    if (!persona) return;

    // Use current temp mail if available, else fallback to a generated one
    const emailToUse = currentEmail || persona.fullName.toLowerCase().replace(/ /g, '') + Math.floor(Math.random()*100) + '@gmail.com';

    // MAGIC SCRIPT 7.0 (Turkish Edition)
    // Features: Turkish keyword support (eposta, sifre, kullanici, etc.)
    const script = `
(function(){
  const p = {
    fn: "${persona.fullName}",
    em: "${emailToUse}", 
    pw: "${persona.password}",
    ad: "${persona.address}",
    bd: "${persona.birthDate}",
    usr: "${persona.fullName.toLowerCase().replace(/ /g, '_') + Math.floor(Math.random()*100)}",
    ph: "${Math.floor(Math.random() * 9000000000) + 1000000000}" 
  };

  function triggerEvents(el) {
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    el.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }
    
    element.value = value;
    const tracker = element._valueTracker;
    if (tracker) {
      tracker.setValue(value); 
    }
    triggerEvents(element);
  }

  let count = 0;
  const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
  
  inputs.forEach(i => {
    const n = (i.name || i.id || i.getAttribute('aria-label') || i.placeholder || '').toLowerCase();
    const t = (i.type || '').toLowerCase();
    let val = null;

    if (t === 'hidden' || i.disabled || i.readOnly || i.style.display === 'none') return;

    // PRIORITY 1: Email (English + Turkish)
    if (t === 'email' || n.includes('mail') || n.includes('eposta') || n.includes('e-posta')) val = p.em;
    
    // PRIORITY 2: Phone (English + Turkish)
    else if(n.includes('mobile') || n.includes('phone') || n.includes('number') || n.includes('tel') || n.includes('cep') || n.includes('telefon')) val = p.ph;
    
    // PRIORITY 3: Password (English + Turkish)
    else if(n.includes('password') || n.includes('pass') || n.includes('sifre') || n.includes('parola') || t === 'password') val = p.pw;
    
    // PRIORITY 4: Username (English + Turkish)
    else if(n.includes('username') || n.includes('login') || n.includes('kullanici') || n.includes('nick') || (n.includes('user') && !n.includes('name'))) val = p.usr;
    
    // PRIORITY 5: Name (English + Turkish)
    else if(n.includes('fullname') || n.includes('adsoyad') || (n.includes('name') && !n.includes('first') && !n.includes('last'))) val = p.fn;
    else if(n.includes('first') || n.includes('isim')) val = p.fn.split(' ')[0];
    else if(n.includes('last') || n.includes('soyad')) val = p.fn.split(' ')[1];
    
    // PRIORITY 6: Address / Date (English + Turkish)
    else if(n.includes('address') || n.includes('street') || n.includes('location') || n.includes('adres')) val = p.ad;
    else if(t === 'date' || n.includes('birth') || n.includes('dob') || n.includes('dogum')) val = p.bd;

    if (val) {
      try {
        i.focus();
        setNativeValue(i, val);
        i.style.boxShadow = '0 0 0 2px #10b981';
        i.style.transition = 'box-shadow 0.3s';
        count++;
      } catch(e) {}
    }
  });

  const toast = document.createElement('div');
  toast.textContent = '⚡ Mephisto v7 (TR): ' + count + ' fields filled!';
  toast.style.cssText = 'position:fixed; top:20px; right:20px; background:#4f46e5; color:white; padding:12px 24px; border-radius:8px; font-family:sans-serif; font-weight:bold; z-index:2147483647; pointer-events:none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);';
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);

  return "✅ Injection Complete (" + count + " fields) using: " + p.em;
})();
    `;
    
    navigator.clipboard.writeText(script.trim());
    setCopiedField('script');
    setTimeout(() => setCopiedField(null), 3000);
  };

  if (!isOpen || !persona) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950 shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Fake Persona
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={handleRegenerate}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors text-indigo-600 dark:text-indigo-400"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          <FieldRow 
            label="Full Name" 
            value={persona.fullName} 
            icon={<User className="w-4 h-4" />} 
            onCopy={() => handleCopy(persona.fullName, 'name')}
            isCopied={copiedField === 'name'}
          />

          <FieldRow 
            label="Password" 
            value={persona.password} 
            icon={<Key className="w-4 h-4" />} 
            onCopy={() => handleCopy(persona.password, 'password')}
            isCopied={copiedField === 'password'}
            isMono
          />

          <FieldRow 
            label="Birth Date" 
            value={persona.birthDate} 
            icon={<Calendar className="w-4 h-4" />} 
            onCopy={() => handleCopy(persona.birthDate, 'dob')}
            isCopied={copiedField === 'dob'}
          />

          <FieldRow 
            label="Address" 
            value={persona.address} 
            icon={<MapPin className="w-4 h-4" />} 
            onCopy={() => handleCopy(persona.address, 'address')}
            isCopied={copiedField === 'address'}
          />
          
          {/* Magic Script Section */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
             <button 
                onClick={handleCopyAutofillScript}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
             >
                {copiedField === 'script' ? <CheckCircle2 className="w-5 h-5" /> : <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                {copiedField === 'script' ? 'Script Copied!' : 'Copy Autofill Script'}
             </button>
             
             <div className="mt-3">
               <button 
                 onClick={() => setShowHelp(!showHelp)}
                 className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors w-full justify-center"
               >
                 <Info className="w-3 h-3" />
                 How to use this?
               </button>

               {showHelp && (
                 <div className="mt-2 p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-start gap-2">
                       <span className="bg-indigo-200 dark:bg-slate-700 text-indigo-700 dark:text-slate-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                       <span className="text-gray-700 dark:text-slate-300">Click the <b>Copy Autofill Script</b> button above.</span>
                    </div>
                    <div className="flex items-start gap-2">
                       <span className="bg-indigo-200 dark:bg-slate-700 text-indigo-700 dark:text-slate-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                       <span className="text-gray-700 dark:text-slate-300">Go to target site, press <kbd className="bg-white dark:bg-slate-900 px-1 rounded border border-gray-200 dark:border-slate-700 font-mono">F12</kbd>, select <b>Console</b>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                       <span className="bg-indigo-200 dark:bg-slate-700 text-indigo-700 dark:text-slate-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                       <div className="text-gray-700 dark:text-slate-300">
                          Paste (Ctrl+V) and hit <b>Enter</b>.
                       </div>
                    </div>
                    
                    {/* Warning Box */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-2 rounded-lg mt-2">
                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Console Warning?</span>
                      </div>
                      <p className="text-orange-700 dark:text-orange-300 mb-1">
                        If you see <b>"Warning: Don't paste code..."</b>, type <code className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded font-mono select-all">allow pasting</code> and hit Enter.
                      </p>
                      <p className="text-orange-600/80 dark:text-orange-400/80 text-[10px] mt-1 italic border-t border-orange-200 dark:border-orange-800/50 pt-1">
                        Ignore other red errors. If you see the "⚡ Mephisto" green popup, it worked!
                      </p>
                    </div>

                 </div>
               )}
             </div>
          </div>

        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 text-center text-[10px] text-gray-400 dark:text-slate-600 shrink-0">
          This data is randomly generated locally.
        </div>
      </div>
    </div>
  );
};

const FieldRow: React.FC<{ 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  onCopy: () => void; 
  isCopied: boolean;
  isMono?: boolean;
}> = ({ label, value, icon, onCopy, isCopied, isMono }) => (
  <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between group">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 shadow-sm shrink-0">
        {icon}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">{label}</span>
        <span className={`text-sm font-semibold text-gray-800 dark:text-slate-200 truncate ${isMono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    </div>
    <button 
      onClick={onCopy}
      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
    >
      {isCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
    </button>
  </div>
);

export default PersonaModal;