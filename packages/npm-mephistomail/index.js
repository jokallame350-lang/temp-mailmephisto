/**
 * MephistoMail Node.js & TypeScript SDK
 * https://mephistomail.site
 */

const API_BASE = 'https://mephistomail.site/api/v1';

class MephistoMail {
  constructor(options = {}) {
    this.apiBase = options.apiBase || API_BASE;
  }

  /**
   * Create an instant disposable temporary email inbox
   */
  async createInbox(customUsername = null) {
    const randomName = customUsername || 'test_' + Math.random().toString(36).substring(2, 9);
    const domain = 'sharklasers.com';
    const address = `${randomName}@${domain}`;
    return {
      id: randomName,
      address: address,
      domain: domain,
      createdAt: Date.now(),
      getMessages: () => this.getMessages(address),
      waitForOTP: (timeoutMs = 30000) => this.waitForOTP(address, timeoutMs),
    };
  }

  /**
   * Fetch messages for a temporary address
   */
  async getMessages(address) {
    try {
      const res = await fetch(`${this.apiBase}/inbox?address=${encodeURIComponent(address)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Automatically wait for and extract verification code (OTP / Magic Link)
   */
  async waitForOTP(address, timeoutMs = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const messages = await this.getMessages(address);
      if (messages && messages.length > 0) {
        const latest = messages[0];
        const match = (latest.subject + ' ' + (latest.body || '')).match(/\b\d{4,8}\b/);
        if (match) {
          return match[0];
        }
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error(`Timeout waiting for OTP on ${address}`);
  }
}

module.exports = MephistoMail;
module.exports.MephistoMail = MephistoMail;
module.exports.default = MephistoMail;
