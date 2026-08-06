# mephistomail

> Official Node.js & TypeScript SDK for [MephistoMail](https://mephistomail.site) — Instant Disposable Temp Mail & AI OTP Extraction API for QA Testing & Playwright / Cypress E2E Automation.

[![NPM Version](https://img.shields.io/npm/v/mephistomail.svg)](https://www.npmjs.com/package/mephistomail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-mephistomail.site-orange)](https://mephistomail.site)

## 📦 Installation

```bash
npm install mephistomail
```

## 🚀 Quickstart

```javascript
const MephistoMail = require('mephistomail');

async function run() {
  const mephisto = new MephistoMail();
  
  // 1. Create a 1-click temp inbox
  const inbox = await mephisto.createInbox();
  console.log(`Temp Address: ${inbox.address}`);
  
  // 2. Automatically wait for 6-digit OTP code
  const otpCode = await inbox.waitForOTP();
  console.log(`Extracted OTP Code: ${otpCode}`);
}

run();
```

## 🧪 Playwright E2E Integration

```typescript
import { test, expect } from '@playwright/test';
import MephistoMail from 'mephistomail';

test('User Signup & 2FA Flow', async ({ page }) => {
  const mephisto = new MephistoMail();
  const inbox = await mephisto.createInbox();

  await page.goto('https://your-app.com/signup');
  await page.fill('input[name="email"]', inbox.address);
  await page.click('button#submit');

  // Automatically wait for OTP code from MephistoMail API
  const otpCode = await inbox.waitForOTP();
  await page.fill('input[name="otp"]', otpCode);
  await page.click('button#verify');

  await expect(page).toHaveURL('https://your-app.com/dashboard');
});
```

## 🔗 Official Links
- **Web App:** [https://mephistomail.site](https://mephistomail.site)
- **GitHub Repository:** [https://github.com/jokallame350-lang/temp-mailmephisto](https://github.com/jokallame350-lang/temp-mailmephisto)
- **Support:** [jokallame0@gmail.com](mailto:jokallame0@gmail.com)
