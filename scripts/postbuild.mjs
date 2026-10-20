// Derleme sonrası: site adresini yerleştir, robots/sitemap üret, yönlendirme kuralı olmayan barındırıcılar için 404.html
import fs from 'fs';

// Vercel otomatik verir; başka yerde SITE_URL ile ayarlanabilir. Yoksa göreli adres kullanılır.
const raw = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
const site = raw.replace(/\/+$/, '');

let html = fs.readFileSync('dist/index.html', 'utf8');
html = html.replaceAll('%SITE_URL%', site);
if (!site) html = html.replace(/\s*<link rel="canonical" href="\/" \/>/, '');
// Vercel'de: çerezsiz, kişiyi tanımayan ziyaret sayacı (panelde "Analytics" açılınca çalışır, kapalıysa etkisizdir)
if (process.env.VERCEL) html = html.replace('</head>', '    <script defer src="/_vercel/insights/script.js"></script>\n  </head>');
fs.writeFileSync('dist/index.html', html);
fs.writeFileSync('dist/404.html', html);

fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /duzenle/\nDisallow: /goruntule\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);
if (site)
  fs.writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
  );
console.log(`postbuild: site=${site || '(göreli)'}; 404.html, robots.txt${site ? ', sitemap.xml' : ''} yazıldı`);
