import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const { chromium, webkit } = createRequire(import.meta.url)('playwright');
const base = process.argv[2];
assert.ok(base, 'Usage: node scripts/check-header.mjs <base-url>');
const hrefs = ['/projects', '/projects/movement', '/projects/starbase-118', '/projects/personal', '/ai', '/tools'];
const labels = ['All projects', 'Movement work', 'StarBase 118', 'Personal tools', 'Built with AI', 'Tools for progressives'];
const timer = setTimeout(() => { console.error('FAIL: header check exceeded 120s'); process.exit(1); }, 120_000);
let browser;
let webkitBrowser;
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
  const checkPinning = async (pinPage, engine) => {
    step = `${engine}: hover-open click pins with focus outside; second click closes`;
    await pinPage.mouse.move(10, 200);
    await pinPage.goto(base);
    const pinButton = pinPage.locator('.nav-group-btn');
    const pinPanel = pinPage.locator('#projects-menu');
    await pinButton.hover();
    if (engine === 'Chromium') {
      // Preserve outside focus like WebKit does, so focus cannot mask a missing pin guard.
      await pinButton.evaluate(node => node.addEventListener('mousedown', event => event.preventDefault(), { once: true }));
    }
    await pinButton.click();
    assert.ok(await pinPage.locator('body').evaluate(node => node === document.activeElement), 'pinning must be tested with focus outside the group');
    await pinPage.mouse.move(10, 200);
    await pinPage.waitForTimeout(220);
    assert.equal(await pinButton.getAttribute('aria-expanded'), 'true', 'pinned menu must stay open after pointer leave with outside focus');
    await pinPanel.waitFor({ state: 'visible' });
    await pinButton.click();
    assert.equal(await pinButton.getAttribute('aria-expanded'), 'false');
    await pinPanel.waitFor({ state: 'hidden' });
    console.log(`PASS: ${step}`);
  };
  const checkPointerClicks = async (clickPage, engine) => {
    const clickButton = clickPage.locator('.nav-group-btn');
    const clickPanel = clickPage.locator('#projects-menu');
    // macOS WebKit's default keyboard settings include links with Option-Tab.
    const tabKey = engine === 'WebKit' ? 'Alt+Tab' : 'Tab';
    step = `${engine}: keyboard-open then click All projects navigates`;
    await clickPage.mouse.move(10, 200);
    await clickPage.goto(base);
    await clickButton.focus();
    await clickPage.keyboard.press('Enter');
    assert.equal(await clickButton.getAttribute('aria-expanded'), 'true');
    await clickPanel.locator('a[href="/projects"]').click();
    await clickPage.waitForURL(url => /^\/projects\/?$/.test(url.pathname), { timeout: 4000 });
    console.log(`PASS: ${step}`);

    step = `${engine}: keyboard-open, Tab to child, then click Projects closes`;
    await clickPage.mouse.move(10, 200);
    await clickPage.goto(base);
    await clickButton.focus();
    await clickPage.keyboard.press('Enter');
    assert.equal(await clickButton.getAttribute('aria-expanded'), 'true');
    await clickPage.keyboard.press(tabKey);
    assert.equal(await clickPage.locator(':focus').getAttribute('href'), '/projects');
    await clickButton.click();
    assert.equal(await clickButton.getAttribute('aria-expanded'), 'false', 'click from a focused child must close the pinned menu');
    await clickPanel.waitFor({ state: 'hidden' });
    console.log(`PASS: ${step}`);

    step = `${engine}: focus leaving after a completed pointer press still closes`;
    await clickPage.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
    await clickButton.focus();
    await clickPage.keyboard.press('Enter');
    await clickPanel.locator('a').last().focus();
    await clickPage.keyboard.press(tabKey);
    assert.equal(await clickPage.locator(':focus').getAttribute('href'), '/about');
    assert.equal(await clickButton.getAttribute('aria-expanded'), 'false');
    await clickPanel.waitFor({ state: 'hidden' });
    console.log(`PASS: ${step}`);
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

  step = 'hover-open Escape closes while focus stays on body';
  await reset();
  assert.ok(await page.locator('body').evaluate(node => node === document.activeElement));
  await button.hover();
  await expanded(true);
  await page.keyboard.press('Escape');
  await expanded(false);
  assert.ok(await page.locator('body').evaluate(node => node === document.activeElement), 'Escape must not steal outside focus');
  console.log(`PASS: ${step}`);

  await button.click();
  step = 'Escape from a child restores button focus while pointer remains over button';
  await links.first().focus();
  assert.equal(await page.locator(':focus').getAttribute('href'), '/projects');
  await page.keyboard.press('Escape');
  await expanded(false);
  assert.ok(await button.evaluate(node => node === document.activeElement && node.matches(':hover')), 'Escape must restore focus from the child to the button');
  await page.waitForTimeout(220);
  await expanded(false);
  console.log(`PASS: ${step}`);

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

  await checkPinning(page, 'Chromium');

  step = 'outside click closes a pinned menu with focus already outside';
  await reset();
  await button.hover();
  // Keep focus outside so this case exercises the document click handler alone.
  await button.evaluate(node => node.addEventListener('mousedown', event => event.preventDefault(), { once: true }));
  await button.click();
  await away();
  await page.waitForTimeout(220);
  assert.ok(await page.locator('body').evaluate(node => node === document.activeElement));
  await expanded(true);
  await page.locator('main').click({ position: { x: 10, y: 100 } });
  await expanded(false);
  console.log(`PASS: ${step}`);
  await external(page.locator('.desktop-nav'));
  await checkPointerClicks(page, 'Chromium');

  step = '1440x250 desktop can Tab to Tools for progressives inside the viewport';
  await page.setViewportSize({ width: 1440, height: 250 });
  await reset();
  await button.focus();
  await page.keyboard.press('Enter');
  for (let index = 0; index < 6; index++) await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'), '/tools');
  assert.ok(await links.last().evaluate(node => {
    const box = node.getBoundingClientRect();
    return box.top >= 64 && box.bottom <= innerHeight;
  }), 'focused Tools link must fit below the sticky header and above the viewport bottom');
  console.log(`PASS: ${step}`);
  await page.setViewportSize({ width: 1440, height: 900 });

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
  step = 'without JavaScript, Projects omits a stale aria-expanded state';
  assert.equal(await fallback.locator('.nav-group-btn').getAttribute('aria-expanded'), null, 'CSS disclosure must not announce a static collapsed state');
  console.log(`PASS: ${step}`);
  step = 'without JavaScript, hover and Tab focus open Projects';
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

  step = 'reduced motion gives all desktop, dropdown and mobile header links a 0s transition';
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const reducedPage = await reduced.newPage();
  reducedPage.setDefaultTimeout(4000);
  await reducedPage.goto(base);
  await reducedPage.locator('.nav-group-btn').click();
  for (const width of [1440, 390]) {
    await reducedPage.setViewportSize({ width, height: 600 });
    if (width === 390) await reducedPage.locator('.mobile-menu-btn').click();
    const transitions = await reducedPage.locator('.site-header a').evaluateAll(nodes => nodes.map(node => ({
      label: node.textContent.trim(), duration: getComputedStyle(node).transitionDuration,
    })));
    for (const { label, duration } of transitions) assert.equal(duration, '0s', `${width}px ${label} must have no reduced-motion transition`);
  }
  await reduced.close();
  console.log(`PASS: ${step}`);

  step = 'launch WebKit for native pinning behavior';
  if (existsSync(webkit.executablePath())) {
    webkitBrowser = await webkit.launch({ headless: true });
    const webkitPage = await webkitBrowser.newPage({ viewport: { width: 1440, height: 900 } });
    webkitPage.setDefaultTimeout(4000);
    await checkPinning(webkitPage, 'WebKit');
    await checkPointerClicks(webkitPage, 'WebKit');
  } else {
    console.log(`SKIP: installed WebKit does not match Playwright; expected ${webkit.executablePath()}`);
  }

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
  await webkitBrowser?.close();
  await browser?.close();
  clearTimeout(timer);
}
