// scripts/check-contrast.mjs
// Reads :root tokens from src/styles/global.css and checks WCAG contrast for
// the text/background pairs the site actually uses. Exit 1 on any failure.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens = Object.fromEntries(
  [...root.matchAll(/--(color-[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]])
);

function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every text color the site uses, checked on every background it can sit on
// (cross product, so a pair can't be missed), plus the few fixed pairs.
// 4.5:1 is the WCAG AA minimum for body text.
const textTokens = [
  'color-text', 'color-text-light', 'color-text-logo', 'color-accent',
  'color-accent-hover', 'color-sun-text', 'color-panel', 'color-success', 'color-error',
];
const backgrounds = [
  'color-bg', 'color-bg-white', 'color-bg-green', 'color-bg-warm', 'color-bg-blue', 'color-bg-peach',
];
const pairs = [
  ...textTokens.flatMap(fg => backgrounds.map(bg => [fg, bg, 4.5])),
  ['color-on-accent', 'color-accent', 4.5],
  ['color-on-accent', 'color-accent-hover', 4.5],
  ['color-code-text', 'color-code-bg', 4.5],
];

let failed = 0;
for (const [fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) {
    console.log(`MISSING  ${fg} on ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'ok      ' : 'FAIL    '}${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}): ${r.toFixed(2)} (needs ${min})`);
}
process.exit(failed ? 1 : 0);
