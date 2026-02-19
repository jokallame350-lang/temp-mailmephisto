import React, { useState } from 'react';
import { Language } from '../translations';

interface AdBannerProps {
    slot: 'sidebar' | 'footer' | 'inline' | 'header';
    lang: Language;
}

/**
 * Ad Banner Component — Google AdSense / Carbon Ads Ready
 * 
 * In production, replace the placeholder with actual ad code.
 * Supports multiple ad slots: sidebar, footer, inline, header.
 * 
 * To activate Google AdSense:
 * 1. Add <script> tag to index.html with your AdSense publisher ID
 * 2. Replace data-ad-client and data-ad-slot with your values
 * 3. Remove the placeholder content
 */
const AdBanner: React.FC<AdBannerProps> = ({ slot, lang }) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const sizes: Record<string, { w: string; h: string; label: string }> = {
        header: { w: 'w-full', h: 'h-[90px]', label: '728×90 Leaderboard' },
        sidebar: { w: 'w-full', h: 'h-[250px]', label: '300×250 Rectangle' },
        footer: { w: 'w-full', h: 'h-[90px]', label: '728×90 Leaderboard' },
        inline: { w: 'w-full', h: 'h-[100px]', label: '468×60 Banner' },
    };

    const size = sizes[slot] || sizes.inline;

    return (
        <div
            className={`relative ${size.w} ${size.h} bg-white/[0.015] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600 overflow-hidden group transition-all hover:border-white/10`}
            data-ad-slot={`mephisto-${slot}`}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            id={`ad-${slot}`}
        >
            {/* Placeholder — Replace with actual ad code in production */}
            <div className="flex flex-col items-center gap-1.5 opacity-40">
                <span className="text-[9px] font-mono uppercase tracking-widest">{size.label}</span>
                <span className="text-[8px]">
                    {lang === 'tr' ? 'Reklam Alanı' : 'Ad Space'}
                </span>
            </div>

            {/* 
        Google AdSense Integration Example:
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      */}

            {/* 
        Carbon Ads Integration Example:
        <script 
          async 
          type="text/javascript" 
          src="//cdn.carbonads.com/carbon.js?serve=XXXXXXXX&placement=mephistomailcom" 
          id="_carbonads_js"
        />
      */}
        </div>
    );
};

export default AdBanner;
