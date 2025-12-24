import React, { useState } from 'react';
import { Shield, Zap, Lock, Mail, Globe, UserX, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const SEOContent = () => {
  // Hangi bölümün açık olduğunu tutan state
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 px-4 pb-16">
      
      {/* Features Grid (Bu kısım her zaman açık kalsın, önemli) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <FeatureCard 
          icon={<Shield className="w-6 h-6 text-orange-500" />}
          title="Spam Protection"
          desc="Keep your real email clean and safe."
        />
        <FeatureCard 
          icon={<UserX className="w-6 h-6 text-red-500" />}
          title="100% Anonymous"
          desc="No registration, no logs kept."
        />
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-yellow-500" />}
          title="Instant Access"
          desc="Ready to use immediately."
        />
      </div>

      {/* Accordion Sections (Açılır/Kapanır Bölümler) */}
      <div className="space-y-4">
        
        <AccordionItem 
          title="What is a Disposable Email?"
          icon={<Mail className="w-5 h-5 text-red-500" />}
          isOpen={openSection === "what-is"}
          onClick={() => toggleSection("what-is")}
        >
          <p>
            A <strong>disposable email</strong> (or temp mail) is a temporary mailbox that self-destructs after a period. Mephisto Temp Mail provides an instant, anonymous address without registration.
          </p>
        </AccordionItem>

        <AccordionItem 
          title="Why Use It?"
          icon={<Lock className="w-5 h-5 text-orange-500" />}
          isOpen={openSection === "why-use"}
          onClick={() => toggleSection("why-use")}
        >
          <ul className="space-y-2 list-disc list-inside marker:text-red-500">
            <li><strong>Privacy:</strong> Stop sites from tracking you.</li>
            <li><strong>Security:</strong> Protect your main email from breaches.</li>
            <li><strong>No Spam:</strong> Keep marketing emails out of your inbox.</li>
          </ul>
        </AccordionItem>

        <AccordionItem 
          title="FAQ & Details"
          icon={<Globe className="w-5 h-5 text-blue-500" />}
          isOpen={openSection === "faq"}
          onClick={() => toggleSection("faq")}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-200 mb-1">Is it free?</h4>
              <p>Yes, completely <strong>free to use</strong>.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> 
                Duration?
              </h4>
              <p>Emails last until you close the browser or session ends (approx. 1-24h).</p>
            </div>
          </div>
        </AccordionItem>

      </div>
    </div>
  );
};

// Yardımcı Bileşenler

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 flex items-start gap-3">
    <div className="mt-1">{icon}</div>
    <div>
      <h3 className="font-bold text-slate-200">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  </div>
);

const AccordionItem = ({ title, icon, children, isOpen, onClick }: any) => (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <button 
            onClick={onClick}
            className="w-full p-4 flex items-center justify-between bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {isOpen && (
            <div className="p-5 text-slate-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                {children}
            </div>
        )}
    </div>
);
