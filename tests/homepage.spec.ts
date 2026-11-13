import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8766';

/**
 * Homepage regression spec for the v2 design system (2026-11-13).
 *
 * Scope: the homepage only. KidLaunch has its own spec — project pages must
 * not be guarded from here, and homepage concerns must not leak into that one.
 */
test.describe('IdeaFactory homepage', () => {

  test('loads with the new title and no theme picker', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Father and son/);
    // v2 removed the 5-theme colour picker by design.
    await expect(page.locator('#theme-toggle')).toHaveCount(0);
    await expect(page.locator('[data-theme]')).toHaveCount(0);
  });

  test('hero shows real product screenshots that actually load', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const shots = page.locator('.hero-visual img');
    await expect(shots).toHaveCount(2);

    // naturalWidth > 0 proves the browser decoded the image, not just
    // that the tag exists. A 404 renders as a broken box with width 0.
    const dims = await shots.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.map(i => ({ src: i.getAttribute('src'), nw: i.naturalWidth, nh: i.naturalHeight }))
    );
    for (const d of dims) {
      expect(d.nw, `${d.src} failed to load`).toBeGreaterThan(0);
      expect(d.nh).toBeGreaterThan(0);
    }
  });

  test('landscape card screenshots keep their natural aspect ratio', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const img = page.locator('.feature-card-shot img');
    await expect(img).toHaveCount(1);

    const m = await img.evaluate((i: HTMLImageElement) => {
      const b = i.getBoundingClientRect();
      return {
        displayed: b.width / b.height,
        natural: i.naturalWidth / i.naturalHeight,
        nw: i.naturalWidth,
      };
    });
    expect(m.nw).toBeGreaterThan(0);
    // If a landscape crop is ever forced into a portrait frame this
    // diverges hard (1.29 vs 0.46) — catch it here rather than by eye.
    expect(Math.abs(m.displayed - m.natural)).toBeLessThan(0.05);
  });

  test('all four products render with a working CTA', async ({ page }) => {
    await page.goto(`${BASE}/`);

    // Reveal-on-scroll keeps cards at opacity 0 until observed.
    await page.locator('.products-grid').scrollIntoViewIfNeeded();

    await expect(page.locator('.products-feature')).toHaveCount(1);
    await expect(page.locator('.products-grid .product-card')).toHaveCount(3);

    for (const name of ['GainCut', 'PawMind', 'Art of War AI', 'KidLaunch']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }

    await expect(page.locator('#cta-gaincut-home')).toHaveAttribute(
      'href', /apps\.apple\.com.*gaincut/
    );
  });

  test('reveal animation resolves to fully visible', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const card = page.locator('.products-grid .product-card').first();
    await card.scrollIntoViewIfNeeded();

    // Wait for the transition to settle, then assert it is actually visible.
    await expect(card).toBeVisible();
    await page.waitForFunction(() => {
      const el = document.querySelector('.products-grid .product-card');
      return el && parseFloat(getComputedStyle(el).opacity) > 0.95;
    }, null, { timeout: 4000 });
  });

  test('no horizontal overflow on desktop', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('mobile: layout stacks and menu toggles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Hamburger visible, links hidden until tapped.
    const toggle = page.locator('#nav-toggle');
    await expect(toggle).toBeVisible();
    const links = page.locator('#nav-links');
    await expect(links).not.toHaveClass(/is-open/);
    await toggle.click();
    await expect(links).toHaveClass(/is-open/);

    // Product grid must be one column on mobile.
    const cols = await page.locator('.products-grid').evaluate(
      el => getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(1);
  });

  test('GA4 and UTM tagging present (referral is measurable)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const html = await page.content();
    expect(html).toContain('G-QF4NXDNN3P');
    expect(html).toContain('utm_source=ideafactory');
  });

  test('designed posters are restored and the card row stays level', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('.products-grid').scrollIntoViewIfNeeded();

    const posters = page.locator('.product-poster img');
    await expect(posters).toHaveCount(3); // PawMind, Art of War, KidLaunch guardian

    const dims = await posters.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.map(i => ({ src: i.getAttribute('src'), nw: i.naturalWidth }))
    );
    for (const d of dims) {
      expect(d.nw, `${d.src} failed to load`).toBeGreaterThan(0);
    }

    // All three poster slots must be the same height, or the row looks
    // broken (this actually happened — KidLaunch had no slot at all).
    const heights = await page.locator('.product-poster').evaluateAll(
      els => els.map(e => Math.round(e.getBoundingClientRect().height))
    );
    expect(new Set(heights).size, `poster heights differ: ${heights}`).toBe(1);

    // ...and the cards themselves must bottom out together.
    const cardHeights = await page.locator('.products-grid .product-card').evaluateAll(
      els => els.map(e => Math.round(e.getBoundingClientRect().height))
    );
    const maxH = Math.max(...cardHeights);
    const minH = Math.min(...cardHeights);
    expect(maxH - minH, `card heights differ: ${cardHeights}`).toBeLessThan(3);
  });

  test('hero entrance animations actually run then settle', async ({ page }) => {
    await page.goto(`${BASE}/`);

    const front = page.locator('.phone--front');
    const anim = await front.evaluate(el => {
      const s = getComputedStyle(el);
      return { name: s.animationName, duration: s.animationDuration };
    });
    expect(anim.name).toContain('phone-in');
    expect(anim.duration).not.toBe('0s');

    // After the animation finishes the phone must be fully opaque — a
    // stuck `both` fill at opacity 0 would hide the product entirely.
    await page.waitForTimeout(1600);
    const opacity = await front.evaluate(el => parseFloat(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.9);
  });

  test('reduced motion disables infinite loops and reveals everything', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);

    // The glow and the drifting screenshot must be switched off, not merely
    // shortened — both are infinite and would otherwise animate forever.
    const glow = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.hero')!, '::before').animationName
    );
    expect(glow).toBe('none');

    const drift = await page.locator('.feature-card-shot img').evaluate(
      el => getComputedStyle(el).animationName
    );
    expect(drift).toBe('none');

    // Reveal blocks must be visible immediately, without scrolling.
    const opacity = await page.locator('.products-grid .product-card').first().evaluate(
      el => parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBeGreaterThan(0.9);

    await ctx.close();
  });
});
