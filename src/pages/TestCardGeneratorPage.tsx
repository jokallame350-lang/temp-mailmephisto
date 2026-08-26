import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Copy, Check, RefreshCw, ArrowLeft, Mail, ShieldAlert, Code2, Download } from 'lucide-react';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Language } from '../translations';

interface TestCardGeneratorPageProps {
  lang: Language;
}

interface TestCard {
  brand: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  holder: string;
}

export const TestCardGeneratorPage: React.FC<TestCardGeneratorPageProps> = ({ lang }) => {
  const isTr = lang === 'tr';
  const [selectedBrand, setSelectedBrand] = useState<'visa' | 'mastercard' | 'amex' | 'discover'>('visa');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cards, setCards] = useState<TestCard[]>([]);

  // Luhn Algorithm Generator for valid dummy test card numbers
  const generateLuhnCard = (prefix: string, length: number): string => {
    let result = prefix;
    while (result.length < length - 1) {
      result += Math.floor(Math.random() * 10).toString();
    }
    // Calculate Luhn check digit
    let sum = 0;
    for (let i = 0; i < result.length; i++) {
      let digit = parseInt(result[result.length - 1 - i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return result + checkDigit.toString();
  };

  const generateNewCard = () => {
    const prefixes: Record<string, { prefix: string; len: number; cvvLen: number }> = {
      visa: { prefix: '4532', len: 16, cvvLen: 3 },
      mastercard: { prefix: '5425', len: 16, cvvLen: 3 },
      amex: { prefix: '3782', len: 15, cvvLen: 4 },
      discover: { prefix: '6011', len: 16, cvvLen: 3 }
    };

    const config = prefixes[selectedBrand];
    const rawNum = generateLuhnCard(config.prefix, config.len);
    const formattedNum = rawNum.replace(/(.{4})/g, '$1 ').trim();

    const currentYear = new Date().getFullYear();
    const expYear = (currentYear + Math.floor(Math.random() * 4) + 1).toString();
    const expMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');

    let cvv = '';
    for (let i = 0; i < config.cvvLen; i++) {
      cvv += Math.floor(Math.random() * 10).toString();
    }

    const firstNames = ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Sam', 'Mert', 'Emre', 'Can', 'Chris', 'Robin'];
    const lastNames = ['Yildiz', 'Smith', 'Doe', 'Kaya', 'Demir', 'Miller', 'Taylor', 'Johnson'];
    const holder = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`.toUpperCase();

    const newCard: TestCard = {
      brand: selectedBrand.toUpperCase(),
      cardNumber: formattedNum,
      expMonth,
      expYear,
      cvv,
      holder
    };

    setCards([newCard, ...cards.slice(0, 4)]);
  };

  React.useEffect(() => {
    generateNewCard();
  }, [selectedBrand]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activeCard = cards[0];

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-200 flex flex-col selection:bg-red-500/30 selection:text-white">
      <SEOHead
        title={isTr ? "Yazılım Testi İçin Sahte Kredi Kartı Üretici (Luhn Uyumlu) — MephistoMail" : "Dummy Test Credit Card Generator for Developers (Luhn Valid) — MephistoMail"}
        description={isTr
          ? "Geliştiriciler ve QA test uzmanları için Luhn algoritmasına uygun test kredi kartı numaraları üretin. Visa, Mastercard, Amex test kartları."
          : "Generate Luhn-valid test credit card numbers for software QA, checkout testing, and sandbox verification. Visa, Mastercard, Amex."}
        canonicalUrl="https://mephistomail.site/test-card-generator"
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
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-4 shadow-lg shadow-orange-500/10">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {isTr ? "Test Kredi Kartı Üretici" : "Dummy Test Card Generator"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isTr
              ? "Yazılım geliştiricileri ve QA test mühendisleri için ödeme formlarını, Stripe/PayPal sandbox ortamlarını test etmek amacıyla Luhn algoritmasına uygun test kartı üreticisi."
              : "Generate valid Luhn-compliant dummy credit card numbers for checkout QA, Stripe/Braintree sandbox testing, and form validation."}
          </p>
        </div>

        {/* Important Disclaimer Alert */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>{isTr ? "Yasal Uyarı & Geliştirici Notu:" : "Disclaimer for Developers:"}</strong>{" "}
            {isTr
              ? "Bu kart numaraları yalnızca yazılım testi ve sandbox ortamları için matematiksel (Luhn algoritması) olarak üretilmiştir. Gerçek bir bakiye veya finansal karşılığı yoktur, gerçek alışverişlerde kullanılamaz."
              : "These numbers are mathematically generated via the Luhn formula for sandbox development and UI validation only. They hold no balance and cannot be used for real monetary transactions."}
          </div>
        </div>

        {/* Brand Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['visa', 'mastercard', 'amex', 'discover'] as const).map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                selectedBrand === brand
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 border-red-500 text-white shadow-lg shadow-red-500/20 scale-105'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Visual Realistic Credit Card */}
        {activeCard && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border border-white/10 p-6 sm:p-8 shadow-2xl mb-8 max-w-md mx-auto aspect-[1.586/1] flex flex-col justify-between text-white">
            <div className="flex justify-between items-center">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-r from-amber-400 to-amber-200 shadow-md" />
              <span className="font-extrabold text-sm tracking-wider uppercase text-amber-400">{activeCard.brand}</span>
            </div>

            <div className="font-mono text-xl sm:text-2xl tracking-widest font-bold my-4">
              {activeCard.cardNumber}
            </div>

            <div className="flex justify-between items-end text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">{isTr ? "Kart Sahibi" : "Cardholder"}</div>
                <div className="font-semibold tracking-wider">{activeCard.holder}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">{isTr ? "Son Kullanma" : "Expires"}</div>
                <div className="font-mono font-bold">{activeCard.expMonth}/{activeCard.expYear.slice(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">CVV</div>
                <div className="font-mono font-bold">{activeCard.cvv}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls & Copy Inputs */}
        {activeCard && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-400 block mb-1">{isTr ? "Kart Numarası" : "Card Number"}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeCard.cardNumber.replace(/\s/g, '')}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(activeCard.cardNumber.replace(/\s/g, ''), 'num')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedField === 'num' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'num' ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Kopyala' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">{isTr ? "Son Kullanma Tarihi" : "Expiry"}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${activeCard.expMonth}/${activeCard.expYear}`}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(`${activeCard.expMonth}/${activeCard.expYear}`, 'exp')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
                  >
                    {copiedField === 'exp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CVV</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeCard.cvv}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(activeCard.cvv, 'cvv')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
                  >
                    {copiedField === 'cvv' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">{isTr ? "Yenile" : "Generate"}</label>
                <button
                  onClick={generateNewCard}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isTr ? "Yeni Test Kartı" : "New Card"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default TestCardGeneratorPage;
