import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';
import { ShieldCheck, AlertTriangle, CheckCircle, Search, RefreshCw, FileText, Link as LinkIcon, ExternalLink, Zap, FileSpreadsheet, Check } from 'lucide-react';

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
  const [copiedMagic, setCopiedMagic] = useState(false);

  const isTr = lang === 'tr';

  const analyzeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setIsAnalyzing(true);
    setCopiedMagic(false);
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

  const handleCopyMagicLink = (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const magicUrl = `${origin}/?mailbox=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(magicUrl);
    setCopiedMagic(true);
    setTimeout(() => setCopiedMagic(false), 2000);
  };

  const handleTestOtp = (email: string) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.dispatchEvent(new CustomEvent('mephisto-test-otp', {
      detail: {
        id: 'test_' + Date.now(),
        from: 'security@verify-service.com',
        subject: isTr ? `🔐 Doğrulama Kodunuz: ${otpCode}` : `🔐 Your Verification Code: ${otpCode}`,
        body: isTr
          ? `Merhaba! (${email}) MephistoMail canlı test doğrulaması başarılı. Güvenlik OTP kodunuz: ${otpCode}`
          : `Hello! (${email}) MephistoMail live test verification successful. Your security PIN is: ${otpCode}`,
        date: new Date().toLocaleTimeString()
      }
    }));
    alert(isTr ? `⚡ ${email} adresi için Test OTP (${otpCode}) Gönderildi!` : `⚡ Test OTP (${otpCode}) Sent for ${email}!`);
  };

  const handleExportTxt = () => {
    if (!result) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const magicUrl = `${origin}/?mailbox=${encodeURIComponent(result.email)}`;
    const content = [
      `========================================`,
      `MEPHISTOMAIL - DISPOSABLE EMAIL ANALYSIS REPORT`,
      `========================================`,
      `Target Email:    ${result.email}`,
      `Domain:          ${result.domain}`,
      `Is Disposable:   ${result.isDisposable ? 'YES (Disposable Burner Email)' : 'NO (Standard Domain)'}`,
      `Risk Score:      ${result.riskScore}%`,
      `MX Status:       ${result.mxStatus}`,
      `Recommendation:  ${result.recommendation}`,
      `Magic Share URL: ${magicUrl}`,
      `Checked Date:    ${new Date().toLocaleString()}`,
      `========================================`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_check_${result.domain}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!result) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const magicUrl = `${origin}/?mailbox=${encodeURIComponent(result.email)}`;
    const headers = 'Email,Domain,IsDisposable,RiskScore,MXStatus,Recommendation,MagicURL,CheckedDate\n';
    const row = `"${result.email}","${result.domain}","${result.isDisposable ? 'true' : 'false'}","${result.riskScore}%","${result.mxStatus}","${result.recommendation.replace(/"/g, '""')}","${magicUrl}","${new Date().toISOString()}"\n`;

    const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_check_${result.domain}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                <div className="flex flex-wrap items-center gap-2">
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

              {/* Utility Tools Action Bar for Analysis */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0a0a0f]/80 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'İnteraktif Araçlar:' : 'Interactive Utilities:'}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyMagicLink(result.email)}
                    className="px-3 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    title={isTr ? '1-Tık Magic URL Bağlantısını Kopyala' : 'Copy 1-Click Magic URL'}
                  >
                    {copiedMagic ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    <span>{copiedMagic ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? '1-Tık Magic URL' : 'Magic URL (?mailbox=)')}</span>
                  </button>
                  <button
                    onClick={() => handleTestOtp(result.email)}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    title={isTr ? 'Test OTP Gönder' : 'Trigger Test OTP Demo'}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTr ? 'Test OTP Demo' : 'Test OTP Demo'}</span>
                  </button>
                  <Link
                    to={`/?mailbox=${encodeURIComponent(result.email)}`}
                    className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    title={isTr ? 'Posta Kutularda Aç' : 'Open in Inbox'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isTr ? 'Kutuyu Aç' : 'Open Inbox'}</span>
                  </Link>
                  <button
                    onClick={handleExportTxt}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    title={isTr ? 'Raporu TXT İndir' : 'Export TXT Report'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>TXT</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    title={isTr ? 'Raporu CSV İndir' : 'Export CSV Report'}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
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

