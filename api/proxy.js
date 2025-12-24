import https from 'https';

export default function handler(req, res) {
  // 1. CORS İzinleri (Tüm sitelere açıyoruz)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. CACHE İPTALİ (Çok Önemli: Vercel'in eski veriyi tutmasını engeller)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Tarayıcı ön kontrolü
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parametresi gerekli' });
  }

  // 3. 1secmail'e Bağlan
  https.get(url, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        // Gelen veriyi JSON'a çevirip gönder
        const json = JSON.parse(data);
        res.status(200).json(json);
      } catch (e) {
        // Eğer 1secmail hata verirse veya boş dönerse, boş dizi gönder
        // Bu sayede frontend (React) tarafı çökmez.
        res.status(200).json([]); 
      }
    });

  }).on('error', (err) => {
    res.status(500).json({ error: 'Proxy Bağlantı Hatası', details: err.message });
  });
}
