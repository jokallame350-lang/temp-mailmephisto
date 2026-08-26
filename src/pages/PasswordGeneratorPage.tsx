import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Copy, Check, RefreshCw, ArrowLeft, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface PasswordGeneratorPageProps {
  lang: Language;
}

export const PasswordGeneratorPage: React.FC<PasswordGeneratorPageProps> = ({ lang }) => {
  const isTr = lang === 'tr';
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthScore = () => {
    let score = 0;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (includeUppercase) score += 1;
    if (includeNumbers) score += 1;
    if (includeSymbols) score += 1;
    return score;
  };

  const strength = getStrengthScore();

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Güçlü Şifre Üretici — MephistoMail | Kırılamaz Güvenli Parola" : "Strong Password Generator — MephistoMail | Unbreakable Passwords"}
        description={isTr
          ? "Kriptografik olarak güvenli, kırılamaz ve rastgele şifreler üretin. Büyük harf, rakam ve sembol seçenekleriyle %100 yerel ve güvenli."
          : "Generate cryptographically secure, random, and unbreakable passwords. Customizable length, symbols, and entropy score."}
        canonicalUrl="https://mephistomail.site/password-generator"
        lang={lang}
      />

      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <span>MephistoMail</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              {isTr ? 'Geçici Mail' : 'Temp Mail'}
            </Link>
            <Link to="/tools" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              {isTr ? 'Araçlar' : 'Tools'}
            </Link>
            <Link to="/blog" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              Blog
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {isTr ? 'Ana Sayfaya Dön' : 'Back to Home'}
        </Link>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-white mb-4 shadow-lg shadow-red-500/20">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {isTr ? "Güçlü Şifre Üretici" : "Strong Password Generator"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isTr
              ? "Tarayıcınızda yerel kriptografik rastgelelik (Web Crypto API) kullanarak kırılamaz şifreler oluşturun."
              : "Generate uncrackable, cryptographically secure passwords locally in your browser with zero data transmission."}
          </p>
        </div>

        {/* Password Display Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-700/60 rounded-2xl p-4 mb-6 gap-3">
            <div className="font-mono text-base sm:text-2xl text-white font-bold tracking-wider truncate select-all">
              {password}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generatePassword}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                title={isTr ? "Yeniden Üret" : "Regenerate"}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopy}
                className="px-5 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition-transform active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Kopyala' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">{isTr ? "Güvenlik Derecesi" : "Strength Level"}</span>
              <span className={`font-bold ${strength >= 4 ? 'text-emerald-400' : strength >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                {strength >= 5 ? (isTr ? 'Çok Güçlü (Kırılamaz)' : 'Very Strong') : strength >= 4 ? (isTr ? 'Güçlü' : 'Strong') : (isTr ? 'Orta' : 'Moderate')}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-full flex-1 transition-colors ${
                    level <= strength
                      ? strength >= 4
                        ? 'bg-emerald-500'
                        : strength >= 3
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Configuration Sliders & Toggles */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>{isTr ? "Şifre Uzunluğu" : "Password Length"}</span>
                <span className="font-mono text-amber-400 font-bold">{length} {isTr ? "Karakter" : "Characters"}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-300">{isTr ? "Büyük Harfler (A-Z)" : "Uppercase (A-Z)"}</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-300">{isTr ? "Rakamlar (0-9)" : "Numbers (0-9)"}</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-300">{isTr ? "Özel Semboller (!@#)" : "Symbols (!@#)"}</span>
              </label>
            </div>

            {/* Quick 1-Click Preset Buttons */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">{isTr ? "1-Tık Hazır Şablonlar (Presets):" : "1-Click Quick Presets:"}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setLength(4); setIncludeUppercase(false); setIncludeNumbers(true); setIncludeSymbols(false); }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  🔢 PIN (4 {isTr ? 'Hane' : 'Digits'})
                </button>
                <button
                  onClick={() => { setLength(6); setIncludeUppercase(false); setIncludeNumbers(true); setIncludeSymbols(false); }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  🔢 PIN (6 {isTr ? 'Hane' : 'Digits'})
                </button>
                <button
                  onClick={() => { setLength(16); setIncludeUppercase(true); setIncludeNumbers(true); setIncludeSymbols(true); }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  ⚡ {isTr ? 'Standart Güvenli' : 'Standard'} (16 {isTr ? 'Karakter' : 'Chars'})
                </button>
                <button
                  onClick={() => { setLength(32); setIncludeUppercase(true); setIncludeNumbers(true); setIncludeSymbols(true); }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  🛡️ {isTr ? 'Maksimum Güvenlik' : 'Max Entropy'} (32 {isTr ? 'Karakter' : 'Chars'})
                </button>
                <button
                  onClick={() => { setLength(20); setIncludeUppercase(true); setIncludeNumbers(true); setIncludeSymbols(false); }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  🔤 Alfanumerik (20 {isTr ? 'Karakter' : 'Chars'})
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default PasswordGeneratorPage;
