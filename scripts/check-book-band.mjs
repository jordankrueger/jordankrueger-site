import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.argv[2];
assert(base, 'Usage: node scripts/check-book-band.mjs <base-url>');

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [width, height] of [[1440, 900], [390, 844], [768, 900]]) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(new URL('/', base).href);
    assert(response.ok(), `Homepage returned ${response.status()}`);
    const band = page.locator('.book-band');
    assert.equal(await band.count(), 1, `${width}: .book-band missing`);
    assert(await page.evaluate(() => {
      const band = document.querySelector('.book-band');
      return Boolean(document.querySelector('.practices-band').compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING)
        && Boolean(band.compareDocumentPosition(document.querySelector('.about-panel')) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), `${width}: book band must follow practices and precede About`);
    assert.equal(await band.locator('h2').innerText(), 'I wrote a picture book');
    for (const [selector, href, label] of [
      ['.btn-primary', 'https://www.amazon.com/dp/B0HQC2G2CF', 'Buy the paperback, $12.99'],
      ['.btn-outline', 'https://wheretheroadsusedtobe.com/', "Visit the book's site"],
    ]) {
      const link = band.locator(selector);
      assert.equal(await link.getAttribute('href'), href);
      assert.equal(await link.innerText(), label);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert((await link.getAttribute('rel')).split(/\s+/).includes('noopener'));
    }
    const cover = band.locator('img');
    await cover.scrollIntoViewIfNeeded();
    await cover.evaluate(img => img.decode());
    assert(await cover.evaluate(img => img.naturalWidth > 0), `${width}: cover did not load`);
    if (width === 768) {
      assert((await cover.boundingBox()).width <= 260, '768: cover exceeds 260px');
    }
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.book-band .fade-up')).opacity === '1');
    await band.screenshot({ path: `/tmp/book-band-${width}.png` });
    console.log(`PASS ${width}: order, copy, links, loaded cover; screenshot /tmp/book-band-${width}.png`);
  }
  const response = await page.goto(new URL('/projects/movement', base).href);
  assert(response.ok(), `Movement projects returned ${response.status()}`);
  const title = page.getByRole('heading', { name: 'Where the Roads Used to Be', exact: true });
  await title.scrollIntoViewIfNeeded();
  assert(await title.isVisible(), 'Movement projects book title missing');
  console.log(`PASS Movement projects book entry. Checked ${base}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
