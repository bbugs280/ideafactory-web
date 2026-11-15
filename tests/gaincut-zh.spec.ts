import { test, expect } from '@playwright/test';

/**
 * Cantonese product page — /gaincut/zh/
 *
 * Added 2026-11-15. Purpose: the ZH page is a SECOND copy of a page whose
 * claims are regulated by nothing but honesty, so the things that can silently
 * rot are the facts, not the layout. These tests pin the facts and the
 * language wiring rather than the presentation.
 *
 * ⚠️ The font test exists because of a measured near-miss: with `Inter` listed
 * before `Noto Sans TC`, every CJK face stayed `status: unloaded` and the page
 * still LOOKED perfect on macOS (PingFang HK filled in) while being broken for
 * any Windows visitor. Visual inspection cannot catch that. Only
 * `document.fonts.check` can.
 */

const ZH = '/gaincut/zh/';
const EN = '/gaincut/';

test.describe('GainCut Cantonese page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ZH);
  });

  test('renders in Traditional Chinese and declares the right lang', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('zh-Hant-HK');
  });

  test('CJK webfont actually loads, not just the system fallback', async ({ page }) => {
    // The regression this guards: Inter-first font stack leaves Noto Sans TC
    // unloaded, which is invisible on macOS and broken on Windows.
    const ok = await page.evaluate(() => document.fonts.check('16px "Noto Sans TC"'));
    expect(ok, 'Noto Sans TC must be loaded — an unloaded CJK face renders as tofu off-macOS').toBe(
      true,
    );

    const firstFamily = await page.evaluate(() => {
      const h1 = document.querySelector('.hero-title');
      return h1 ? getComputedStyle(h1).fontFamily.split(',')[0].replace(/["']/g, '') : '';
    });
    expect(firstFamily, 'CJK face must lead the font stack, not trail it').toBe('Noto Sans TC');
  });

  test('no tofu: every Cantonese-only character resolves to a glyph', async ({ page }) => {
    // Cantonese particles are the characters most likely to be missing from a
    // Simplified-oriented CJK font. If any of these render as a box the page is
    // unreadable to its actual audience.
    const widths = await page.evaluate(() => {
      const probe = ['嘅', '係', '唔', '咗', '喺', '嘢', '嚟', '嗰', '乜', '瞓'];
      const c = document.createElement('canvas').getContext('2d')!;
      c.font = '16px "Noto Sans TC"';
      const tofu = c.measureText('\uFFFF').width;
      return probe.map((ch) => ({ ch, w: c.measureText(ch).width, tofu }));
    });
    for (const { ch, w, tofu } of widths) {
      expect(w, `character ${ch} measures ${w}px — same as a missing glyph (${tofu}px)`).not.toBe(
        tofu,
      );
    }
  });

  test('hreflang pairs both language versions both ways', async ({ page }) => {
    const alts = await page.$$eval('link[rel="alternate"][hreflang]', (els) =>
      els.map((e) => ({
        hreflang: e.getAttribute('hreflang'),
        href: e.getAttribute('href'),
      })),
    );
    const byLang = Object.fromEntries(alts.map((a) => [a.hreflang!, a.href!]));
    expect(byLang['en']).toContain('/gaincut/');
    expect(byLang['zh-Hant-HK']).toContain('/gaincut/zh/');
    expect(byLang['x-default']).toContain('/gaincut/');
  });

  test('English page declares the reciprocal hreflang', async ({ page }) => {
    await page.goto(EN);
    const alt = await page.getAttribute('link[hreflang="zh-Hant-HK"]', 'href');
    expect(alt).toContain('/gaincut/zh/');
  });

  test('language switch fires a lang_switch event and links to the twin page', async ({ page }) => {
    const href = await page.getAttribute('a[data-ga="lang_switch"]', 'href');
    expect(href, 'switch must point at the English page').toMatch(/^\.\.\/$|^\/gaincut\/$/);

    const fired = await page.evaluate(() => {
      const out: string[] = [];
      (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (
        ...args: unknown[]
      ) => out.push(String(args[1]));
      const a = document.querySelector('a[data-ga="lang_switch"]') as HTMLAnchorElement;
      a.addEventListener('click', (e) => e.preventDefault());
      a.click();
      return out;
    });
    expect(fired).toContain('lang_switch');
  });

  test('language switch is reachable from the nav, not only the footer', async ({ page }) => {
    // Vincent could not find it on a nine-section page when it was footer-only.
    const navSwitch = page.locator('.nav-links a[data-ga="lang_switch"]');
    await expect(navSwitch, 'the switch must be visible in the top nav').toBeVisible();
    await expect(navSwitch).toHaveText(/EN|English/);
  });

  test('App Store badge reads naturally in Chinese — no stray locative particle', async ({ page }) => {
    // The badge originally read "喺 App Store 下載". 喺 is a locative particle
    // ("at"), so that string parses as "at App Store download" — not something
    // a Chinese speaker writes. Apple's English "Download on the" has no direct
    // Chinese equivalent here; the badge should just be "App Store 下載".
    const smalls = await page.$$eval('a.store-badge small', (els) =>
      els.map((e) => e.textContent?.trim() || ''),
    );
    expect(smalls.length).toBeGreaterThan(0);
    for (const text of smalls) {
      expect(text, `badge sub-label "${text}" must not open with 喺`).not.toMatch(/^喺/);
      expect(text).toBe('App Store 下載');
    }
  });

  test('pricing matches the StoreKit config, not an invented number', async ({ page }) => {
    const body = await page.locator('body').innerText();
    // Source of truth: ios/GainCut/Resources/GainCut.storekit
    expect(body).toContain('US$1.99');
    expect(body).toContain('US$14.99');
    // Free tier is 30 scans a month — must appear in ZH too.
    expect(body).toContain('30');
    // Savings claim ceiling. 45% is the HKD figure and the honest maximum;
    // 37% is the USD figure and must not be re-introduced.
    expect(body).toContain('45%');
    expect(body).not.toContain('37%');
  });

  test('App Store links keep their UTM tags and ZH marker', async ({ page }) => {
    const hrefs = await page.$$eval('a.store-badge', (els) =>
      els.map((e) => e.getAttribute('href') || ''),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      expect(h).toContain('apps.apple.com');
      expect(h).toContain('utm_source=ideafactory');
      expect(h, 'ZH page traffic must be separable from EN').toContain('utm_content=zh');
    }
  });

  test('the honesty section survives translation', async ({ page }) => {
    // The "what it does not do" table is the trust anchor. If a translator
    // ever trims it, the page silently becomes marketing instead of fact.
    const rows = await page.locator('#limits .spec-table tr').count();
    expect(rows, 'the limits table must keep all five rows').toBe(5);
    const limits = await page.locator('#limits').innerText();
    expect(limits).toContain('唔係醫療儀器');
  });

  test('all seven FAQ items are present and open', async ({ page }) => {
    const items = page.locator('.faq-item');
    await expect(items).toHaveCount(7);
    await items.first().locator('summary').click();
    await expect(items.first()).toHaveAttribute('open', '');
  });

  test('no horizontal overflow on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `page overflows by ${overflow}px at 390px wide`).toBeLessThanOrEqual(1);
  });

  test('canonical points at the ZH URL, not the English one', async ({ page }) => {
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toContain('/gaincut/zh/');
  });
});
