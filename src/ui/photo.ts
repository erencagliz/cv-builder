/** Fotoğraf okuma: tarayıcının açabildiği tüm görsel türleri (JPG, JFIF, PNG, WebP, AVIF, GIF, BMP; Safari'de HEIC). */

export class PhotoError extends Error {}

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
const looksLikeImage = (f: File) =>
  f.type.startsWith('image/') || f.type === '' || /\.(jpe?g|jfif|pjpeg|pjp|png|webp|avif|gif|bmp|heic|heif|tiff?)$/i.test(f.name);

type Drawable = { width: number; height: number; draw: (ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, w: number, h: number) => void };

async function decode(file: File): Promise<Drawable> {
  // 1) createImageBitmap: hızlı, EXIF yönünü uygular
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    return { width: bmp.width, height: bmp.height, draw: (ctx, sx, sy, sw, sh, w, h) => ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h) };
  } catch {
    /* bazı türlerde başarısız olabilir; <img> ile dene */
  }
  // 2) <img>: Safari'nin HEIC gibi kendine özgü türleri
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight, draw: (ctx, sx, sy, sw, sh, w, h) => ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h) };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Fotoğrafı 4:5 oranında, yüz genelde üstte olduğu için biraz yukarıdan kırpıp 480×600 JPEG'e küçültür */
export async function cropPhoto(file: File): Promise<string> {
  if (!looksLikeImage(file)) throw new PhotoError('Bu bir görsel dosyası değil. JPG veya PNG bir fotoğraf seç.');
  if (file.size > 25 * 1024 * 1024) throw new PhotoError('Fotoğraf 25 MB’tan büyük. Daha küçük bir dosya seç.');
  let img: Drawable;
  try {
    img = await decode(file);
  } catch {
    if (isHeic(file)) throw new PhotoError('Bu iPhone fotoğrafı (HEIC) bu tarayıcıda açılamıyor. Fotoğrafı JPG olarak kaydet ya da ekran görüntüsünü yükle.');
    throw new PhotoError('Fotoğraf açılamadı. Dosya bozuk olabilir; JPG veya PNG bir fotoğraf dene.');
  }
  if (img.width < 80 || img.height < 80) throw new PhotoError('Fotoğraf çok küçük (en az 80×80 piksel olmalı).');
  const ratio = 4 / 5;
  let sw = img.width;
  let sh = sw / ratio;
  if (sh > img.height) {
    sh = img.height;
    sw = sh * ratio;
  }
  const sx = (img.width - sw) / 2;
  const sy = Math.max(0, (img.height - sh) / 2 - (img.height - sh) * 0.15);
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 600;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  img.draw(ctx, sx, sy, sw, sh, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}
