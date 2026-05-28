'use strict'

module.exports = async function handler(req,res) {
    
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    /* ── 1. Lire toutes les candidatures ── */
    const dbRes = await fetch(
      `${url}/rest/v1/candidatures?select=*&order=date_inscription.desc`,
      {
        headers: {
          'apikey':        key,
          'Authorization': `Bearer ${key}`,
        }
      }
    );

    if (!dbRes.ok) return res.status(500).json({ success: false });

    const candidatures = await dbRes.json();

    /* ── 2. Collecter les chemins des photos ── */
    const paths = [];
    candidatures.forEach(c => {
      if (c.photo_profil_url)
  paths.push(c.photo_profil_url.replace('photos-candidatures/', ''));
      if (c.photo_body_url)
  paths.push(c.photo_body_url.replace('photos-candidatures/', ''));
    });

    /* ── 3. Générer les URLs signées en batch ── */
    let signedMap = {};
    if (paths.length > 0) {
      const signRes = await fetch(
        `${url}/storage/v1/object/sign/photos-candidatures`,
        {
          method:  'POST',
          headers: {
            'apikey':        key,
            'Authorization': `Bearer ${key}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ paths, expiresIn: 86400 }),
        }
      );
      const signData = await signRes.json();
      signData.forEach(item => {
        if (item.signedURL) signedMap[item.path] = `${url}${item.signedURL}`;
      });
    }

    /* ── 4. Attacher les URLs signées à chaque candidature ── */
    const result = candidatures.map(c => ({
      ...c,
      photo_profil_signed: c.photo_profil_url
        ? signedMap[c.photo_profil_url.replace('photos-candidatures/', '')]
        : null,
      photo_body_signed: c.photo_body_url
        ? signedMap[c.photo_body_url.replace('photos-candidatures/', '')]
        : null,
    }));

    return res.status(200).json({ success: true, data: result });
};