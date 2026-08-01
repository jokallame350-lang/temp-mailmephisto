/**
 * MephistoMail Cloudflare Email Worker Engine (Yol A)
 * 
 * Instructions:
 * 1. Go to Cloudflare Dashboard -> Email -> Email Routing.
 * 2. Enable Email Routing for mephistomail.site.
 * 3. Create a Worker in Workers & Pages -> Create Worker.
 * 4. Paste this code into index.js.
 * 5. Bind a KV Namespace named "MEPHISTO_KV" to your Worker.
 * 6. Set Catch-All Rule in Email Routing to Send to this Worker!
 */

export default {
  // 1. Incoming Email Handler (Triggered automatically by Cloudflare Email Routing)
  async email(message, env, ctx) {
    try {
      const recipient = message.to.toLowerCase();
      const sender = message.from;
      const subject = message.headers.get('subject') || '(No Subject)';
      const date = new Date().toISOString();

      // Read raw email body text
      const rawText = await new Response(message.raw).text();

      // Simple parser for plain text / basic HTML snippet
      let bodyText = rawText;
      let bodyHtml = '';

      if (rawText.includes('Content-Type: text/html')) {
        const parts = rawText.split('Content-Type: text/html');
        if (parts[1]) {
          bodyHtml = parts[1].split('------')[0] || parts[1].slice(0, 5000);
        }
      }

      // Clean snippet for preview
      const intro = bodyText.replace(/<[^>]*>/g, '').slice(0, 150).trim();

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const emailObj = {
        id: messageId,
        from: sender,
        to: recipient,
        subject: subject,
        intro: intro,
        text: bodyText,
        html: bodyHtml || `<pre>${bodyText}</pre>`,
        createdAt: date,
      };

      // Store in KV with 1-hour automatic expiration (RAM-only TTL)
      const addressKey = `inbox:${recipient}`;
      const existingJson = await env.MEPHISTO_KV.get(addressKey);
      let messagesList = existingJson ? JSON.parse(existingJson) : [];
      
      messagesList.unshift(emailObj);
      // Keep last 50 emails per inbox
      if (messagesList.length > 50) messagesList = messagesList.slice(0, 50);

      // Save to KV with 3600 seconds TTL (Auto-Expiry after 1 hour)
      await env.MEPHISTO_KV.put(addressKey, JSON.stringify(messagesList), { expirationTtl: 3600 });
      console.log(`[Mephisto Engine] Stored mail for ${recipient} (ID: ${messageId})`);
    } catch (err) {
      console.error('[Mephisto Engine] Error processing email:', err);
    }
  },

  // 2. HTTP REST API Handler for Frontend UI Integration
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/domains
    if (url.pathname === '/api/domains') {
      return new Response(
        JSON.stringify({ domains: ['mephistomail.site', 'anon.mephistomail.site'] }),
        { headers: corsHeaders }
      );
    }

    // GET /api/messages?address=xyz@mephistomail.site
    if (url.pathname === '/api/messages') {
      const address = url.searchParams.get('address')?.toLowerCase();
      if (!address) {
        return new Response(JSON.stringify({ error: 'Missing address parameter' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const addressKey = `inbox:${address}`;
      const existingJson = await env.MEPHISTO_KV.get(addressKey);
      const messages = existingJson ? JSON.parse(existingJson) : [];

      return new Response(JSON.stringify({ messages }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ service: 'MephistoMail Cloudflare Engine v1.0', status: 'online' }), {
      headers: corsHeaders,
    });
  },
};
