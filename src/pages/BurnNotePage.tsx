import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Copy, Check, Lock, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface BurnNotePageProps {
  lang: Language;
}

const BurnNotePage: React.FC<BurnNotePageProps> = ({ lang }) => {
  const [noteText, setNoteText] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateNote = () => {
    if (!noteText.trim()) return;
    const hash = btoa(encodeURIComponent(noteText));
    const url = `${window.location.origin}/burn-note#${hash}`;
    setGeneratedLink(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-['Sora']">
      <SEOHead
        title={lang === 'tr' ? 'Şifreli Not Oluştur (Privnote) | MephistoMail' : 'Self-Destructing Burn Notes | MephistoMail'}
        description={lang === 'tr' ? 'Okunduktan sonra kendini yok eden şifreli gizli mesaj oluşturun.' : 'Create encrypted self-destructing secret notes that vanish after reading.'}
        canonicalUrl="https://mephistomail.site/burn-note"
        lang={lang}
      />
      <Header accounts={[]} currentAccount={null} onSwitchAccount={() => {}} onDeleteAccount={() => {}} lang={lang} setLang={() => {}} theme="dark" setTheme={() => {}} onOpenQR={() => {}} onOpenPass={() => {}} onOpenExtension={() => {}} onOpenStats={() => {}} onOpenFilters={() => {}} onOpenLabels={() => {}} />

      <main className="flex-1 max-w-3xl w-full mx-auto pt-24 pb-16 px-4 space-y-8">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5" />
            {lang === 'tr' ? 'Gizli Not Aracı' : 'Burn Note Tool'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {lang === 'tr' ? 'Kendini Yok Eden Gizli Not' : 'Self-Destructing Secret Note'}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            {lang === 'tr'
              ? 'Şifreler ve hassas veriler için okunduktan sonra silinen uçtan uca gizli bağlantı oluşturun.'
              : 'Create an encrypted one-time note that self-destructs after reading.'}
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl mx-auto">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={5}
            placeholder={lang === 'tr' ? 'Gizli notunuzu buraya yazın (şifreler, anahtarlar, özel mesajlar...)' : 'Write your secret note here (passwords, keys, private messages...)'}
            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-500 transition-colors"
          />

          <button
            onClick={handleCreateNote}
            disabled={!noteText.trim()}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-black font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-5 h-5" />
            {lang === 'tr' ? 'Gizli Bağlantı Oluştur' : 'Create Burn Link'}
          </button>

          {generatedLink && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <EyeOff className="w-4 h-4" />
                {lang === 'tr' ? 'Tek Kullanımlık Bağlantınız Hazır' : 'One-Time Link Ready'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-grow bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-black text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'OK!' : (lang === 'tr' ? 'Kopyala' : 'Copy')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default BurnNotePage;
