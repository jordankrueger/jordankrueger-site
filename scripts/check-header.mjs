import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.argv[2];
assert.ok(base, 'Usage: node scripts/check-header.mjs <base-url>');
const hrefs = ['/projects', '/projects/movement', '/projects/starbase-118', '/projects/personal', '/ai', '/tools'];
const labels = ['All projects', 'Movement work', 'StarBase 118', 'Personal tools', 'Built with AI', 'Tools for progressives'];
const timer = setTimeout(() => { console.error('FAIL: header check exceeded 120s'); process.exit(1); }, 120_000);
let browser;
let step = 'launch Chromium';

try {
  console.log(`Testing ${base}`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(4000);
  const button = page.locator('.nav-group-btn');
  const panel = page.locator('#projects-menu');
  const links = panel.locator('a');
  const away = () => page.mouse.move(10, 200);
  const reset = async () => { await away(); await page.goto(base); };
  const expanded = async (value) => {
    assert.equal(await button.getAttribute('aria-expanded'), String(value), step);
    await panel.waitFor({ state: value ? 'visible' : 'hidden' });
  };
  const external = async (nav) => {
    const link = nav.locator('a[href="https://campaign.help"]');
    assert.equal(await link.locator('svg.ext-icon[aria-hidden="true"]').count(), 1);
    assert.equal((await link.locator('.sr-only').textContent()).trim(), '(opens in a new tab)');
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.ok((await link.getAttribute('rel')).split(/\s+/).includes('noopener'));
  };

  step = 'top bar contains Blog, Projects, About, CampaignHelp';
  await reset();
  assert.deepEqual(await page.locator('.desktop-nav > a, .desktop-nav > .nav-group > button').evaluateAll(nodes => nodes.map(node => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('svg, .sr-only').forEach(child => child.remove());
    return copy.textContent.trim();
  })), ['Blog', 'Projects', 'About', 'CampaignHelp']);

  step = 'click opens six exact project links';
  await button.click();
  await expanded(true);
  assert.deepEqual(await links.allTextContents(), labels);
  assert.deepEqual(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), hrefs);
  for (const link of await links.all()) assert.ok(await link.isVisible());

  step = 'Escape closes with focus on button while pointer remains over button';
  await page.keyboard.press('Escape');
  await expanded(false);
  assert.ok(await button.evaluate(node => node === document.activeElement && node.matches(':hover')));
  await page.waitForTimeout(220);
  await expanded(false);

  step = 'hover opens and pointer leave closes';
  await reset();
  await button.hover();
  await expanded(true);
  await away();
  await page.waitForTimeout(220);
  await expanded(false);

  step = 'focus inside preserves menu after pointer leave; Tab past last link closes';
  await button.hover();
  await links.first().focus();
  await away();
  await page.waitForTimeout(220);
  await expanded(true);
  await links.last().focus();
  await page.keyboard.press('Tab');
  await expanded(false);
  assert.equal(await page.locator(':focus').getAttribute('href'), '/about');

  step = 'hover-open click pins; second click closes';
  await reset();
  await button.hover();
  await button.click();
  await away();
  await page.waitForTimeout(220);
  await expanded(true);
  await button.click();
  await expanded(false);

  step = 'outside click closes';
  await button.click();
  await page.locator('main').click({ position: { x: 10, y: 100 } });
  await expanded(false);
  await external(page.locator('.desktop-nav'));

  step = 'AI route marks Projects and Built with AI current';
  await page.goto(new URL('/ai', base).href);
  assert.ok((await button.getAttribute('class')).split(/\s+/).includes('active'));
  assert.equal(await panel.locator('a[href="/ai"]').getAttribute('aria-current'), 'page');
  await button.click();
  await page.screenshot({ path: '/tmp/header-desktop.png' });

  step = 'without JavaScript, hover and Tab focus open Projects';
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const fallback = await noJS.newPage();
  fallback.setDefaultTimeout(4000);
  await fallback.goto(base);
  const fallbackPanel = fallback.locator('#projects-menu');
  await fallbackPanel.waitFor({ state: 'hidden' });
  await fallback.locator('.nav-group-btn').hover();
  await fallbackPanel.waitFor({ state: 'visible' });
  await fallback.mouse.move(10, 200);
  await fallbackPanel.waitFor({ state: 'hidden' });
  await fallback.locator('.desktop-nav > a[href="/blog"]').focus();
  await fallback.keyboard.press('Tab');
  await fallbackPanel.waitFor({ state: 'visible' });
  await fallback.keyboard.press('Tab');
  assert.equal(await fallback.locator(':focus').getAttribute('href'), '/projects');
  await noJS.close();

  step = '390x600 mobile lists six children and scrolls to clickable Subscribe';
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto(base);
  await page.locator('.mobile-menu-btn').click();
  const mobile = page.locator('.mobile-nav');
  assert.deepEqual(await mobile.locator('.mobile-nav-group a').allTextContents(), labels);
  assert.deepEqual(await mobile.locator('.mobile-nav-group a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), hrefs);
  for (const link of await mobile.locator('.mobile-nav-group a').all()) assert.ok(await link.isVisible());
  await external(mobile);
  const subscribe = mobile.getByRole('link', { name: 'Subscribe', exact: true });
  await subscribe.scrollIntoViewIfNeeded();
  assert.ok(await subscribe.evaluate(node => {
    const box = node.getBoundingClientRect();
    return box.top >= 64 && box.bottom <= innerHeight;
  }));
  await page.screenshot({ path: '/tmp/header-mobile.png' });
  await subscribe.click();
  await page.waitForURL(url => url.hash === '#subscribe');
  assert.equal(await page.locator('.mobile-nav-overlay').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('body').evaluate(node => node.style.overflow), '');
  console.log('PASS: desktop disclosure, Escape, hover, focus, pinning, outside click, active route, no-JS fallback, mobile scroll/Subscribe, external arrows');
  console.log('Screenshots: /tmp/header-desktop.png /tmp/header-mobile.png');
} catch (error) {
  console.error(`FAIL: ${step}\n${error.stack}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  await browser?.close();
}
