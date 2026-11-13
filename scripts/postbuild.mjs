import fs from 'node:fs';

const raw = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
const site = raw.replace(/\/+$/, '');

const TURKISH = [
  ['<html lang="en">', '<html lang="tr">'],
  ['<title>CV Builder · Free, ATS-friendly CV maker</title>', '<title>CV Builder · Ücretsiz, ATS uyumlu CV oluştur</title>'],
  [
    'content="A free, private CV builder with no sign-up and no watermark. ATS score with line-by-line suggestions, import your old CV, PDF and Word export, English and Turkish."',
    'content="Ücretsiz, kayıtsız ve filigransız CV oluşturucu. ATS puanı ve madde madde öneriler, eski CV’ni içe aktarma, Türkçe karakter desteği, askerlik ve ehliyet alanları, TR/EN tek tıkla."',
  ],
  ['<link rel="canonical" href="%SITE_URL%/" />', '<link rel="canonical" href="%SITE_URL%/tr/" />'],
  ['<meta property="og:url" content="%SITE_URL%/" />', '<meta property="og:url" content="%SITE_URL%/tr/" />'],
  ['<meta property="og:locale" content="en_GB" />', '<meta property="og:locale" content="tr_TR" />'],
  ['<meta property="og:locale:alternate" content="tr_TR" />', '<meta property="og:locale:alternate" content="en_GB" />'],
  ['content="CV Builder · Free, ATS-friendly CV maker"', 'content="CV Builder · Ücretsiz, ATS uyumlu CV oluştur"'],
  [
    'content="No sign-up, no watermark, no fees. A professional CV with an ATS score and suggestions, and your data never leaves your browser."',
    'content="Kayıt yok, filigran yok, ücret yok. ATS puanı, madde madde öneriler ve tarayıcında kalan verilerle profesyonel CV."',
  ],
  ['content="No sign-up, no watermark, no fees. ATS score and line-by-line suggestions."', 'content="Kayıt yok, filigran yok, ücret yok. ATS puanı ve madde madde öneriler."'],
  ['content="CV Builder: free, ATS-friendly CV maker"', 'content="CV Builder: ücretsiz, ATS uyumlu CV oluşturucu"'],
  ['/og-image.png"', '/og-image-tr.png"'],
];

function localize(html, pairs) {
  let out = html;
  for (const [from, to] of pairs) {
    if (!out.includes(from)) throw new Error(`postbuild: expected markup not found: ${from.slice(0, 60)}`);
    out = out.replaceAll(from, to);
  }
  return out;
}

function finalize(html) {
  let out = html.replaceAll('%SITE_URL%', site);
  if (!site) out = out.replace(/\s*<link rel="(canonical|alternate)"[^>]*href="\/[^"]*"[^>]*\/>/g, '');
  if (process.env.VERCEL) out = out.replace('</head>', '    <script defer src="/_vercel/insights/script.js"></script>\n  </head>');
  return out;
}

const template = fs.readFileSync('dist/index.html', 'utf8');
const en = finalize(template);
const tr = finalize(localize(template, TURKISH));

fs.writeFileSync('dist/index.html', en);
fs.writeFileSync('dist/404.html', en);
fs.mkdirSync('dist/tr', { recursive: true });
fs.writeFileSync('dist/tr/index.html', tr);

const disallow = ['/edit/', '/view', '/tr/duzenle/', '/tr/goruntule', '/duzenle/', '/goruntule'].map((p) => `Disallow: ${p}`).join('\n');
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n${disallow}\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);

if (site) {
  const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${site}/"/><xhtml:link rel="alternate" hreflang="tr" href="${site}/tr/"/>`;
  const url = (loc) => `  <url><loc>${loc}</loc>${alternates}<changefreq>weekly</changefreq><priority>1.0</priority></url>`;
  fs.writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${url(`${site}/`)}\n${url(`${site}/tr/`)}\n</urlset>\n`,
  );
}

console.log(`postbuild: site=${site || '(relative)'}; wrote index.html, tr/index.html, 404.html, robots.txt${site ? ', sitemap.xml' : ''}`);
