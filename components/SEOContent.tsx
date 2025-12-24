import React, { useState } from 'react';
import { Shield, Zap, Lock, ChevronDown, ChevronUp, Cpu, Network, Key, ScanLine } from 'lucide-react';
import { translations, Language } from '../translations';

interface SEOContentProps {
  lang: Language;
}

export const SEOContent: React.FC<SEOContentProps> = ({ lang }) => {
  const t = translations[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { question: t.faq1Q, answer: t.faq1A },
    { question: t.faq2Q, answer: t.faq2A },
    { question: t.faq3Q, answer: t.faq3A },
    { question: t.faq4Q, answer: t.faq4A }
  ];

  return (
    <section className="mt-16 border-t border-gray-200 dark:border-white/5 pt-12 pb-24 px-4 bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* --- 1. GÖRSEL ÖZELLİK IZGARASI --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 border-b border-gray-200 dark:border-white/5 pb-10">
          <FeatureItem 
            icon={<Cpu className="w-5 h-5 text-red-500" />}
            title={t.featVolatileTitle}
            desc={t.featVolatileDesc}
          />
          <FeatureItem 
            icon={<Network className="w-5 h-5 text-orange-500" />}
            title={t.featLatencyTitle}
            desc={t.featLatencyDesc}
          />
          <FeatureItem 
            icon={<Key className="w-5 h-5 text-red-400" />}
            title={t.featEntropyTitle}
            desc={t.featEntropyDesc}
          />
          <FeatureItem 
            icon={<ScanLine className="w-5 h-5 text-orange-400" />}
            title={t.featHandoffTitle}
            desc={t.featHandoffDesc}
          />
        </div>

        {/* --- 2. PROFESYONEL SEO MAKALESİ --- */}
        <article className="prose prose-slate dark:prose-invert max-w-none space-y-16">
          
          {/* GİRİŞ */}
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest border-l-2 border-red-500 pl-4 font-['Sora']">
              {t.artMainTitle} <span className="text-red-500">{t.artMainTitleHighlight}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed mb-4">
              {t.artIntro1}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
              {t.artIntro2}
            </p>
          </div>

          {/* BÖLÜM 1: What is? */}
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider font-['Sora']">
              {t.artWhatTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed mb-4">
              {t.artWhatP1}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
              {t.artWhatP2}
            </p>
          </div>
              
          {/* BÖLÜM 2: Why Need? */}
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider font-['Sora']">
                {t.artWhyTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed mb-6">
               {t.artWhyIntro}
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 list-none pl-0">
                <li className="bg-white dark:bg-[#0a0a0c] p-5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-red-500/20 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <strong className="text-slate-900 dark:text-white text-[14px] uppercase font-bold">{t.artWhyList1Title}</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList1Desc}</span>
                </li>
                <li className="bg-white dark:bg-[#0a0a0c] p-5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-orange-500/20 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <strong className="text-slate-900 dark:text-white text-[14px] uppercase font-bold">{t.artWhyList2Title}</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList2Desc}</span>
                </li>
                <li className="bg-white dark:bg-[#0a0a0c] p-5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-red-400/20 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    <strong className="text-slate-900 dark:text-white text-[14px] uppercase font-bold">{t.artWhyList3Title}</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">{t.artWhyList3Desc}</span>
                </li>
            </ul>
          </div>

          {/* BÖLÜM 3: Privacy Toolkit */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent p-8">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-6 relative z-10 uppercase tracking-wider flex items-center gap-2 font-['Sora']">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {t.artToolTitle}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div>
                    <h4 className="text-[15px] text-slate-900 dark:text-white font-bold flex items-center gap-2 mb-2 font-['Sora']">
                      <Key className="w-4 h-4 text-orange-500" />
                      {t.artTool1Title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
                      {t.artTool1Desc}
                    </p>
                </div>

                <div>
                    <h4 className="text-[15px] text-slate-900 dark:text-white font-bold flex items-center gap-2 mb-2 font-['Sora']">
                      <ScanLine className="w-4 h-4 text-red-500" />
                      {t.artTool2Title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
                      {t.artTool2Desc}
                    </p>
                </div>
              </div>
          </div>

          {/* BÖLÜM 4: How to Choose */}
          <div>
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider font-['Sora']">
                 {t.artChooseTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed mb-4">
                 {t.artChooseP1}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
                 {t.artChooseP2}
              </p>
          </div>

          {/* BÖLÜM 5: How to Use */}
          <div>
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider font-['Sora']">
                 {t.artUseTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed mb-4">
                 {t.artUseP1}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed">
                 {t.artUseP2}
              </p>
          </div>

          {/* SONUÇ */}
          <div className="bg-white dark:bg-[#0f0f11] p-8 rounded-2xl border border-gray-200 dark:border-white/5 text-center shadow-sm dark:shadow-none">
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider font-['Sora']">
                 {t.artConclusionTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed max-w-2xl mx-auto">
                 {t.artConclusionDesc}
              </p>
          </div>

        </article>

        {/* --- 3. SIKÇA SORULAN SORULAR (Accordion) --- */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-gray-300 dark:bg-white/10"></div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white uppercase tracking-wider font-['Sora']">
              {t.faqTitle}
            </h3>
            <div className="h-px w-10 bg-gray-300 dark:bg-white/10"></div>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-red-500/20 shadow-sm dark:shadow-none"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left text-[17px] font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors font-['Sora']"
                >
                  {faq.question}
                  {openFaq === index ? <ChevronUp className="w-4 h-4 text-red-500 shrink-0 ml-4" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-4" />}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-4 pt-0 text-[14px] text-slate-600 dark:text-slate-500 leading-relaxed border-t border-gray-100 dark:border-white/5 mt-1">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

// Özellik Kartı Bileşeni
const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/5 hover:border-red-500/30 transition-all duration-300 group text-center md:text-left shadow-sm dark:shadow-none">
    <div className="mb-3 p-2 bg-slate-100 dark:bg-white/5 rounded-lg w-fit mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-300 group-hover:bg-red-500/10">
      {icon}
    </div>
    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-2 font-['Sora']">{title}</h3>
    <p className="text-[14px] text-slate-500 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">{desc}</p>
  </div>
);