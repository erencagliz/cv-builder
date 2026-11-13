import type { RenderModel, Rich } from './buildModel';

const r = (x: Rich) => x.map((s) => s.t).join('');

export function toPlainText(m: RenderModel): string {
  const out: string[] = [];
  if (m.header.name) out.push(m.header.name);
  if (m.header.title) out.push(m.header.title);
  if (m.header.contacts.length) out.push(m.header.contacts.map((c) => c.text).join(' | '));
  for (const s of m.sections) {
    out.push('', s.title.toLocaleUpperCase(m.lang === 'tr' ? 'tr-TR' : 'en-US'));
    if (s.kind === 'text') s.paragraphs!.forEach((p) => out.push(r(p)));
    if (s.kind === 'lines' || s.kind === 'inline') s.lines!.forEach((l) => out.push(l.label ? `${l.label}: ${r(l.value)}` : r(l.value)));
    if (s.kind === 'entries')
      s.items!.forEach((it, i) => {
        if (i) out.push('');
        out.push([[it.heading, it.org].filter(Boolean).join(' – '), it.date].filter(Boolean).join(' | '));
        const sub = [it.sub, it.location].filter(Boolean).join(' | ');
        if (sub) out.push(sub);
        if (it.urlText) out.push(it.urlText);
        const body = (desc: Rich[], bullets: Rich[], tags: string, label: string) => {
          desc.forEach((p) => out.push(r(p)));
          bullets.forEach((b) => out.push(`- ${r(b)}`));
          if (tags) out.push(`${label}: ${tags}`);
        };
        for (const role of it.roles) {
          out.push([role.heading, role.date].filter(Boolean).join(' | '));
          if (role.sub) out.push(role.sub);
          body(role.desc, role.bullets, role.tags, role.tagsLabel);
        }
        body(it.desc, it.bullets, it.tags, it.tagsLabel);
      });
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
