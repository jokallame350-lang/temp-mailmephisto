# MephistoMail — Privacy-First Disposable Email

MephistoMail is a privacy-first, temporary email service designed to bypass trackers and maintain zero-persistence. It operates without cookies and stores data exclusively in volatile memory (RAM) and local client-side storage (localStorage).

## Key Features
- **Zero-Persistence:** Emails are stored in backend RAM and purged upon session termination.
- **100% Cookie-Free:** No tracking cookies, no consent banners.
- **Domain Rotation:** Switch between available TLDs.
- **QR Code Handoff:** Transfer your email session to mobile instantly.
- **Secure Password Generator:** Create high-entropy passwords client-side.
- **Multi-Language:** English and Turkish support.
- **PWA Ready:** Installable as a lightweight web app.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **State Management:** React Hooks (useState, useCallback, useRef)
- **Storage:** localStorage (for account persistence)
- **Styling:** Tailwind CSS + Lucide Icons
- **Email API:** mail.tm (REST API with JWT auth)
- **Deployment:** Vercel (Static)

## Project Structure
```
src/
├── main.tsx              # React entry point
├── App.tsx               # Main app component & state management
├── types.ts              # TypeScript type definitions
├── translations.ts       # EN/TR translations
├── index.css             # Global styles + Tailwind
├── components/
│   ├── Header.tsx        # Navigation bar with account switcher
│   ├── AddressBar.tsx    # Email address display & actions
│   ├── EmailList.tsx     # Inbox message list
│   ├── EmailViewer.tsx   # Email detail viewer with DOMPurify
│   ├── CustomAddressModal.tsx  # Custom email creation
│   ├── QRCodeModal.tsx   # QR code for mobile transfer
│   ├── PasswordGenModal.tsx    # Secure password generator
│   ├── LimitModal.tsx    # Account limit alerts
│   ├── LegalModal.tsx    # Privacy policy & Terms
│   ├── Footer.tsx        # Footer with legal links
│   └── SEOContent.tsx    # SEO article & FAQ section
└── services/
    └── mailService.ts    # mail.tm API integration
```

## Running Locally

```bash
git clone https://github.com/jokallame350-lang/temp-mailmephisto.git
cd temp-mailmephisto
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.
