import React, { useState } from 'react';
import { X, ChevronRight, Award, Check, Loader2, Crown, ShieldCheck } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  
  const [formData, setFormData] = useState({
    email: '', 
    name: '',
    surname: '',
    phone: '',
    city: 'Istanbul',
    address: 'Nisantasi'
  });

  // FİYATLANDIRMA DÜZELTİLDİ: 
  // Aylık seçilirse ekranda 10$
  // Yıllık seçilirse ekranda aylık bazda 5$ (toplamda 60$) görünür
  const displayPrice = billingCycle === 'month' ? 10 : 5;
  const totalChargeAmount = billingCycle === 'month' ? 12.0 : 72.0; // KDV Dahil Toplam Tahsilat
  const basePrice = billingCycle === 'month' ? 10.0 : 60.0;
  const kdvAmount = basePrice * 0.2;

  const premiumFeatures = [
    "Connect own custom domain",
    "Dedicated premium domains",
    "Up to 15 addresses at the same time", 
    "100% Private address with full ownership",
    "Extended 100MB storage for emails",
    "Enhanced privacy and security",
    "No ads. Premium support"
  ];

  const handleIyzicoPayment = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    if (step === 2 && (!formData.name || !formData.surname)) {
      alert("Please fill name and surname fields.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: totalChargeAmount, cycle: billingCycle })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.checkoutFormContent) {
        const oldForm = document.getElementById('iyzipay-checkout-form');
        if (oldForm) oldForm.remove();

        const iyzicoDiv = document.createElement('div');
        iyzicoDiv.id = 'iyzipay-checkout-form';
        iyzicoDiv.className = 'popup';
        document.body.appendChild(iyzicoDiv);

        const range = document.createRange();
        const documentFragment = range.createContextualFragment(data.checkoutFormContent);
        document.body.appendChild(documentFragment);
      } else {
        alert("Error: " + (data.errorMessage || "Payment error."));
      }
    } catch (error) {
      alert("Server connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      {step === 1 ? (
        /* ADIM 1: PLAN SEÇİMİ VE GÖRSEL TASARIM */
        <div className="w-full max-w-[480px] bg-[#0f1115] text-white rounded-[40px] p-10 relative border border-white/10 flex flex-col items-center shadow-2xl">
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#00c853] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col items-start leading-none font-black uppercase italic text-2xl tracking-tighter">
                <span>Temp Mail <span className="text-[#00c853]">Premium</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00c853]/10 rounded-full border border-[#00c853]/20 mb-8">
            <ShieldCheck className="w-4 h-4 text-[#00c853]" />
            <span className="text-[#00c853] text-[10px] font-black uppercase tracking-widest">100% Privacy Guaranteed</span>
          </div>

          {/* DÜZELTİLEN FİYAT ALANI */}
          <div className="flex items-baseline gap-2 mb-8 font-black text-7xl tracking-tighter">
            <span>${displayPrice}</span>
            <span className="text-slate-500 text-xl font-bold italic">/ month</span>
          </div>

          <div className="flex w-full gap-2 mb-10 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setBillingCycle('month')} 
              className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${billingCycle === 'month' ? 'bg-[#00c853] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              1 month
            </button>
            <div className="flex-1 relative">
                <button 
                  onClick={() => setBillingCycle('year')} 
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${billingCycle === 'year' ? 'bg-[#00c853] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  1 year
                </button>
                <span className="absolute -bottom-6 left-0 right-0 text-center text-[#00c853] text-[9px] font-black tracking-widest uppercase animate-pulse">Save 50%</span>
            </div>
          </div>

          <div className="space-y-4 w-full mb-10">
            {premiumFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-5 h-5 bg-[#00c853] rounded-full flex items-center justify-center mt-0.5 shadow-lg shadow-green-500/20"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>
                <span className="text-sm font-semibold text-slate-300">{f}</span>
              </div>
            ))}
          </div>

          <div className="w-full space-y-4">
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-5 rounded-2xl text-center focus:border-[#00c853] outline-none transition-all placeholder:text-slate-600" 
              placeholder="Enter your real email" 
            />
            <button 
              onClick={() => formData.email ? setStep(2) : alert("Please enter email")} 
              className="w-full bg-[#00c853] hover:bg-[#00e676] text-white font-black py-6 rounded-2xl uppercase tracking-[0.25em] shadow-xl shadow-green-500/20 active:scale-95 transition-all"
            >
              GO PREMIUM
            </button>
            <p className="text-[9px] text-slate-600 text-center font-black uppercase tracking-widest">Free plan includes 3 addresses with 100% privacy</p>
          </div>
        </div>
      ) : (
        /* ADIM 2: ÖDEME ÖZETİ - Dinamik Hesaplama */
        <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300 text-slate-900 font-['Sora']">
            <div className="w-full md:w-1/2 bg-[#f9fafb] p-12 border-r border-slate-100">
                <h2 className="text-slate-400 font-black text-[10px] mb-8 uppercase tracking-[0.2em]">Order Summary</h2>
                <div className="flex items-baseline gap-2 mb-2 font-black text-6xl text-slate-900 tracking-tighter">${totalChargeAmount.toFixed(2)}</div>
                <div className="flex items-center gap-5 mb-12 mt-10">
                    <div className="w-16 h-16 bg-[#00c853]/10 rounded-2xl flex items-center justify-center shrink-0"><Award className="w-8 h-8 text-[#00c853]" /></div>
                    <div><p className="font-black text-slate-900 text-2xl leading-tight">Premium Plan</p><p className="text-slate-500 text-sm font-bold uppercase tracking-widest">15 Dedicated Nodes</p></div>
                </div>
                <div className="space-y-4 border-t border-slate-200 pt-8 text-sm font-bold text-slate-600">
                    <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-900">${basePrice.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>V.A.T (20%)</span><span className="text-slate-900">${kdvAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[#00c853] pt-5 border-t border-slate-100 text-xl font-black italic"><span>Total Due</span><span>${totalChargeAmount.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="w-full md:w-1/2 p-12 bg-white relative">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] mb-12 text-slate-300">
                    <span className="text-[#00c853] border-b-2 border-[#00c853] pb-1">Information</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>Payment</span>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">First Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-bold focus:border-[#00c853] outline-none text-slate-900 transition-all" /></div>
                        <div className="space-y-2"><label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Last Name</label><input type="text" value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 text-sm font-bold focus:border-[#00c853] outline-none text-slate-900 transition-all" /></div>
                    </div>
                    <div className="space-y-2"><label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Email Address</label><input type="email" value={formData.email} readOnly className="w-full border-2 border-slate-50 rounded-xl px-4 py-4 text-sm font-bold text-slate-400 bg-slate-50 cursor-not-allowed" /></div>
                    <button 
                      onClick={handleIyzicoPayment} 
                      disabled={isLoading} 
                      className="w-full bg-[#00c853] hover:bg-[#00a344] text-white font-black py-6 rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `PAY ${totalChargeAmount.toFixed(2)} USD`}
                    </button>
                    <button onClick={() => setStep(1)} className="w-full text-slate-300 text-[10px] font-black uppercase text-center hover:text-slate-500 transition-colors">Back to features</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PremiumModal;