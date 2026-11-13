import type { CV, Lang } from '../model/types';

export interface LetterStarter {
  id: string;
  name: string;
  description: string;
  lang: Lang;
  body: (v: Vars) => string;
}
interface Vars {
  position: string;
  company: string;
  title: string;
  years: string;
  skills: string;
}

export const LETTER_STARTERS: LetterStarter[] = [
  {
    id: 'experienced',
    name: 'Deneyimli',
    description: 'İş deneyimini ve somut başarılarını öne çıkarır.',
    lang: 'tr',
    body: (v) => `${v.company} bünyesindeki ${v.position} pozisyonu için başvurumu sunmak istiyorum. ${v.years} yıldır ${v.title} olarak çalışıyorum ve ${v.skills} konularında deneyim kazandım.

Son görevimde [en güçlü başarını bir cümleyle yaz: ne yaptın, sonucu ne oldu, mümkünse sayıyla]. Bu deneyimin, ${v.company} ekibinin [ilandaki bir ihtiyaç] hedefine doğrudan katkı sağlayacağına inanıyorum.

${v.company}’ı [şirketi neden seçtiğini anlatan somut bir neden: ürün, değer, proje] nedeniyle takip ediyorum. Ekibinize katılarak [ilk 6 ayda katkı sağlayabileceğin bir alan] konusunda sorumluluk almak isterim.

Özgeçmişimi ekte bilgilerinize sunuyorum. Uygun olduğunuz bir zamanda görüşmekten memnuniyet duyarım.`,
  },
  {
    id: 'graduate',
    name: 'Yeni mezun',
    description: 'Eğitim, staj ve projelerle deneyim eksikliğini telafi eder.',
    lang: 'tr',
    body: (v) => `${v.company} bünyesinde açılan ${v.position} pozisyonu için başvuruyorum. [Okul ve bölüm] mezunuyum; eğitimim boyunca ${v.skills} alanlarında kendimi geliştirdim.

[Staj veya proje adı] sırasında [ne yaptığını ve öğrendiğini anlatan bir cümle]. Bu süreçte [takım çalışması, problem çözme gibi bir beceriyi örnekle] gösterdim.

Öğrenmeye ve sorumluluk almaya istekliyim. ${v.company}’ın [şirketle ilgili bilgi] yaklaşımı, kariyerime başlamak istediğim ortamla birebir örtüşüyor.

Özgeçmişimi ekte sunuyorum. Değerlendirmeniz için teşekkür eder, görüşme fırsatı için hazır olduğumu belirtmek isterim.`,
  },
  {
    id: 'career-change',
    name: 'Kariyer değişikliği',
    description: 'Farklı bir alandan gelen aktarılabilir becerileri anlatır.',
    lang: 'tr',
    body: (v) => `${v.company} bünyesindeki ${v.position} pozisyonuna başvurmak istiyorum. ${v.years} yıllık iş hayatımda [önceki alanın] alanında çalıştım ve son [süre] içinde [yeni alan] için [kurs, sertifika, proje] ile kendimi geliştirdim.

Önceki deneyimimden getirdiğim [aktarılabilir beceri 1] ve [aktarılabilir beceri 2], bu pozisyonda doğrudan işe yarayacak. Örneğin [önceki işten somut bir başarı ve yeni alana nasıl uyduğu].

Bu geçişi bilinçli bir tercih olarak yapıyorum ve ${v.company}’ın [şirketle ilgili bilgi] yaklaşımı beni özellikle heyecanlandırıyor.

Özgeçmişimi ekte bilgilerinize sunuyorum. Görüşme fırsatı için teşekkür ederim.`,
  },
  {
    id: 'english',
    name: 'İngilizce (genel)',
    description: 'Yurt dışı veya yabancı şirket başvuruları için.',
    lang: 'en',
    body: (v) => `I am writing to apply for the ${v.position} position at ${v.company}. I have ${v.years} years of experience as a ${v.title}, with a strong background in ${v.skills}.

In my current role, I [describe your strongest achievement with a number]. I believe this experience would help ${v.company} [a need mentioned in the job posting].

I am drawn to ${v.company} because [a specific reason: product, values, project]. I would welcome the opportunity to contribute to [an area you could own in the first months].

My resume is attached. Thank you for your time and consideration; I look forward to the possibility of discussing this role with you.`,
  },
];

export function letterVars(cv: CV, totalMonths: number): Vars {
  const skills = cv.sections.skills
    .flatMap((k) => (Array.isArray(k.items) ? (k.items as string[]) : []))
    .slice(0, 3)
    .join(', ');
  return {
    position: cv.coverLetter.position.trim() || cv.personal.title.trim() || '[pozisyon]',
    company: cv.coverLetter.company.trim() || '[şirket]',
    title: cv.personal.title.trim() || '[unvan]',
    years: totalMonths >= 12 ? String(Math.floor(totalMonths / 12)) : '[X]',
    skills: skills || '[alan]',
  };
}
