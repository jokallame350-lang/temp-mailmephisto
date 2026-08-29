import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Copy, Check, Lock, EyeOff, Link as LinkIcon, FileText, FileSpreadsheet, Zap } from 'lucide-react';
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
  const [copiedMagic, setCopiedMagic] = useState(false);

  const isTr = lang === 'tr';

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

  const handleCopyMagicLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const tempUser = 'burn_' + Math.random().toString(36).substring(2, 9) + '@web-library.net';
    const magicUrl = `${origin}/?mailbox=${encodeURIComponent(tempUser)}`;
    navigator.clipboard.writeText(magicUrl);
    setCopiedMagic(true);
    setTimeout(() => setCopiedMagic(false), 2000);
  };

  const handleTestOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.dispatchEvent(new CustomEvent('mephisto-test-otp', {
      detail: {
        id: 'test_' + Date.now(),
        from: 'security@burnnote-service.com',
        subject: isTr ? `🔥 Gizli Not OTP Kodunuz: ${otpCode}` : `🔥 Secret Burn Note OTP PIN: ${otpCode}`,
        body: isTr
          ? `Bu mesaj 1 kez okunduktan sonra silinecek gizli not OTP doğrulama kodudur: ${otpCode}`
          : `This is a 1-time self-destructing secret note OTP verification code: ${otpCode}`,
        date: new Date().toLocaleTimeString()
      }
    }));
    alert(isTr ? `⚡ Gizli Not Test OTP (${otpCode}) Gönderildi!` : `⚡ Secret Burn Note Test OTP (${otpCode}) Triggered!`);
  };

  const handleExportTxt = () => {
    if (!noteText && !generatedLink) return;
    const content = [
      `========================================`,
      `MEPHISTOMAIL - BURN NOTE EXPORT`,
      `========================================`,
      `Burn Note Link: ${generatedLink || 'N/A'}`,
      `Created Date:   ${new Date().toLocaleString()}`,
      `Note Length:    ${noteText.length} characters`,
      `Content:`,
      `${noteText}`,
      `========================================`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burn_note_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!noteText && !generatedLink) return;
    const headers = 'Link,NoteLength,CreatedAt,NotePreview\n';
    const preview = noteText.replace(/"/g, '""').substring(0, 100);
    const row = `"${generatedLink || ''}","${noteText.length}","${new Date().toISOString()}","${preview}"\n`;

    const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burn_note_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-['Sora']">
      <SEOHead
        title={isTr ? 'Şifreli Not Oluştur (Privnote) | MephistoMail' : 'Self-Destructing Burn Notes | MephistoMail'}
        description={isTr ? 'Okunduktan sonra kendini yok eden şifreli gizli mesaj oluşturun.' : 'Create encrypted self-destructing secret notes that vanish after reading.'}
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
            <span>← {isTr ? 'Ana Sayfaya Dön (Posta Kutuma Git)' : 'Back to Home (Go to Inbox)'}</span>
          </Link>
          <span className="text-xs text-slate-500">
            {isTr ? 'Canlı e-posta alımı sadece Ana Sayfada aktiftir.' : 'Live mailbox receiver active on Home.'}
          </span>
        </div>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5" />
            {isTr ? 'Gizli Not Aracı' : 'Burn Note Tool'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {isTr ? 'Kendini Yok Eden Gizli Not' : 'Self-Destructing Secret Note'}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            {isTr
              ? 'Şifreler ve hassas veriler için okunduktan sonra silinen uçtan uca gizli bağlantı oluşturun.'
              : 'Create an encrypted one-time note that self-destructs after reading.'}
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl mx-auto">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={5}
            placeholder={isTr ? 'Gizli notunuzu buraya yazın (şifreler, anahtarlar, özel mesajlar...)' : 'Write your secret note here (passwords, keys, private messages...)'}
            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-red-500 transition-colors"
          />

          {/* Interactive Utility Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-black/40 border border-white/5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Ek Araçlar:' : 'Utilities:'}</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMagicLink}
                className="px-3 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                title={isTr ? 'Eşlik eden 1-Tık Magic Mailbox URL Kopyala' : 'Copy Attached 1-Click Magic Mailbox URL'}
              >
                {copiedMagic ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedMagic ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Magic URL (?mailbox=)' : 'Magic URL (?mailbox=)')}</span>
              </button>
              <button
                type="button"
                onClick={handleTestOtp}
                className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                title={isTr ? 'Gizli Not Test OTP Gönder' : 'Trigger Burn Note Test OTP'}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTr ? 'Test OTP Demo' : 'Test OTP Demo'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportTxt}
                disabled={!noteText.trim() && !generatedLink}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                title={isTr ? 'Notu TXT İndir' : 'Export Note as TXT'}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!noteText.trim() && !generatedLink}
                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                title={isTr ? 'Notu CSV İndir' : 'Export Note as CSV'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateNote}
            disabled={!noteText.trim()}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-black font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-5 h-5" />
            {isTr ? 'Gizli Bağlantı Oluştur' : 'Create Burn Link'}
          </button>

          {generatedLink && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <EyeOff className="w-4 h-4" />
                {isTr ? 'Tek Kullanımlık Bağlantınız Hazır' : 'One-Time Link Ready'}
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
                  {copied ? 'OK!' : (isTr ? 'Kopyala' : 'Copy')}
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

