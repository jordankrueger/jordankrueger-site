import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.argv[2];
assert.ok(base, 'Usage: node scripts/check-scroll-animations.mjs <base-url>');
const failures = [];
const check = (ok, label, values) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${ok || values === undefined ? '' : ` ${JSON.stringify(values)}`}`);
  if (!ok) failures.push(label);
};
const timer = setTimeout(() => { console.error('FAIL: scroll animation check exceeded 90s'); process.exit(1); }, 90_000);
let browser;
let step = 'launch Chromium';
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(6000);
  const visit = async route => {
    step = `load ${route}`;
    const response = await page.goto(new URL(route, base).href);
    assert.ok(response.ok(), `${route}: HTTP ${response.status()}`);
    await page.evaluate(() => document.fonts.ready);
  };
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const measure = selector => page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      name: style.animationName, timeline: style.animationTimeline,
      offset: style.strokeDashoffset, opacity: style.opacity, stroke: style.stroke,
      visible: node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && (box.width > 0 || box.height > 0),
      top: box.top, bottom: box.bottom,
    };
  }));
  await visit('/blog/');
  const blog = await page.locator('a[href^="/blog/"]').evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname).find(path => path !== '/blog/'));
  assert.ok(blog, 'No blog post link found');
  const cssFiles = new Set();
  const inspectCSS = (css, source) => {
    const bad = [...css.matchAll(/(?:^|[;{])\s*(?:-webkit-)?animation\s*:\s*([^;}]+)/gi)]
      .map(match => match[1]).filter(value => /\b(?:view|scroll)\s*\(/i.test(value));
    check(bad.length === 0, `CSS shorthand excludes timelines: ${source}`, bad.length ? bad : undefined);
  };
  for (const route of ['/', '/projects/', blog]) {
    await visit(route);
    const styles = await page.locator('style').allTextContents();
    styles.forEach((css, index) => inspectCSS(css, `${route} inline style ${index + 1}`));
    const urls = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(node => node.href));
    check(styles.length + urls.length > 0, `${route} has CSS to inspect`);
    for (const url of urls) {
      if (cssFiles.has(url)) continue;
      cssFiles.add(url);
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      assert.ok(response.ok, `${url}: HTTP ${response.status}`);
      inspectCSS(await response.text(), url);
    }
  }
  console.log(`Checked ${cssFiles.size} CSS files and all inline styles on /, /projects/, ${blog}`);
  await visit('/projects/');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await settle();
  check(await page.evaluate(() => CSS.supports('animation-timeline', 'view()')), 'Chromium supports view timelines');
  const strokes = '.icon path[fill="none"]';
  let values = await measure(strokes);
  check(values.length > 0 && values.every(value => value.name === 'draw' && value.timeline === 'view()'), 'projects strokes use draw at scroll 0', values);
  const fills = '.icon :is(circle, rect, path):not([fill="none"])';
  values = await measure(fills);
  check(values.length > 0 && values.every(value => value.name === 'grow' && value.timeline === 'view()'), 'projects filled shapes use grow', values);
  for (const [index, icon] of (await page.locator('.icon').all()).entries()) {
    await icon.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await settle();
    values = await icon.locator('path[fill="none"]').evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return { offset: style.strokeDashoffset, opacity: style.opacity, stroke: style.stroke,
        visible: node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), top: box.top, bottom: box.bottom };
    }));
    check(values.every(value => Number.parseFloat(value.offset) === 0 && value.opacity === '1' && value.stroke !== 'none' && value.visible && value.top >= 0 && value.bottom <= 900), `projects icon ${index + 1} fully drawn in view`, values);
  }
  await page.locator(strokes).evaluateAll(nodes => nodes.forEach(node => node.style.setProperty('animation-name', 'none', 'important')));
  values = await measure(strokes);
  check(values.every(value => Number.parseFloat(value.offset) === 0 && value.visible), 'projects strokes fail visible with animations disabled', values);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit('/projects/');
  values = await measure(`${strokes}, ${fills}`);
  check(values.length > 0 && values.every(value => value.name === 'none' && Number.parseFloat(value.offset) === 0 && value.opacity === '1' && value.visible), 'reduced motion: no animations and drawings complete', values);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visit('/');
  for (const [selector, name] of [['.d-line', 'wipe'], ['.d-leaf', 'unfurl']]) {
    values = await measure(selector);
    check(values.length > 0 && values.every(value => value.name === name && value.timeline === 'view()'), `homepage ${selector} uses ${name}`, values);
  }
  await visit(blog);
  values = await measure('.read-progress');
  check(values.length === 1 && values[0].name === 'read-fill' && values[0].timeline.startsWith('scroll('), 'blog reading progress animation applied', values);
  await page.locator('.read-progress').evaluate(node => node.style.setProperty('animation-name', 'none', 'important'));
  const transform = await page.locator('.read-progress').evaluate(node => getComputedStyle(node).transform);
  check(transform === 'none', 'blog progress fails visible with animation disabled', { transform });
  assert.equal(failures.length, 0, `${failures.length} scroll animation checks failed`);
  console.log(`PASS: scroll animations on ${base} (Chromium ${browser.version()}, 1440x900)`);
} catch (error) {
  console.error(`FAIL: ${step}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  clearTimeout(timer);
}
