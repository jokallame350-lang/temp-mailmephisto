// src/components/SEOContent.tsx

import React, { useState } from 'react';
import { Shield, Zap, Globe, Lock, ChevronDown, ChevronUp, Cpu, Network, Key, ScanLine } from 'lucide-react';

export const SEOContent = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Can I use the generated password for my real accounts?",
      answer: "Yes. Our Password Generator uses client-side entropy to create cryptographically strong strings. It generates the password locally in your browser, meaning we never see or store it. It is safe for high-security banking or social media accounts."
    },
    {
      question: "How does the QR Code handoff work?",
      answer: "The QR feature generates a visual link to your current active inbox. By scanning it, you securely transfer your session from desktop to mobile without typing complex random addresses. The link expires when the session ends."
    },
    {
      question: "Is Mephisto compatible with 2FA services?",
      answer: "Absolutely. Our low-latency architecture ensures that One-Time Passwords (OTP) and verification codes arrive instantly, making it ideal for bypassing registration walls that require immediate confirmation."
    },
    {
      question: "What happens to my data when I close the tab?",
      answer: "Immediate termination. Mephisto runs on a 'No-Logs' policy backed by volatile memory storage. Closing the tab triggers a wipe sequence, removing the email address and all its contents from our RAM."
    }
  ];

  return (
    <section className="mt-16 border-t border-white/5 pt-12 pb-24 px-4 bg-[#050505]">
      <div className="max-w-4xl mx-auto">

        {/* --- 1. GÖRSEL ÖZELLİK IZGARASI --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 border-b border-white/5 pb-10">
          <FeatureItem 
            icon={<Cpu className="w-5 h-5 text-red-500" />}
            title="Volatile Memory"
            desc="RAM-only storage. No HDD traces."
          />
          <FeatureItem 
            icon={<Network className="w-5 h-5 text-orange-500" />}
            title="Low Latency"
            desc="Instant packet delivery via Websockets."
          />
          <FeatureItem 
            icon={<Key className="w-5 h-5 text-red-400" />}
            title="Entropy Gen"
            desc="Client-side secure password creation."
          />
          <FeatureItem 
            icon={<ScanLine className="w-5 h-5 text-orange-400" />}
            title="Secure Handoff"
            desc="Encrypted QR session transfer."
          />
        </div>

        {/* --- 2. PROFESYONEL SEO MAKALESİ --- */}
        {/* Gövde: text-[14px], Başlıklar: text-[17px] */}
        <article className="prose prose-invert prose-slate max-w-none space-y-16">
          
          {/* GİRİŞ */}
          <div>
            <h2 className="text-[17px] font-bold text-white mb-4 uppercase tracking-widest border-l-2 border-red-500 pl-4">
              The Tech Behind <span className="text-red-500">Disposable Addresses</span>
            </h2>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-4">
              In the modern web ecosystem, your email address acts as the primary unique identifier used by trackers, advertisers, and data brokers to construct a permanent record of your digital behavior. This metadata aggregation creates a "shadow profile" that follows you across the internet, linking your purchases, location, and browsing habits. 
            </p>
            <p className="text-slate-400 text-[14px] leading-relaxed">
              <strong>Mephisto</strong> is not merely a <em>fake email generator</em>; it is a privacy-first infrastructure designed to decouple your digital identity from online services. By utilizing ephemeral SMTP servers, we route communication through secure tunnels without ever writing data to a physical hard drive. Our system strips away identifying headers from incoming packets, ensuring that the sender cannot trace the origin back to your real IP address or device fingerprint. This architectural approach guarantees that your interaction with the web remains strictly compartmentalized, preventing cross-site correlation attacks.
            </p>
          </div>

          {/* BÖLÜM 1: What is? */}
          <div>
            <h3 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider">
              So, What Is A Disposable Email Address?
            </h3>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-4">
              Think of a disposable email address (DEA) as a digital "burner phone" for the internet age. It is a fully functional, standards-compliant email inbox that exists only for a specific session or defined time frame, usually ranging from 10 minutes to a few hours. Often referred to as <em>10-minute mail</em>, <em>throwaway email</em>, or <em>tempmail</em>, these addresses accept incoming messages just like Gmail or Outlook but lack the permanence that leads to spam accumulation.
            </p>
            <p className="text-slate-400 text-[14px] leading-relaxed">
              Unlike traditional providers that require phone verification and profile users for ad targeting, a disposable system is anonymous by design. It creates a firewall between your personal life and the services you sign up for. Technically, these addresses operate on high-speed mail transfer agents (MTA) that process inbound traffic in real-time, displaying the content via WebSockets without storing it in a persistent database. This ensures that once the "Time-to-Live" (TTL) expires, the inbox and all its contents are cryptographically erased from existence, leaving no forensic trail for anyone to investigate.
            </p>
          </div>
             
          {/* BÖLÜM 2: Why Need? */}
          <div>
            <h3 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider">
                Why Would You Need a Fake Address?
            </h3>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">
              The internet is fraught with security risks, from massive database leaks to sophisticated phishing campaigns targeting your primary credentials. Using a <em>fake email</em> is no longer just about avoiding spam; it is a critical component of operational security (OpSec). When you use your real email for every service, you create a single point of failure; if one service is breached, your identity across the entire web is compromised.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-red-500/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <strong className="text-white text-[14px] uppercase font-bold">Data Breach Insulation</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">If a service you registered with gets hacked, only your disposable address is compromised. Mephisto addresses cannot be traced back to you.</span>
                </li>
                <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-orange-500/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <strong className="text-white text-[14px] uppercase font-bold">Dev & QA Testing</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">Developers use <em>fake mail</em> to test sign-up flows and email triggers without polluting their company domain with test data.</span>
                </li>
                <li className="bg-[#0a0a0c] p-5 rounded-xl border border-white/5 hover:border-red-400/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    <strong className="text-white text-[14px] uppercase font-bold">Avoiding Marketing Lists</strong>
                  </div>
                  <span className="text-slate-500 text-[14px] leading-relaxed">Download whitepapers or unlock content without subscribing to lifetime newsletters. Keep your primary inbox clean.</span>
                </li>
            </ul>
          </div>

          {/* BÖLÜM 3: Privacy Toolkit */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-900/10 to-transparent p-8">
             <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             
             <h3 className="text-[17px] font-bold text-white mb-6 relative z-10 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Mephisto Privacy Toolkit
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div>
                   <h4 className="text-[15px] text-white font-bold flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-orange-500" />
                      Secure Password Generator
                   </h4>
                   <p className="text-slate-400 text-[14px] leading-relaxed">
                      Mephisto integrates a client-side <strong>Password Generator</strong> that creates high-entropy credentials using cryptographic random number generators. This ensures that the dummy account you create is mathematically resistant to brute-force attacks.
                   </p>
                </div>

                <div>
                   <h4 className="text-[15px] text-white font-bold flex items-center gap-2 mb-2">
                      <ScanLine className="w-4 h-4 text-red-500" />
                      Mobile QR Handoff
                   </h4>
                   <p className="text-slate-400 text-[14px] leading-relaxed">
                      With our <strong>QR Code integration</strong>, you can instantly transfer your active <em>burner mail</em> session to your smartphone. This creates an "Air-Gapped" transfer method where you don't need to type complex random addresses manually.
                   </p>
                </div>
             </div>
          </div>

          {/* BÖLÜM 4: How to Choose */}
          <div>
             <h3 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider">
                How to Choose a Disposable Email?
             </h3>
             <p className="text-slate-400 text-[14px] leading-relaxed mb-4">
                Not all <em>temp mail</em> services are created equal; in fact, some are dangerous "honeypots" designed to harvest data. When selecting a provider, you must prioritize <strong>Zero-Log Policies</strong> and transparent infrastructure. Many free services monetize by selling user metadata, tracking pixels, or even reading the contents of your emails for keyword targeting.
             </p>
             <p className="text-slate-400 text-[14px] leading-relaxed">
                Mephisto is architected to be "state-less," meaning we physically cannot sell your data because we don't store it. You should also look for HTTPS encryption, valid TLS certificates, and reputable domain extensions that aren't blacklisted by major services. Avoid services that force you to register or download executables.
             </p>
          </div>

          {/* BÖLÜM 5: How to Use */}
          <div>
             <h3 className="text-[17px] font-bold text-white mb-4 uppercase tracking-wider">
                How to Use Disposable Addresses?
             </h3>
             <p className="text-slate-400 text-[14px] leading-relaxed mb-4">
                Using Mephisto is designed to be a seamless, low-friction experience. Upon landing on our platform, a unique address is auto-generated for you immediately using our algorithm. Simply click the "Copy" icon in the address bar. Paste this into the registration field of the third-party site.
             </p>
             <p className="text-slate-400 text-[14px] leading-relaxed">
                Within seconds, the confirmation email will appear in your Mephisto inbox, pushed directly via WebSockets without the need to refresh the page. Click the email to view the verification code or link. For maximum security, use the <strong>Privacy Tools</strong> menu to generate a secure password for that registration, completing the anonymity loop.
             </p>
          </div>

          {/* SONUÇ */}
          <div className="bg-[#0f0f11] p-8 rounded-2xl border border-white/5 text-center">
             <h3 className="text-[17px] font-bold text-white mb-2 uppercase tracking-wider">
                Total Digital Hygiene
             </h3>
             <p className="text-slate-400 text-[14px] leading-relaxed max-w-2xl mx-auto">
                In an age of constant surveillance and algorithmic profiling, Mephisto provides the essential tools necessary to reclaim your digital anonymity. By combining a volatile <em>anonymous inbox</em> with robust security tools, we offer a comprehensive shield against spam, tracking, and data profiling.
             </p>
          </div>

        </article>

        {/* --- 3. SIKÇA SORULAN SORULAR (Accordion) --- */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-white/10"></div>
            <h3 className="text-[17px] font-bold text-white uppercase tracking-wider">
              System FAQ
            </h3>
            <div className="h-px w-10 bg-white/10"></div>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-red-500/20"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left text-[17px] font-bold text-slate-300 hover:text-white transition-colors"
                >
                  {faq.question}
                  {openFaq === index ? <ChevronUp className="w-4 h-4 text-red-500 shrink-0 ml-4" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-4" />}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-4 pt-0 text-[14px] text-slate-500 leading-relaxed border-t border-white/5 mt-1">
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

// Özellik Kartı Bileşeni - Güncellenmiş (17px/14px)
const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5 hover:border-red-500/30 transition-all duration-300 group text-center md:text-left">
    <div className="mb-3 p-2 bg-white/5 rounded-lg w-fit mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-300 group-hover:bg-red-500/10">
      {icon}
    </div>
    <h3 className="text-[17px] font-bold text-white mb-2">{title}</h3>
    <p className="text-[14px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{desc}</p>
  </div>
);