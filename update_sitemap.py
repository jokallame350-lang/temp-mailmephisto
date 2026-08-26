with open("public/sitemap.xml", "r", encoding="utf-8") as f:
    sitemap = f.read()

new_urls = """
  <!-- New Interactive Privacy & Developer Tools -->
  <url>
    <loc>https://mephistomail.site/breach-checker</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/test-card-generator</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/password-generator</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- New High-Intent AI & SaaS Programmatic Pages -->
  <url>
    <loc>https://mephistomail.site/temp-mail-for-cursor-ai</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-v0-dev</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-bolt-new</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-tradingview</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-coursera</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-github-copilot</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-perplexity-ai</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-elevenlabs</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-notion-ai</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mephistomail.site/temp-mail-for-figma</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "temp-mail-for-cursor-ai" not in sitemap:
    sitemap = sitemap.replace("</urlset>", new_urls + "</urlset>")
    with open("public/sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap)
    print("Updated public/sitemap.xml with all new tool and AI routes!")
else:
    print("Sitemap already updated.")
