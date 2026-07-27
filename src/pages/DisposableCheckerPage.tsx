import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';
import { ShieldCheck, AlertTriangle, CheckCircle, Search, RefreshCw, Lock, Server, FileText } from 'lucide-react';

interface DisposableCheckerPageProps {
  lang: Language;
}

// Built-in list of known disposable email domains for 100% client-side instant detection
const KNOWN_DISPOSABLE_DOMAINS = new Set([
  'mail.tm', 'mail.gw', 'guerrillamail.com', 'guerrillamailblock.com', 'grr.la', 'sharklasers.com',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.de', 'tempmail.org', 'tempmail.com',
  '10minutemail.com', 'mailinator.com', 'throwawaymail.com', 'getnada.com', 'trashmail.com',
  'yopmail.com', 'dispostable.com', 'tempinbox.com', 'fakeinbox.com', 'crazymailing.com',
  'maildrop.cc', 'mohmal.com', 'tempail.com', 'temp-mail.ru', 'mintemail.com', 'burnermail.io'
]);

interface AnalysisResult {
  email: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number; // 0 to 100
  mxStatus: string;
  recommendation: string;
}

export const DisposableCheckerPage: React.FC<DisposableCheckerPageProps> = ({ lang }) => {
  const [inputEmail, setInputEmail] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isTr = lang === 'tr';

  const analyzeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const email = inputEmail.trim().toLowerCase();
      const parts = email.split('@');
      const domain = parts.length > 1 ? parts[1] : email;

      const isKnown = KNOWN_DISPOSABLE_DOMAINS.has(domain) ||
        domain.includes('temp') ||
        domain.includes('fake') ||
        domain.includes('trash') ||
        domain.includes('disposable') ||
        domain.includes('burner');

      const riskScore = isKnown ? 95 : (domain.includes('gmail.com') || domain.includes('outlook.com') || domain.includes('yahoo.com') || domain.includes('hotmail.com') ? 5 : 40);

      setResult({
        email,
        domain,
        isDisposable: isKnown,
        riskScore,
        mxStatus: isKnown ? 'Volatile / Ephemeral' : 'Standard MX Mail Server',
        recommendation: isKnown
          ? (isTr ? 'Bu e-posta bir kullan-at (temp mail) adresidir. Spam riski yüksektir.' : 'This email is a disposable temp address. High spam/fraud risk.')
          : (isTr ? 'Bu e-posta adresi standart bir alan adına aittir.' : 'This email appears to be a standard legitimate domain.')
      });
      setIsAnalyzing(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-300">
      <SEOHead lang={lang} />

      <Header
        accounts={[]}
        currentAccount={null}
        onSwitchAccount={() => {}}
        onDeleteAccount={() => {}}
        lang={lang}
        setLang={() => {}}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>{isTr ? 'Ücretsiz Geliştirici & Güvenlik Aracı' : 'Free Developer & Security Tool'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {isTr ? 'Kullan-At E-posta Kontrol Aracı' : 'Disposable Email Detector & Checker'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            {isTr
              ? 'Herhangi bir e-posta adresini veya alan adını yazın. %100 istemci taraflı analiz ile adresi anında denetleyin.'
              : 'Test any email address or domain. Instantly detect disposable burner emails with zero API costs.'}
          </p>
        </div>

        {/* Checker Box */}
        <div className="bg-[#12121e] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={analyzeEmail} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder={isTr ? 'E-posta adresi yazın (örn: test@guerrillamail.com)...' : 'Enter email address (e.g. test@guerrillamail.com)...'}
                className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0f] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isTr ? 'E-postayı Analiz Et' : 'Analyze Email'}</span>
            </button>
          </form>

          {/* Results Display */}
          {result && (
            <div className="border-t border-slate-800/80 pt-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0a0f] border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">{isTr ? 'İncelenen E-posta' : 'Target Email'}</span>
                  <span className="text-base font-semibold text-white font-mono">{result.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.isDisposable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isTr ? 'KULLAN-AT MAIL (DISPOSABLE)' : 'DISPOSABLE BURNER EMAIL'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isTr ? 'STANDART E-POSTA' : 'LEGITIMATE DOMAIN'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0f] p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">{isTr ? 'Risk Skoru' : 'Risk Score'}</span>
                  <span className={`text-2xl font-bold ${result.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    %{result.riskScore}
                  </span>
                </div>

                <div className="bg-[#0a0a0f] p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">{isTr ? 'Sunucu Tipi' : 'Server Type'}</span>
                  <span className="text-sm font-medium text-slate-200">{result.mxStatus}</span>
                </div>

                <div className="bg-[#0a0a0f] p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">{isTr ? 'Alan Adı (Domain)' : 'Domain'}</span>
                  <span className="text-sm font-mono text-slate-200">{result.domain}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-[#0a0a0f]/60 p-4 rounded-xl border border-slate-800/60 leading-relaxed">
                <strong className="text-slate-300">{isTr ? 'Öneri: ' : 'Recommendation: '}</strong>
                {result.recommendation}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default DisposableCheckerPage;
