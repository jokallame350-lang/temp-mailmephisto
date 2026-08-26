with open("src/main.tsx", "r", encoding="utf-8") as f:
    code = f.read()

new_imports = """const BreachCheckerPage = lazy(() => import('./pages/BreachCheckerPage'));
const TestCardGeneratorPage = lazy(() => import('./pages/TestCardGeneratorPage'));
const PasswordGeneratorPage = lazy(() => import('./pages/PasswordGeneratorPage'));
"""

if "BreachCheckerPage" not in code:
    code = code.replace("const AboutPage = lazy(() => import('./pages/AboutPage'));", "const AboutPage = lazy(() => import('./pages/AboutPage'));\n" + new_imports, 1)

new_routes = """          {/* New Interactive Tools */}
          <Route path="/breach-checker" element={<BreachCheckerPage lang={lang} />} />
          <Route path="/leaked-email-checker" element={<BreachCheckerPage lang={lang} />} />
          <Route path="/test-card-generator" element={<TestCardGeneratorPage lang={lang} />} />
          <Route path="/dummy-card-generator" element={<TestCardGeneratorPage lang={lang} />} />
          <Route path="/cc-generator" element={<TestCardGeneratorPage lang={lang} />} />
          <Route path="/password-generator" element={<PasswordGeneratorPage lang={lang} />} />
          <Route path="/strong-password-generator" element={<PasswordGeneratorPage lang={lang} />} />

          {/* New AI & SaaS Programmatic Pages */}
          <Route path="/temp-mail-for-cursor-ai" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-v0-dev" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-bolt-new" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-tradingview" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-coursera" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-github-copilot" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-perplexity-ai" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-elevenlabs" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-notion-ai" element={<ServiceMailPage lang={lang} />} />
          <Route path="/temp-mail-for-figma" element={<ServiceMailPage lang={lang} />} />
"""

if "/breach-checker" not in code:
    code = code.replace('<Route path="/burn-note" element={<BurnNotePage lang={lang} />} />', '<Route path="/burn-note" element={<BurnNotePage lang={lang} />} />\n' + new_routes, 1)

with open("src/main.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated main.tsx with all new tools and routes!")
