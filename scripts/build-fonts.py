"""Kaynak TTF'leri (Google Fonts, OFL/Apache) Latin + Latin Extended alt kümesine indirger.
Kullanım: python3 scripts/build-fonts.py <expo-google-fonts klasörü>"""
import sys, os, json, glob
from fontTools import subset
from fontTools.ttLib import TTFont
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')
FONTS = [
  # id, paket, kategori
  ('roboto','roboto','sans'), ('open-sans','open-sans','sans'), ('source-sans-3','source-sans-3','sans'),
  ('ibm-plex-sans','ibm-plex-sans','sans'), ('noto-sans','noto-sans','sans'), ('carlito','carlito','sans'),
  ('inter','inter','sans'), ('fira-sans','fira-sans','sans'), ('montserrat','montserrat','sans'),
  ('pt-sans','pt-sans','sans'), ('nunito-sans','nunito-sans','sans'), ('work-sans','work-sans','sans'),
  ('noto-serif','noto-serif','serif'), ('merriweather','merriweather','serif'), ('source-serif-4','source-serif-4','serif'),
  ('eb-garamond','eb-garamond','serif'), ('libre-baskerville','libre-baskerville','serif'), ('pt-serif','pt-serif','serif'),
  ('crimson-pro','crimson-pro','serif'), ('lora','lora','serif'),
]
STYLES = {'regular':'400Regular','italic':'400Regular_Italic','bold':'700Bold','boldItalic':'700Bold_Italic'}
UNICODES = "U+0000-024F,U+0259,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0308,U+2000-206F,U+20AC,U+20BA,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"
REQUIRED = "ğĞşŞıİçÇöÖüÜ•–—·›"
manifest = []
for fid, pkg, cat in FONTS:
    d = os.path.join(OUT, fid); os.makedirs(d, exist_ok=True)
    files = {}; family = None
    for key, style in STYLES.items():
        src = glob.glob(os.path.join(SRC, pkg, style, '*.ttf'))[0]
        f = TTFont(src); cmap = f.getBestCmap()
        miss = [c for c in REQUIRED if ord(c) not in cmap]
        if miss: raise SystemExit(f'{fid} {style} eksik glif: {miss}')
        family = family or (f['name'].getDebugName(16) or f['name'].getDebugName(1))
        opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.name_languages = ['*']
        opts.notdef_outline = True; opts.glyph_names = False; opts.hinting = False
        s = subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(UNICODES)); s.subset(f)
        out = os.path.join(d, f'{key}.ttf'); f.save(out); files[key] = f'{fid}/{key}.ttf'
    size = sum(os.path.getsize(os.path.join(OUT, p)) for p in files.values())
    manifest.append({'id': fid, 'family': family, 'category': cat, 'files': files, 'bytes': size})
    print(f'{fid:20} {family:22} {size//1024} KB')
json.dump(manifest, open(os.path.join(os.path.dirname(__file__), '..', 'src', 'render', 'fonts.json'), 'w'), ensure_ascii=False, indent=1)
