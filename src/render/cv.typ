// CV Builder – Typst şablonu
// Tüm metinler /data.json'dan okunur; kullanıcı metni hiçbir zaman Typst kodu olarak yorumlanmaz.
// ATS kuralları: tek akış, gerçek metin, heceleme ve bitişik harf (ligatür) kapalı, üst/alt bilgi yok.

#let d = json("/data.json")
#let D = d.design
#let S = D.sizes
#let accent = rgb(D.colors.accent)
#let ink = rgb(D.colors.text)
#let muted = rgb(D.colors.muted)
#let rulec = if D.ruleColor == "accent" { accent.lighten(35%) } else { rgb(D.colors.rule) }
#let divc = rgb(D.colors.rule)
#let tcolor = if D.titleColor == "accent" { accent } else { muted }
#let fam-head = (D.headingFamily, D.bodyFamily)
#let fam-body = (D.bodyFamily,)
#let hcolor = if D.headingColor == "accent" { accent } else { ink }
#let ncolor = if D.nameColor == "accent" { accent } else { ink }
#let hweight = if D.headingWeight == "regular" { "regular" } else if D.headingWeight == "semibold" { "semibold" } else { "bold" }
#let right-dates = D.datePosition == "right"
#let inline-dates = D.datePosition == "inline"
#let line-gap = D.leading * S.meta * 1pt

#set document(title: d.meta.title, author: d.meta.author, keywords: d.meta.keywords)
#set page(
  paper: D.paper,
  margin: (top: D.margins.top * 1mm, bottom: D.margins.bottom * 1mm, left: D.margins.left * 1mm, right: D.margins.right * 1mm),
  fill: white,
)
#set text(font: fam-body, size: S.body * 1pt, fill: ink, lang: d.lang, hyphenate: false, ligatures: false)
#set par(leading: D.leading * 1em, spacing: D.paragraphGap * 1pt, justify: false)
#set list(marker: text(fill: if D.bulletColor == "accent" { accent } else { muted }, D.bullet), indent: 1pt, body-indent: 6pt, spacing: D.bulletGap * 1pt)
#set block(spacing: D.paragraphGap * 1pt)
#show link: it => if D.underlineLinks { underline(offset: 1.5pt, stroke: 0.4pt, it) } else { it }

// Dekoratif ikon: görsel olarak çizilir, PDF'te "artifact" işaretlenir; ATS metnine karışmaz
#let ic(svg, size: 1em) = if svg == "" or svg == none { none } else {
  pdf.artifact(box(baseline: 0.14em, image(bytes(svg), format: "svg", height: size, width: size)))
}

// **kalın** / *italik* parçaları
#let rich(segs) = for s in segs {
  let b = s.at("b", default: false)
  let i = s.at("i", default: false)
  if b and i { strong(emph(s.t)) } else if b { strong(s.t) } else if i { emph(s.t) } else { s.t }
}
#let meta(body) = text(size: S.meta * 1pt, fill: muted, body)
#let dot = meta[ · ]
#let join-dot(..parts) = parts.pos().filter(p => p != "" and p != none).join(dot)

/* ---------------- Başlık (ad, unvan, iletişim) ---------------- */
#let header() = {
  let al = if D.nameAlign == "center" { center } else { left }
  let parts = ()
  if d.header.name != "" {
    parts.push(text(font: fam-head, size: S.name * 1pt, weight: "bold", fill: ncolor, d.header.name))
  }
  if d.header.title != "" {
    parts.push(text(size: S.title * 1pt, fill: tcolor, weight: if D.titleColor == "accent" { "medium" } else { "regular" }, d.header.title))
  }
  if d.header.contacts.len() > 0 {
    let sep = text(fill: muted)[#h(0.35em)#D.contactSeparator#h(0.35em)]
    let item(c) = {
      let label = [#if c.icon != "" [#ic(c.icon, size: 0.95em)#h(0.28em)]#c.text]
      let body = if c.url != "" { link(c.url, label) } else { label }
      if c.button {
        box(stroke: 0.6pt + accent, radius: 3pt, inset: (x: 4.5pt, y: 2.5pt), outset: (y: 0.5pt), text(fill: accent, body))
      } else { box(body) }
    }
    let items = d.header.contacts.map(item)
    parts.push(text(size: S.meta * 1pt, items.join(sep)))
  }
  let gaps = (0pt, S.title * 0.55pt, S.meta * 0.9pt)
  let body = align(al, {
    for (i, p) in parts.enumerate() {
      block(above: gaps.at(calc.min(i, 2)), below: 0pt, p)
    }
  })
  if d.header.photo {
    let P = D.photo
    let w = P.size * 1mm
    let h = if P.shape == "rounded" { w * 1.25 } else { w }
    let r = if P.shape == "circle" { 50% } else if P.shape == "rounded" { 3pt } else { 0pt }
    let pic = box(clip: true, radius: r, width: w, height: h, image("/photo.jpg", width: w, height: h, fit: "cover", alt: "Fotoğraf"))
    if P.position == "left" {
      grid(columns: (w, 1fr), column-gutter: 14pt, align: (top, horizon), pic, body)
    } else {
      grid(columns: (1fr, w), column-gutter: 14pt, align: (horizon, top), body, pic)
    }
  } else { body }
}

/* ---------------- Bölüm başlıkları ---------------- */
#show heading.where(level: 1): it => {
  let t = text(font: fam-head, size: S.heading * 1pt, weight: hweight, fill: hcolor, tracking: D.headingTracking * 1pt, it.body)
  let styled = if D.headingStyle == "rule" {
    stack(spacing: S.heading * 0.3pt, t, line(length: 100%, stroke: 0.7pt + rulec))
  } else if D.headingStyle == "line-after" {
    grid(columns: (auto, 1fr), column-gutter: 8pt, align: horizon, t, line(length: 100%, stroke: 0.7pt + rulec))
  } else if D.headingStyle == "bar" {
    grid(columns: (3pt, auto), column-gutter: 7pt, align: horizon, rect(width: 3pt, height: S.heading * 1.05pt, fill: accent, stroke: none), t)
  } else if D.headingStyle == "filled" {
    block(width: 100%, fill: accent.lighten(90%), inset: (x: 6pt, y: S.heading * 0.32pt), radius: 2pt, t)
  } else { t }
  block(above: D.sectionGap * 1pt, below: D.headingGap * 1pt, sticky: true, width: 100%, styled)
}

/* ---------------- Girdiler ---------------- */
#let title-line(heading, org, date, size: S.entryTitle, loc: "") = {
  set text(size: size * 1pt)
  if heading != "" { strong(heading) }
  if org != "" {
    if heading != "" [ – ]
    org
  }
  if right-dates and date != "" [#h(1fr) #meta(date)]
  if inline-dates and (date != "" or loc != "") [#h(0.5em)#meta(emph("(" + (date, loc).filter(x => x != "").join(" · ") + ")"))]
}

#let sub-line(sub, date, location) = {
  if inline-dates {
    if sub != "" { block(above: line-gap, below: 0pt, meta(emph(sub))) }
  } else if right-dates {
    if sub != "" or location != "" {
      block(above: line-gap, below: 0pt, meta[#emph(sub)#h(1fr)#location])
    }
  } else {
    let s = join-dot(date, location, sub)
    if s != none { block(above: line-gap, below: 0pt, meta(s)) }
  }
}

#let body-parts(desc, bullets, tags, tags-label) = {
  for p in desc { block(above: D.paragraphGap * 0.8pt, below: 0pt, par(rich(p))) }
  if bullets.len() > 0 {
    block(above: D.paragraphGap * 0.8pt, below: 0pt, list(..bullets.map(b => rich(b))))
  }
  if tags != "" {
    block(above: D.paragraphGap * 0.8pt, below: 0pt, meta[#emph(tags-label + ":") #tags])
  }
}

#let entry-body(it, first) = block(above: if first { 0pt } else if D.entryDivider { D.entryGap * 0.5pt } else { D.entryGap * 1pt }, below: 0pt, width: 100%, breakable: true, {
  if it.roles.len() > 0 {
    // Aynı şirkette birden fazla pozisyon
    block(above: 0pt, below: 0pt, title-line(it.heading, "", it.date, loc: if inline-dates { it.location } else { "" }))
    if it.location != "" and not inline-dates { block(above: line-gap, below: 0pt, meta(it.location)) }
    for r in it.roles {
      block(above: D.entryGap * 0.6pt, below: 0pt, {
        block(above: 0pt, below: 0pt, {
          set text(size: S.entryTitle * 1pt)
          emph(strong(r.heading))
          if right-dates and r.date != "" [#h(1fr) #meta(r.date)]
          if inline-dates and r.date != "" [#h(0.5em)#meta(emph("(" + r.date + ")"))]
        })
        sub-line(r.sub, r.date, "")
        body-parts(r.desc, r.bullets, r.tags, r.tagsLabel)
      })
    }
  } else {
    block(above: 0pt, below: 0pt, title-line(it.heading, it.org, it.date, loc: if inline-dates { it.location } else { "" }))
    sub-line(it.sub, it.date, it.location)
    if it.url != "" { block(above: line-gap, below: 0pt, meta(link(it.url, it.urlText))) }
    body-parts(it.desc, it.bullets, it.tags, it.tagsLabel)
  }
})

#let entry(it, first) = {
  if not first and D.entryDivider {
    block(above: D.entryGap * 0.5pt, below: 0pt, line(length: 100%, stroke: 0.4pt + divc))
  }
  entry-body(it, first)
}

/* ---------------- Belge ---------------- */
#header()

#if d.at("kind", default: "cv") == "letter" {
  let L = d.letter
  let gap = calc.max(D.paragraphGap * 2.4, 9) * 1pt
  set text(size: calc.max(S.body * 1.1, 10) * 1pt)
  set par(spacing: gap, leading: (D.leading + 0.12) * 1em)
  v(D.sectionGap * 1.2pt)
  line(length: 100%, stroke: 0.7pt + rulec)
  v(D.sectionGap * 0.6pt)
  if L.place != "" { align(right, meta(L.place)) }
  if L.recipient.len() > 0 { v(gap * 0.6); par(L.recipient.map(r => strong(r)).join(linebreak())) }
  if L.subject != "" { v(gap * 0.6); par(strong(L.subject)) }
  v(gap * 1.2)
  par(L.greeting)
  for p in L.paragraphs { v(gap); par(rich(p)) }
  v(gap * 1.2)
  par(L.closing)
  v(gap * 2.4)
  par(text(font: fam-head, weight: "bold", size: S.entryTitle * 1.15pt, L.signature))
} else {
  for s in d.sections {
    let sic = s.at("icon", default: "")
    heading(level: 1, if sic != "" and sic != none { [#ic(sic, size: S.heading * 1.05pt)#h(0.4em)#s.title] } else { s.title })
    if s.kind == "text" {
      for (i, p) in s.paragraphs.enumerate() { block(above: if i == 0 { 0pt } else { D.paragraphGap * 1pt }, below: 0pt, par(rich(p))) }
    } else if s.kind == "entries" {
      for (i, it) in s.items.enumerate() { entry(it, i == 0) }
    } else if s.kind == "lines" and D.linesLayout == "table" {
      grid(
        columns: (auto, 1fr),
        column-gutter: 14pt,
        row-gutter: D.bulletGap * 1pt + 3pt,
        ..s.lines.map(l => (text(weight: "bold", size: S.meta * 1pt, l.label), rich(l.value))).flatten(),
      )
    } else if s.kind == "lines" {
      for (i, l) in s.lines.enumerate() {
        block(above: if i == 0 { 0pt } else { D.bulletGap * 1pt + 1pt }, below: 0pt, {
          if l.label != "" [#strong(l.label): ]
          rich(l.value)
        })
      }
    } else if s.kind == "inline" {
      block(above: 0pt, below: 0pt, s.lines.map(l => box[#strong(l.label): #rich(l.value)]).join(text(fill: muted)[#h(0.4em)·#h(0.4em)]))
    }
  }
}
