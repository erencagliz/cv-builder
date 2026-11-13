const WORD = String.raw`[\p{L}\p{N}_]`;
const BOUNDARY = `(?:(?<=${WORD})(?!${WORD})|(?<!${WORD})(?=${WORD}))`;

export function unicodeWords(re: RegExp): RegExp {
  const source = re.source.replaceAll(String.raw`\b`, BOUNDARY).replaceAll(String.raw`\w`, WORD);
  return new RegExp(source, re.flags.includes('u') ? re.flags : `${re.flags}u`);
}
