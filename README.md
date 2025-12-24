# Mephisto: Ephemeral, 100% Cookie-Free Disposable Email

Mephisto is a privacy-first, temporary email service designed to bypass trackers and maintain zero-persistence. Unlike traditional services, Mephisto operates without cookies and stores data exclusively in volatile memory (RAM) and local client-side storage (IndexedDB).

## Key Features
- **Zero-Persistence:** Emails are stored in backend RAM and purged instantly upon session termination.
- **Client-Side Caching:** Uses IndexedDB to keep your session snappy without server-side logging.
- **100% Cookie-Free:** No tracking cookies, no consent banners, no bullshit.
- **Domain Rotation:** Manually switch between 8+ different TLDs to bypass site-specific filters.
- **PWA Ready:** Fully installable as a lightweight web app on iOS and Android.

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **State Management:** React Hooks + Context API
- **Storage:** IndexedDB (for local caching)
- **Styling:** Tailwind CSS + Lucide Icons
- **Backend:** Node.js (High-performance WebSocket/RAM architecture)

## Running Locally

1. Clone the repo:
   ```bash
   git clone [https://github.com/jokallame350-lang/temp-mailmephisto.git](https://github.com/jokallame350-lang/temp-mailmephisto.git)

