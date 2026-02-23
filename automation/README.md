# 🔥 MephistoMail Promotion Engine

Sosyal medya tanıtım otomasyon sistemi.

## Hızlı Başlangıç

```powershell
cd automation

# Durum raporu göster
.\mephisto-promote.ps1 -Action status

# Sıradaki tweeti paylaş
.\mephisto-promote.ps1 -Action next

# Belirli bir tweeti paylaş (ID ile)
.\mephisto-promote.ps1 -Action tweet -TweetId 5

# Reddit'te paylaş (tüm subreddit'ler)
.\mephisto-promote.ps1 -Action reddit

# Belirli subreddit'te paylaş
.\mephisto-promote.ps1 -Action reddit -RedditId r1

# Rakipleri takip et
.\mephisto-promote.ps1 -Action competitors

# Tüm platformlarda paylaş (interaktif menü)
.\mephisto-promote.ps1 -Action all

# Zamanlı paylaşım (3 tweet, 10 dk aralarla)
.\mephisto-promote.ps1 -Action schedule -Count 3 -DelayMinutes 10

# Performans metriklerini güncelle
.\mephisto-promote.ps1 -Action log

# DRY RUN - tarayıcı açmadan test et
.\mephisto-promote.ps1 -Action schedule -Count 5 -DryRun
```

## Dosya Yapısı

```
automation/
├── mephisto-promote.ps1   # Ana otomasyon scripti
├── tweet-queue.json       # Tweet kuyruğu (15 tweet + 5 Reddit)
├── post-log.json          # Paylaşım log'u ve metrikler
└── README.md              # Bu dosya
```

## Özellikler

### 1. Tweet Kuyruğu
- 15 hazır tweet (EN + TR)
- Kategoriler: privacy, competitive, otp, use-case, tech, social-proof
- Otomatik karakter sayımı (280 limit kontrolü)
- Paylaşılan tweetler otomatik işaretlenir

### 2. Çoklu Platform
- **X (Twitter)** — Intent URL ile compose
- **Reddit** — 5 farklı subreddit (r/privacy, r/degoogle, r/selfhosted, r/webdev, r/Freesoftware)
- **Hacker News** — Show HN formatı
- **Product Hunt** — Launch desteği
- **IndieHackers** — Post desteği

### 3. Rakip Takip
- SimpleLogin, Temp Mail, Guerrilla Mail, ProtonMail, Tutanota
- Rakip X sayfalarını hızlıca açma
- MephistoMail mention arama
- "temp mail" / "disposable email" konuşmalarını takip (reply fırsatları)

### 4. Performans Takibi
- Her paylaşım otomatik log'a kaydedilir
- Beğeni, RT, reply, tıklama metrikleri
- Kategori bazlı analiz
- Zaman çizelgesi görünümü

## Tweet Kategorileri

| Kategori | Açıklama | Adet |
|----------|----------|------|
| `competitive` | Rakiplerle karşılaştırma | 4 |
| `privacy` | Gizlilik farkındalığı | 2 |
| `problem-solution` | Sorun/çözüm formatı | 2 |
| `feature` | Özellik tanıtımı | 2 |
| `otp` | OTP özelliği | 1 |
| `use-case` | Kullanım senaryoları | 1 |
| `tech` | Teknik stack | 1 |
| `social-proof` | Kullanıcı yorumları | 1 |
| `awareness` | Bilinç uyandırma | 1 |

## İpuçları

- **Spam önleme:** Reddit'te postlar arası en az 5-10 dk bekleyin
- **En etkili formatlar:** SimpleLogin analizi gösterdi ki meme + sosyal kanıt en çok etkileşim alıyor
- **Zamanlama:** Hafta içi 10:00-14:00 ve 18:00-21:00 arası en iyi saatler
- **Karakter limiti:** Her tweet otomatik kontrol edilir (>280 = hata)
