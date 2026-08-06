import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Copy, Check, RefreshCw } from 'lucide-react';
import { fetchDomains } from '../services/mailService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language, translations } from '../translations';

interface BulkGeneratorPageProps {
  lang: Language;
}

const BulkGeneratorPage: React.FC<BulkGeneratorPageProps> = ({ lang }) => {
  const t = translations[lang];
  const [count, setCount] = useState<number>(5);
  const [generatedEmails, setGeneratedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateBulk = async () => {
    setLoading(true);
    setCopied(false);
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

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-['Sora']">
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {generatedEmails.length} {lang === 'tr' ? 'Üretilen Adres' : 'Generated Addresses'}
              </span>
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-green-500/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'OK!' : (lang === 'tr' ? 'Tümünü Kopyala' : 'Copy All')}
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {generatedEmails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-black/50 border border-white/5 rounded-xl text-xs font-mono">
                  <span className="text-slate-200 font-bold">{email}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(email);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default BulkGeneratorPage;
