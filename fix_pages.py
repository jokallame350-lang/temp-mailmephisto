import re

files = [
    "src/pages/PrivacyPolicyPage.tsx",
    "src/pages/TermsOfServicePage.tsx",
    "src/pages/CookiePolicyPage.tsx",
    "src/pages/AboutPage.tsx"
]

header_import_regex = re.compile(r"import Header from '\.\./components/Header';\n?")
header_tag_regex = re.compile(r"<Header[\s\S]*?/>\n?")

top_bar = """      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <span>MephistoMail</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              {lang === 'tr' ? 'Geçici Mail Oluştur' : 'Generate Temp Mail'}
            </Link>
            <Link to="/tools" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              {lang === 'tr' ? 'Araçlar' : 'Tools'}
            </Link>
            <Link to="/blog" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
              Blog
            </Link>
          </div>
        </div>
      </header>
"""

for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        code = f.read()
    code = header_import_regex.sub("", code)
    code = header_tag_regex.sub(top_bar, code)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Fixed {fpath}")

