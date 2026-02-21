# 🚀 MephistoMail Launch Materials

This document contains pre-written copy, taglines, and comments for launching MephistoMail on various platforms like Product Hunt, Hacker News, and IndieHackers.

## 1. Product Hunt 🐱

**Name:** MephistoMail
**Tagline (60 chars max):** The RAM-only, zero-log disposable email shield.
**Link:** [mephistomail.site](https://mephistomail.site)

**Description (260 chars max):**
Protect your primary inbox from spam and trackers. MephistoMail is a privacy-first frontend for disposable emails. Sessions are stored entirely in local memory and vanish when you close the tab. Dark mode UI, instant OTP detection, zero logs.

**Maker's Comment (First comment on the launch):**
Hey hunters! 👋 I'm Crow, the solo dev behind MephistoMail. 🦅

I built MephistoMail because I was tired of temp email services that were bloated with tracking scripts, annoying ads, and poor design. I wanted something clean and truly privacy-respecting for developers and privacy advocates.

MephistoMail acts as a zero-log, RAM-only interface over robust upstream providers (mail.tm/gw). 

**Key Technical Decisions:**
- 🧠 **RAM-Only:** No data is written to disk. Once the browser closes, the session is purged.
- ⚡ **Real-Time WebSockets:** Instantly receive emails without refreshing.
- 🕶️ **No Trackers/Ads:** Pure UI focus, zero injected scripts.
- 🤖 **Instant OTP:** Automatically extracts verification codes from incoming emails.

I'd love your feedback! Roast the UI, push the limits, and let me know what features a privacy-conscious user like you would want to see next! 

---

## 2. Hacker News (Show HN) 🟧

**Title:** Show HN: MephistoMail – A RAM-only, tracker-free disposable email client

**URL:** https://mephistomail.site

**Body/Text:**
Hi HN,

I got frustrated with the current landscape of 10-minute mail services. They are often full of ads, Google Analytics trackers, and clunky interfaces—completely defeating the purpose of a "privacy" tool.

I built MephistoMail as a clean, RAM-only frontend alternative. It uses the mail.tm/mail.gw APIs under the hood for actual inbox mapping but handles everything on the client side in volatile memory. If you close the tab, the session is gone. Zero logs are kept on our end.

Tech stack: React 18, Vite, Tailwind CSS, Lucide. 

Some neat things I added:
- Instant OTP extraction from the email body (useful for quick signups).
- Simple Domain rotation.
- PWA support so you can install it for quick access.

Still refining the edges and planning to open-source the Go-based WebSocket proxy handling the upstream rate limits soon.

Would love to hear your thoughts, roasts, and suggestions!

Demo: https://mephistomail.site
Repo: https://github.com/jokallame350-lang/temp-mailmephisto

---

## 3. Indie Hackers 💡

**Title:** Tired of temp mail sites filled with ads, I built a RAM-only alternative.

**Body:**
Hey IH! Just wanted to share a weekend project that grew out of my own frustration. 

Whenever I sign up for a service to just "test it out", I use a disposable email. But almost every temp mail site out there tracks you, serves intrusive ads, or looks like it was built in 2005.

So, I built [MephistoMail](https://mephistomail.site).

It’s completely free, has zero ads, zero trackers, and runs entirely in local memory. Close the tab, and the inbox is destroyed. 

I'd appreciate any feedback on the design, onboarding, or general thoughts on privacy-first tools in today's SaaS landscape!
