/**
 * Word (.docx) çıktısı: tek sütun, gerçek başlık stilleri, Word'ün kendi madde işaretleri.
 * Tablo, metin kutusu, üst/alt bilgi kullanılmaz (ATS dostu).
 */
import type { RenderModel, Rich } from '../render/buildModel';

const hex = (c: string) => c.replace('#', '').toUpperCase();
const MM = 56.6929; // 1 mm = 56.69 twip

export async function buildDocx(m: RenderModel): Promise<Blob> {
  const d = await import('docx');
  const { Document, Packer, Paragraph, TextRun, ExternalHyperlink, AlignmentType, BorderStyle, TabStopType, HeadingLevel, LevelFormat } = d;
  const D = m.design;
  const pt = (v: number) => Math.round(v * 2); // docx yarım punto
  const accent = hex(D.colors.accent);
  const ink = hex(D.colors.text);
  const muted = hex(D.colors.muted);
  const body = D.bodyFamily;
  const head = D.headingFamily;
  const pageW = D.paper === 'a4' ? 210 : 215.9;
  const contentTw = Math.round((pageW - D.margins.left - D.margins.right) * MM);

  const runs = (r: Rich, base: { size?: number; color?: string; font?: string } = {}) =>
    r.map((s) => new TextRun({ text: s.t, bold: s.b, italics: s.i, size: pt(base.size ?? D.sizes.body), color: base.color ?? ink, font: base.font ?? body }));
  const metaRun = (t: string, italics = false) => new TextRun({ text: t, size: pt(D.sizes.meta), color: muted, italics, font: body });
  const spacing = (after: number, before = 0) => ({ after: Math.round(after * 20), before: Math.round(before * 20) });

  const children: InstanceType<typeof Paragraph>[] = [];
  const h = m.header;
  children.push(
    new Paragraph({
      alignment: D.nameAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: spacing(2),
      children: [new TextRun({ text: h.name, bold: true, size: pt(D.sizes.name), font: head, color: D.nameColor === 'accent' ? accent : ink })],
    }),
  );
  if (h.title)
    children.push(
      new Paragraph({
        alignment: D.nameAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: spacing(3),
        children: [new TextRun({ text: h.title, size: pt(D.sizes.title), font: body, color: D.titleColor === 'accent' ? accent : muted })],
      }),
    );
  if (h.contacts.length) {
    const parts: (InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>)[] = [];
    h.contacts.forEach((c, i) => {
      if (i) parts.push(metaRun(` ${D.contactSeparator} `));
      const tr = new TextRun({ text: c.text, size: pt(D.sizes.meta), color: c.url && D.linkStyle !== 'url' ? accent : ink, font: body, underline: D.underlineLinks ? {} : undefined });
      parts.push(c.url ? new ExternalHyperlink({ link: c.url, children: [tr] }) : tr);
    });
    children.push(new Paragraph({ alignment: D.nameAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: spacing(6), children: parts }));
  }

  const rightTab = [{ type: TabStopType.RIGHT, position: contentTw }];
  const heading = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: spacing(D.headingGap, D.sectionGap),
      keepNext: true,
      border: D.headingStyle === 'plain' ? undefined : { bottom: { style: BorderStyle.SINGLE, size: 6, color: D.ruleColor === 'accent' ? accent : hex(D.colors.rule), space: 2 } },
      children: [
        new TextRun({
          text: title,
          bold: D.headingWeight !== 'regular',
          size: pt(D.sizes.heading),
          color: D.headingColor === 'accent' ? accent : ink,
          font: head,
          characterSpacing: Math.round(D.headingTracking * 20),
        }),
      ],
    });
  const bullet = (r: Rich) => new Paragraph({ numbering: { reference: 'cv-bullets', level: 0 }, spacing: spacing(D.bulletGap), children: runs(r) });
  const titleLine = (heading: string, org: string, date: string, loc = '') => {
    const kids: InstanceType<typeof TextRun>[] = [];
    if (heading) kids.push(new TextRun({ text: heading, bold: true, size: pt(D.sizes.entryTitle), font: body, color: ink }));
    if (org) kids.push(new TextRun({ text: (heading ? ' – ' : '') + org, size: pt(D.sizes.entryTitle), font: body, color: ink }));
    if (date && D.datePosition === 'right') kids.push(new TextRun({ text: `\t${date}`, size: pt(D.sizes.meta), color: muted, font: body }));
    if ((date || loc) && D.datePosition === 'inline') kids.push(metaRun(`  (${[date, loc].filter(Boolean).join(' · ')})`, true));
    return new Paragraph({ tabStops: rightTab, keepNext: true, spacing: spacing(1), children: kids });
  };

  if (m.kind === 'letter' && m.letter) {
    const L = m.letter;
    children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 4 } }, spacing: spacing(12), children: [] }));
    if (L.place) children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: spacing(12), children: [metaRun(L.place)] }));
    L.recipient.forEach((r) => children.push(new Paragraph({ children: [new TextRun({ text: r, bold: true, size: pt(D.sizes.body), font: body })] })));
    if (L.subject) children.push(new Paragraph({ spacing: spacing(12, 12), children: [new TextRun({ text: L.subject, bold: true, size: pt(D.sizes.body), font: body })] }));
    children.push(new Paragraph({ spacing: spacing(10), children: [new TextRun({ text: L.greeting, size: pt(D.sizes.body), font: body })] }));
    L.paragraphs.forEach((p) => children.push(new Paragraph({ spacing: spacing(10), children: runs(p) })));
    children.push(new Paragraph({ spacing: spacing(28, 8), children: [new TextRun({ text: L.closing, size: pt(D.sizes.body), font: body })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: L.signature, bold: true, size: pt(D.sizes.entryTitle), font: head })] }));
  } else {
    for (const s of m.sections) {
      children.push(heading(s.title));
      if (s.kind === 'text') s.paragraphs!.forEach((p) => children.push(new Paragraph({ spacing: spacing(D.paragraphGap), children: runs(p) })));
      if (s.kind === 'lines')
        s.lines!.forEach((l) =>
          children.push(
            new Paragraph({
              spacing: spacing(D.bulletGap + 1),
              children: [...(l.label ? [new TextRun({ text: `${l.label}: `, bold: true, size: pt(D.sizes.body), font: body, color: ink })] : []), ...runs(l.value)],
            }),
          ),
        );
      if (s.kind === 'inline')
        children.push(
          new Paragraph({
            children: s.lines!.flatMap((l, i) => [
              ...(i ? [metaRun(' · ')] : []),
              new TextRun({ text: `${l.label}: `, bold: true, size: pt(D.sizes.body), font: body, color: ink }),
              ...runs(l.value),
            ]),
          }),
        );
      if (s.kind === 'entries')
        s.items!.forEach((it, idx) => {
          const before = idx ? D.entryGap : 0;
          if (before) children.push(new Paragraph({ spacing: { before: 0, after: 0, line: Math.round(before * 20) }, children: [] }));
          const loc = D.datePosition === 'inline' ? it.location : '';
          children.push(titleLine(it.heading, it.roles.length ? '' : it.org, it.date, loc));
          const sub = D.datePosition === 'below' ? [it.date, it.location, it.sub].filter(Boolean).join(' · ') : D.datePosition === 'right' ? [it.sub, it.location].filter(Boolean).join(' · ') : it.sub;
          if (sub && !it.roles.length) children.push(new Paragraph({ spacing: spacing(2), children: [metaRun(sub, true)] }));
          if (it.urlText) children.push(new Paragraph({ children: [new ExternalHyperlink({ link: it.url, children: [metaRun(it.urlText)] })] }));
          const bodyParts = (desc: Rich[], bullets: Rich[], tags: string, label: string) => {
            desc.forEach((p) => children.push(new Paragraph({ spacing: spacing(D.paragraphGap * 0.6), children: runs(p) })));
            bullets.forEach((b) => children.push(bullet(b)));
            if (tags) children.push(new Paragraph({ children: [metaRun(`${label}: `, true), metaRun(tags)] }));
          };
          for (const r of it.roles) {
            children.push(titleLine(r.heading, '', r.date));
            if (r.sub) children.push(new Paragraph({ children: [metaRun(r.sub, true)] }));
            bodyParts(r.desc, r.bullets, r.tags, r.tagsLabel);
          }
          bodyParts(it.desc, it.bullets, it.tags, it.tagsLabel);
        });
    }
  }

  const doc = new Document({
    creator: m.meta.author,
    title: m.meta.title,
    keywords: m.meta.keywords.join(', '),
    styles: {
      default: { document: { run: { font: body, size: pt(D.sizes.body), color: ink }, paragraph: { spacing: { line: Math.round(240 * (1 + D.leading * 0.35)) } } } },
    },
    numbering: {
      config: [
        {
          reference: 'cv-bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: D.bullet, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: D.paper === 'a4' ? { width: Math.round(210 * MM), height: Math.round(297 * MM) } : { width: 12240, height: 15840 },
            margin: { top: Math.round(D.margins.top * MM), bottom: Math.round(D.margins.bottom * MM), left: Math.round(D.margins.left * MM), right: Math.round(D.margins.right * MM) },
          },
        },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
