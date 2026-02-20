# 🛡️ MephistoMail — The Privacy-First Disposable Email Shield

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

> **"Identity is fluid. Privacy is absolute."**

MephistoMail is a cutting-edge, **RAM-only** disposable email service built for speed, anonymity, and zero-persistence. Designed to bypass trackers and protect your primary inbox from spam, it operates entirely in volatile memory, ensuring no logs are ever written to disk.

🌐 **Live Demo:** [mephistomail.site](https://mephistomail.site)

## 📸 Interface Gallery

### 1. The Dashboard — Zero Distractions
<p align="center">
  <img src="public/screenshots/dashboard_dark.png" alt="MephistoMail Dashboard - Dark Mode Priority Mail" width="100%" style="border-radius: 10px;">
</p>

### 2. Feature Walkthrough
<p align="center">
  <img src="public/screenshots/custom_aliasing.png" alt="Custom Alias Creation" width="32%" style="border-radius: 8px;">
  <img src="public/screenshots/mobile_inbox.png" alt="Real-time Inbox Monitor" width="32%" style="border-radius: 8px;">
  <img src="public/screenshots/verification_view.png" alt="Smart Verification & Code Detection" width="32%" style="border-radius: 8px;">
</p>
<p align="center">
  <em>From left to right: Create custom domain aliases, manage active sessions, and view rich HTML emails with instant 2FA code detection.</em>
</p>

## ✨ Key Features

- 🚀 **Instant Delivery:** Real-time WebSocket connection for sub-second email reception.
- 🧠 **RAM-Only Architecture:** Emails are stored in volatile memory and purged instantly upon session termination. **Zero logs.**
- 📱 **PWA Support:** Installable as a native-like app on iOS and Android. Works offline.
- 🔄 **Smart Domain Rotation:** Automatically cycles through available domains to bypass blocklists.
- 📲 **QR Code Handoff:** Instantly transfer your active session to mobile via QR code.
- 🔐 **Client-Side Encryption:** Passwords and keys are generated locally in your browser.
- 🌑 **Dark Mode UI:** Sleek, modern interface designed for focus and readability.
- 🌍 **Multi-Language:** Built-in support for English, Turkish, Spanish, German, and French.

## 🛠️ Tech Stack

Built with modern web technologies for performance and maintainability:

- **Frontend:** [React 18](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **State Management:** React Hooks
- **Email API:** [mail.tm](https://mail.tm/) / [mail.gw](https://mail.gw/)

## 🚀 Getting Started

Follow these steps to run MephistoMail locally on your machine.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jokallame350-lang/temp-mailmephisto.git
    cd temp-mailmephisto
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to Vercel, Netlify, or any static host.

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or bug fixes:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Crow | Indie Developer**

- 𝕏 (Twitter): [@benmxrt](https://x.com/benmxrt)
- 🌐 Website: [mephistomail.site](https://mephistomail.site)

---

*Enjoying MephistoMail? Give it a ⭐️ star on GitHub!*

