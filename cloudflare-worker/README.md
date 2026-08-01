# 🚀 MephistoMail - Cloudflare Email Worker Engine (Yol A Altyapısı)

Bu dizin, başkasının (GuerrillaMail) sunucularına muhtaç kalmadan **tamamen kendi domaininiz (`mephistomail.site`)** üzerinden sınırsız ve anonim geçici e-posta üretip almanız için tasarlanmış **Cloudflare Worker Engine** kodlarını içerir.

---

## 📋 3 Adımda Kolay Kurulum (Cloudflare Setup Guide)

### 1️⃣ Cloudflare Email Routing Aktifleştirme
1. [Cloudflare Dashboard](https://dash.cloudflare.com)'a giriş yapın ve `mephistomail.site` domaininizi seçin.
2. Sol menüden **Email -> Email Routing** bölümüne gidin ve **"Enable Email Routing"** butonuna basın.
3. DNS kayıtları otomatik eklenecektir (MX ve TXT kayıtlarını onaylayın).

### 2️⃣ Worker Scriptini Oluşturma & KV Bağlama
1. Sol menüden **Workers & Pages -> Create Worker** butonuna basın.
2. Worker adını `mephistomail-engine` olarak belirleyin ve **Deploy** deyin.
3. **Edit Code** butonuna basarak `cloudflare-worker/email-worker.js` dosyasındaki tüm kodları kopyalayıp buradaki editöre yapıştırın ve **Save and Deploy** yapın.
4. **KV Namespace Oluşturma:**
   - Worker detaylarındaki **Settings -> Variables -> KV Namespace Bindings** alanına gidin.
   - **Add binding** butonuna basın.
   - Variable Name: `MEPHISTO_KV`
   - KV Namespace: Yeni bir tane oluşturup (`mephisto_emails_kv`) seçin ve kaydedin.

### 3️⃣ Catch-All Yönlendirmesini Worker'a Bağlama
1. `mephistomail.site` -> **Email -> Email Routing -> Routing rules** sekmesine gelin.
2. **Catch-all rule** düzenleme butonuna basın.
3. Action: **Send to Worker**
4. Destination Worker: **mephistomail-engine** seçin ve kaydedin!

---

## 🛡️ Otomatik Geri Dönüş (Fallback) Güvencesi

Sitemizdeki `mailService.ts` kodu akıllı hibrit mimari ile tasarlanmıştır:
- Eğer Cloudflare Worker API'niz aktifse **tüm e-postalar doğrudan kendi domaininizden (`@mephistomail.site`)** üretilir.
- Eğer henüz Cloudflare ayarlarını yapmadıysanız veya sunucuda bir aksama olursa sistem **SENSEZ GİBİ HİÇ HATA VERMEDEN GUERRILLAMAIL ALTYAPISINA OTOMATİK DÜŞER**.
- Bu sayede siteniz hiçbir koşulda bozulmaz ve her zaman %100 çalışır!
