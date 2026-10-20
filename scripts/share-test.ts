import { encodeCV, decodeCV } from '../src/share/link';
import { sampleCV } from '../src/model/sample';
import { PROFESSIONS } from '../src/content/professions';
import { sampleFor } from '../src/content/gallery';
import { emptyCV } from '../src/model/defaults';
let fail = 0;
const strip = (cv: any) => JSON.parse(JSON.stringify(cv, (k, v) => (k === 'id' || k === 'createdAt' || k === 'updatedAt' ? undefined : v)));
for (const cv of [sampleCV(), emptyCV(), ...PROFESSIONS.map((p) => sampleFor(p.id))]) {
  cv.jobPosting = '';
  cv.coverLetter = emptyCV().coverLetter;
  cv.personal.photo = '';
  cv.personal.showPhoto = false;
  cv.design.colors.accent = '#123456';
  cv.design.sizes.body = 10.25;
  const code = await encodeCV(cv);
  const back = await decodeCV(code);
  const a = strip(cv), b = strip(back);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail++;
    console.log('FAIL', cv.name);
    for (const k of Object.keys(a)) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) console.log('  diff', k, JSON.stringify(a[k]).slice(0, 200), '\n   vs', JSON.stringify(b[k]).slice(0, 200));
  } else console.log('ok', cv.name, code.length, 'karakter');
}
let threw = false;
try { await decodeCV('1.bozukveri'); } catch { threw = true; }
if (!threw) { fail++; console.log('FAIL bozuk bağlantı hata vermedi'); }
console.log(fail ? `${fail} başarısız` : 'paylaşım testleri geçti');
process.exit(fail ? 1 : 0);
