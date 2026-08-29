import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Copy, Check, RefreshCw, Link as LinkIcon, FileText, FileSpreadsheet, Zap, ExternalLink } from 'lucide-react';
import { fetchDomains } from '../services/mailService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface BulkGeneratorPageProps {
  lang: Language;
}

const BulkGeneratorPage: React.FC<BulkGeneratorPageProps> = ({ lang }) => {
  const [count, setCount] = useState<number>(5);
  const [generatedEmails, setGeneratedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedMagic, setCopiedMagic] = useState(false);
  const [copiedSingleIndex, setCopiedSingleIndex] = useState<number | null>(null);
  const [copiedEmailOnlyIndex, setCopiedEmailOnlyIndex] = useState<number | null>(null);

  const handleGenerateBulk = async () => {
    setLoading(true);
    setCopied(false);
    setCopiedMagic(false);
    try {
      const data = await fetchDomains();
      const domainList = data.domains.length > 0 ? data.domains : ['web-library.net', 'dollicons.com'];
      const results: string[] = [];

      for (let i = 0; i < count; i++) {
        const username = Math.random().toString(36).substring(2, 11);
        const domain = domainList[i % domainList.length];
        results.push(`${username}@${domain}`);
      }
      setGeneratedEmails(results);
    } catch {
      const results: string[] = [];
      for (let i = 0; i < count; i++) {
        const username = Math.random().toString(36).substring(2, 11);
        results.push(`${username}@web-library.net`);
      }
      setGeneratedEmails(results);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (generatedEmails.length === 0) return;
    navigator.clipboard.writeText(generatedEmails.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllMagicLinks = () => {
    if (generatedEmails.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const magicLinks = generatedEmails.map(e => `${origin}/?mailbox=${encodeURIComponent(e)}`).join('\n');
    navigator.clipboard.writeText(magicLinks);
    setCopiedMagic(true);
    setTimeout(() => setCopiedMagic(false), 2000);
  };

  const handleExportTxt = () => {
    if (generatedEmails.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const lines = generatedEmails.map((email, i) => `${i + 1}. ${email} | Magic URL: ${origin}/?mailbox=${encodeURIComponent(email)}`);
    const content = [
      `========================================`,
      `MEPHISTOMAIL - BULK GENERATED MAILBOXES`,
      `Total: ${generatedEmails.length} addresses`,
      `Generated Date: ${new Date().toLocaleString()}`,
      `========================================`,
      ...lines
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_emails_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (generatedEmails.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const headers = 'Index,Email,MagicURL,Domain\n';
    const rows = generatedEmails.map((email, i) => {
      const domain = email.split('@')[1] || '';
      const magicUrl = `${origin}/?mailbox=${encodeURIComponent(email)}`;
      return `${i + 1},"${email}","${magicUrl}","${domain}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_emails_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [otpToast, setOtpToast] = useState<string | null>(null);

  const handleTestOtpForEmail = (email: string) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.dispatchEvent(new CustomEvent('mephisto-test-otp', {
      detail: {
        id: 'test_' + Date.now(),
        from: 'security@verify-service.com',
        subject: lang === 'tr' ? `🔐 Doğrulama Kodunuz: ${otpCode}` : `🔐 Your Verification Code: ${otpCode}`,
        body: lang === 'tr'
          ? `Merhaba! (${email}) MephistoMail canlı test doğrulaması başarılı. Güvenlik OTP kodunuz: ${otpCode}`
          : `Hello! (${email}) MephistoMail live test verification successful. Your security PIN is: ${otpCode}`,
        date: new Date().toLocaleTimeString()
      }
    }));
    setOtpToast(lang === 'tr' ? `⚡ ${email} için Test OTP (${otpCode}) Gönderildi!` : `⚡ Test OTP (${otpCode}) Sent for ${email}!`);
    setTimeout(() => setOtpToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-['Sora'] relative">
      {otpToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <span>{otpToast}</span>
        </div>
      )}
      <SEOHead
        title={lang === 'tr' ? 'Toplu E-posta Oluşturucu | MephistoMail' : 'Bulk Temp Mail Generator | MephistoMail'}
        description={lang === 'tr' ? 'Tek tıkla 5-20 adet geçici e-posta adresi oluşturun ve kopyalayın.' : 'Generate 5 to 20 disposable temporary email addresses in bulk with 1 click.'}
        canonicalUrl="https://mephistomail.site/bulk-generator"
        lang={lang}
      />
      <Header accounts={[]} currentAccount={null} onSwitchAccount={() => {}} onDeleteAccount={() => {}} lang={lang} setLang={() => {}} theme="dark" setTheme={() => {}} onOpenQR={() => {}} onOpenPass={() => {}} onOpenExtension={() => {}} onOpenStats={() => {}} onOpenFilters={() => {}} onOpenLabels={() => {}} />

      <main className="flex-1 max-w-4xl w-full mx-auto pt-24 pb-16 px-4 space-y-8">
        {/* Back to Home Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all text-xs font-bold"
          >
            <span>← {lang === 'tr' ? 'Ana Sayfaya Dön (Posta Kutuma Git)' : 'Back to Home (Go to Inbox)'}</span>
          </Link>
          <span className="text-xs text-slate-500">
            {lang === 'tr' ? 'Canlı e-posta alımı sadece Ana Sayfada aktiftir.' : 'Live mailbox receiver active on Home.'}
          </span>
        </div>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            {lang === 'tr' ? 'Toplu Mail Aracı' : 'Bulk Generator'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {lang === 'tr' ? 'Toplu Geçici E-posta Oluştur' : 'Bulk Disposable Email Generator'}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            {lang === 'tr'
              ? 'Testleriniz, abonelikleriniz veya toplu kayıt işlemleriniz için saniyeler içinde birden fazla adres üretin.'
              : 'Generate multiple temporary email addresses instantly for testing, signups, or batch registrations.'}
          </p>
        </div>

        {/* Generator Controls */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {lang === 'tr' ? 'Adres Sayısı Seçin:' : 'Select Amount:'}
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(num => (
                <button
                  key={num}
                  onClick={() => setCount(num)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${count === num ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateBulk}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? (lang === 'tr' ? 'Üretiliyor...' : 'Generating...') : (lang === 'tr' ? `${count} Adet Adres Üret` : `Generate ${count} Addresses`)}
          </button>
        </div>

        {/* Generated List */}
        {generatedEmails.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {generatedEmails.length} {lang === 'tr' ? 'Üretilen Adres' : 'Generated Addresses'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'OK!' : (lang === 'tr' ? 'Tümünü Kopyala' : 'Copy All')}
                </button>
                <button
                  onClick={handleCopyAllMagicLinks}
                  className="px-3 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                  title={lang === 'tr' ? 'Tüm 1-Tık Magic URL Bağlantılarını (?mailbox=...) Kopyala' : 'Copy All 1-Click Magic URLs (?mailbox=...)'}
                >
                  {copiedMagic ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  {copiedMagic ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? 'Magic URL-ler' : 'All Magic URLs')}
                </button>
                <button
                  onClick={handleExportTxt}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                  title={lang === 'tr' ? 'Adresleri TXT Dosyası Olarak İndir' : 'Export Addresses as TXT File'}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>TXT</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                  title={lang === 'tr' ? 'Adresleri CSV Dosyası Olarak İndir' : 'Export Addresses as CSV File'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {generatedEmails.map((email, idx) => {
                const magicUrl = `/?mailbox=${encodeURIComponent(email)}`;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black/50 border border-white/5 rounded-xl text-xs font-mono gap-2">
                    <span className="text-slate-200 font-bold truncate flex-1">{email}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          const fullMagic = typeof window !== 'undefined' ? `${window.location.origin}/?mailbox=${encodeURIComponent(email)}` : magicUrl;
                          navigator.clipboard.writeText(fullMagic);
                          setCopiedSingleIndex(idx);
                          setTimeout(() => setCopiedSingleIndex(null), 1500);
                        }}
                        className="p-1.5 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] border border-orange-500/20"
                        title={lang === 'tr' ? '1-Tık Magic URL Kopyala' : 'Copy 1-Click Magic URL'}
                      >
                        {copiedSingleIndex === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Magic URL</span>
                      </button>
                      <button
                        onClick={() => handleTestOtpForEmail(email)}
                        className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] border border-amber-500/20"
                        title={lang === 'tr' ? 'Test OTP Gönder' : 'Send Test OTP Demo'}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">OTP</span>
                      </button>
                      <Link
                        to={magicUrl}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title={lang === 'tr' ? 'Posta Kutularda Aç' : 'Open Inbox'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                          setCopiedEmailOnlyIndex(idx);
                          setTimeout(() => setCopiedEmailOnlyIndex(null), 1500);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title={lang === 'tr' ? 'E-postayı Kopyala' : 'Copy email address'}
                      >
                        {copiedEmailOnlyIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default BulkGeneratorPage;

