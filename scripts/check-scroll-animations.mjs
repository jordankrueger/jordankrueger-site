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
  const measure = selector => (typeof selector === 'string' ? page.locator(selector) : selector).evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      name: style.animationName, timeline: style.animationTimeline,
      animations: node.getAnimations().map(animation => ({
        css: animation instanceof CSSAnimation, name: animation.animationName,
        state: animation.playState,
        timeline: animation.timeline?.constructor.name,
        parent: animation.timeline instanceof ViewTimeline && animation.timeline.subject === node.ownerSVGElement,
      })),
      clip: style.clipPath, transform: style.transform,
      scaleX: new DOMMatrixReadOnly(style.transform).a,
      offset: style.strokeDashoffset, opacity: style.opacity, stroke: style.stroke,
      visible: node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && (box.width > 0 || box.height > 0),
      top: box.top, bottom: box.bottom,
    };
  }));
  const running = async (selector, name, timeline, label, parent = false) => {
    const values = await measure(selector);
    check(values.length > 0 && values.every(value => value.animations.some(animation =>
      animation.css && animation.name === name && animation.state === 'running'
      && animation.timeline === timeline && (!parent || animation.parent))), label, values.map(value => value.animations));
  };
  const enter = async (subject, fraction) => {
    await subject.evaluate((node, fraction) => {
      const { top, height } = node.getBoundingClientRect();
      const timeline = node.getAnimations()[0]?.timeline;
      // SVG timeline bounds include stroke geometry; the painted box can also be scaled.
      const target = timeline instanceof ViewTimeline
        ? timeline.startOffset.value + (timeline.endOffset.value - timeline.startOffset.value - innerHeight) * fraction
        : scrollY + top + height * fraction - innerHeight;
      scrollTo({ top: target, behavior: 'instant' });
    }, fraction);
    await settle();
  };
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
  // A short viewport lets even the first drawing enter from below without changing the page.
  await page.setViewportSize({ width: 1440, height: 200 });
  await visit('/projects/');
  await settle();
  await running(fills, 'grow', 'ViewTimeline', 'projects fills have running grow CSS animations on ViewTimeline');
  for (const [index, node] of (await page.locator(strokes).all()).entries()) {
    await enter(node, 0.5);
    await running(node, 'draw', 'ViewTimeline', `projects draw ${index + 1} has a running CSS animation on ViewTimeline`);
    const before = (await measure(node))[0];
    await node.evaluate(node => node.ownerSVGElement.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await settle();
    const after = (await measure(node))[0];
    check(Number.parseFloat(before.offset) > 0 && Number.parseFloat(before.offset) < 1 && Number.parseFloat(after.offset) === 0,
      `projects offset ${index + 1} changes during entry and ends complete`, { before: before.offset, after: after.offset });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(strokes).evaluateAll(nodes => nodes.forEach(node => node.style.setProperty('animation-name', 'none', 'important')));
  values = await measure(strokes);
  check(values.every(value => Number.parseFloat(value.offset) === 0 && value.visible), 'projects strokes fail visible with animations disabled', values);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit('/projects/');
  values = await measure(`${strokes}, ${fills}`);
  check(values.length > 0 && values.every(value => value.name === 'none' && Number.parseFloat(value.offset) === 0 && value.opacity === '1' && value.visible), 'reduced motion: no animations and drawings complete', values);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    // Reload before each divider so an earlier scroll cannot prime its leaf.
    await visit('/');
    const dividers = await page.locator('.circuit-divider').count();
    for (let index = 0; index < dividers; index++) {
      await visit('/');
      const divider = page.locator('.circuit-divider').nth(index);
      await divider.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await settle();
      values = await divider.locator('.d-leaf').evaluateAll(nodes => nodes.map(node => ({
        opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform,
      })));
      check(values.length === 1 && values[0].opacity === '1', `${width}: homepage divider ${index + 1} leaf visible at viewport center`, values);
      await page.setViewportSize({ width, height: 200 });
      for (const [selector, name, fraction] of [['.d-line', 'wipe', 0.4], ['.d-leaf', 'unfurl', 0.9]]) {
        await enter(divider, fraction);
        await running(divider.locator(selector), name, 'ViewTimeline', `${width}: divider ${index + 1} ${name} has a running CSS animation on parent ViewTimeline`, true);
        const before = await divider.locator(selector).evaluate(node => {
          const style = getComputedStyle(node);
          return { clip: style.clipPath, opacity: style.opacity, unscaled: new DOMMatrixReadOnly(style.transform).isIdentity };
        });
        await divider.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await settle();
        const after = await divider.locator(selector).evaluate(node => {
          const style = getComputedStyle(node);
          return { clip: style.clipPath, opacity: style.opacity, unscaled: new DOMMatrixReadOnly(style.transform).isIdentity };
        });
        const complete = selector === '.d-line'
          ? before.clip !== after.clip && /^inset\(-10px(?: calc\(0% - 10px\) -10px -10px)?\)$/.test(after.clip)
          : Number(before.opacity) < 1 && after.opacity === '1' && !before.unscaled && after.unscaled;
        check(complete, `${width}: divider ${index + 1} ${name} changes during entry and ends complete`, { before, after });
      }
      await page.setViewportSize({ width, height });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit('/');
  for (const [selector, name] of [['.d-line', 'wipe'], ['.d-leaf', 'unfurl']]) {
    values = await measure(selector);
    check(values.length > 0 && values.every(value => value.name === name && value.timeline === '--divider'), `homepage ${selector} uses ${name} on --divider`, values);
  }
  await visit(blog);
  values = await measure('.read-progress');
  check(values.length === 1 && values[0].name === 'read-fill' && values[0].timeline.startsWith('scroll('), 'blog reading progress animation applied', values);
  await running('.read-progress', 'read-fill', 'ScrollTimeline', 'blog bar has a running read-fill CSS animation on ScrollTimeline');
  await page.evaluate(() => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * 0.25, behavior: 'instant' }));
  await settle();
  const partial = (await measure('.read-progress'))[0].scaleX;
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await settle();
  const full = (await measure('.read-progress'))[0].scaleX;
  check(partial > 0 && partial < 1 && full === 1, 'blog scaleX changes with scroll and ends complete', { partial, full });
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
