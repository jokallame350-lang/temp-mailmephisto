// Bu kod Sunucu Tarafında (Node.js) çalışır.
// Sunucularda CORS engeli yoktur, bu yüzden 1secmail'e direkt bağlanabilir.

export default async function handler(req, res) {
  // 1. Frontend'in bu sunucuya erişmesine izin ver (CORS Ayarı)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tarayıcı ön kontrolü (OPTIONS) için OK dön
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 1secmail API URL'ini hazırla
  const BASE_URL = "https://www.1secmail.com/api/v1/";
  const url = new URL(BASE_URL);

  // Frontend'den gelen parametreleri (action, login, domain vb.) 1secmail'e aktar
  const query = req.query || {};
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  try {
    // 3. Sunucudan 1secmail'e direkt istek at (Burada Proxy YOKTUR)
    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!response.ok) {
       return res.status(response.status).json({ error: "1secmail Error" });
    }

    const data = await response.json();
    
    // 4. Veriyi Frontend'e geri gönder
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
