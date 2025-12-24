// api/mail.js
// Bu dosya senin şahsi proxy sunucundur. Başkasının proxy'sine ihtiyacın yok.

export default async function handler(req, res) {
  // 1. CORS İzinleri (Frontend erişebilsin diye)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 1secmail Hedef URL
  const BASE_URL = "https://www.1secmail.com/api/v1/";
  const url = new URL(BASE_URL);

  // Frontend'den gelen parametreleri aktar
  const query = req.query || {};
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, String(value));
  }

  try {
    // 3. Sunucudan Sunucuya İstek (CORS takılmaz)
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mephisto/1.0 (Vercel Serverless)'
      }
    });

    if (!response.ok) {
       return res.status(response.status).json({ error: "Provider Error" });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
