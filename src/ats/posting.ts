import { unicodeWords } from './unicodeWord';

const COMPANY_SUFFIX = unicodeWords(/\b(A\.?Ş\.?|Ltd\.?|Şti\.?|Inc\.?|LLC|GmbH|Holding|Teknoloji|Group)(?!\w)/i);

export function guessFromPosting(ad: string): { position: string; company: string } {
  const lines = ad
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const company =
    /(?:şirket|firma|company|kurum)\s*[:：]\s*(.+)/i.exec(ad)?.[1]?.trim() ??
    lines.find((l) => COMPANY_SUFFIX.test(l) && l.length < 80) ??
    '';
  const position = lines.find((l) => l.length >= 3 && l.length <= 70 && !/[.:!?]$/.test(l) && l !== company) ?? '';
  return { position: position.replace(/^(pozisyon|position|ilan)\s*[:：]\s*/i, ''), company: company.slice(0, 80) };
}
