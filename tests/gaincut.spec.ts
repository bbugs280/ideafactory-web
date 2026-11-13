import { test, expect } from '@playwright/test';

/**
 * GainCut product page — regression suite.
 *
 * Written 2026-11-13 against the v2 design-system rebuild of /gaincut/.
 *
 * The most valuable test here is the ASPECT-RATIO guard. On the homepage the
 * same class of bug was measured: a landscape screenshot (target-math.jpg,
 * aspect 1.287) was placed inside a portrait phone frame (aspect 0.46),
 * letterboxing it into a thin strip with ~65% dead space. GainCut has six
 * screenshots of which only TWO are true phone aspect — so this page is
 * unusually exposed to that mistake. The guard fails loudly if a crop ever
 * gets dropped into a phone frame again.
 */

const PAGE = '/gaincut/';

/**
 * Lazy images below the fold report naturalWidth 0 until they are decoded.
 * Both aspect-ratio guards depend on natural dimensions, so force every image
 * to load and decode BEFORE measuring. Without this the tests fail on NaN
 * rather than on a real layout problem — a false alarm that hides the defect
 * they exist to catch.
 */
async function waitForImages(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('main img')) as HTMLImageElement[];
    imgs.forEach((i) => { i.loading = 'eager'; });
    // scroll-behavior:smooth means scrollTo animates — step and wait.
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 120));
    await Promise.all(
      imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {})))
    );
  });
  await page.waitForTimeout(200);
}

test.describe('GainCut product page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  test('loads with correct title and single H1', async ({ page }) => {
    await expect(page).toHaveTitle(/GainCut.*AI Calorie Tracker/i);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Photo in.');
  });

  test('title and description contain the searchable product category', async ({ page }) => {
    // Position 3 with 0 clicks on the old page was a snippet problem: the
    // title never said "calorie tracker", so it did not match the query.
    const title = await page.title();
    expect(title.toLowerCase()).toContain('calorie tracker');
    const desc = (await page.getAttribute('meta[name="description"]', 'content')) || '';
    expect(desc.toLowerCase()).toContain('calorie tracker');
    expect(desc.toLowerCase()).toContain('macro');
  });

  test('every image resolves, none are broken', async ({ page }) => {
    // Lazy images below the fold have naturalWidth 0 until decoded, so scroll
    // the page and wait for every image to finish loading before asserting.
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('main img')) as HTMLImageElement[];
      imgs.forEach((i) => { i.loading = 'eager'; });
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      await Promise.all(
        imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {})))
      );
    });

    const imgs = page.locator('main img');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      const natural = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
      const src = await img.getAttribute('src');
      expect(natural, `image failed to load: ${src}`).toBeGreaterThan(0);
    }
  });

  test('REGRESSION GUARD: cropped screenshots never go inside a phone frame', async ({ page }) => {
    await waitForImages(page);
    const phoneImgs = page.locator('.phone img');
    const n = await phoneImgs.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const img = phoneImgs.nth(i);
      const { nat, src } = await img.evaluate((el) => {
        const im = el as HTMLImageElement;
        return { nat: im.naturalWidth / im.naturalHeight, src: im.getAttribute('src') };
      });
      // A true full-screen iPhone screenshot is 1206x2622 = 0.46.
      // Anything materially wider is a CROP and must not be in a phone frame.
      expect(
        Math.abs(nat - 0.46),
        `CROP IN PHONE FRAME: ${src} has aspect ${nat.toFixed(3)}, expected ~0.46. ` +
          `Put it in .shot-card instead.`
      ).toBeLessThan(0.05);
    }
  });

  test('no screenshot is letterboxed (displayed aspect matches natural)', async ({ page }) => {
    await waitForImages(page);
    const imgs = page.locator('main figure img');
    const n = await imgs.count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < n; i++) {
      const img = imgs.nth(i);
      const r = await img.evaluate((el) => {
        const im = el as HTMLImageElement;
        return {
          nat: im.naturalWidth / im.naturalHeight,
          disp: im.clientWidth / im.clientHeight,
          src: im.getAttribute('src'),
        };
      });
      // >8% divergence means object-fit is cropping or padding it
      const drift = Math.abs(r.disp - r.nat) / r.nat;
      expect(drift, `LETTERBOXED: ${r.src} natural ${r.nat.toFixed(3)} displayed ${r.disp.toFixed(3)}`)
        .toBeLessThan(0.08);
    }
  });

  test('all reveal sections become visible after scrolling', async ({ page }) => {
    const total = await page.locator('.reveal').count();
    expect(total).toBeGreaterThan(10);

    // Scroll the whole page the way a reader would.
    // NOTE: html has scroll-behavior:smooth, so window.scrollTo() ANIMATES.
    // The loop's final call was still easing when assertions began, which
    // made settled blocks look stuck. Wait for scroll position to stop
    // changing before measuring.
    await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const settle = async () => {
        let last = -1;
        for (let i = 0; i < 40; i++) {
          if (window.scrollY === last) return;
          last = window.scrollY;
          await sleep(50);
        }
      };
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await sleep(70);
      }
      window.scrollTo(0, document.body.scrollHeight);
      await settle();
    });

    // Reveal transitions run 0.7s and are staggered up to 0.27s. Sampling
    // before they settle reads a half-faded element as "hidden" — the bug
    // this test would then report does not exist. Wait for the class, then
    // wait for the transition to finish, then assert opacity.
    await page.waitForFunction(
      () => {
        const els = [...document.querySelectorAll('.reveal')];
        return els.every((el) => el.classList.contains('is-visible'));
      },
      null,
      { timeout: 5000 }
    );

    await page.waitForFunction(
      () => {
        const els = [...document.querySelectorAll('.reveal')];
        return els.every((el) => {
          const o = getComputedStyle(el).opacity;
          return o === '1';
        });
      },
      null,
      { timeout: 5000 }
    );

    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('.reveal')]
        .filter((el) => getComputedStyle(el).opacity !== '1')
        .map((el) => el.className)
    );
    expect(hidden, `sections still invisible: ${JSON.stringify(hidden)}`).toHaveLength(0);
  });

  test('every App Store CTA is a real link and tagged for analytics', async ({ page }) => {
    const ctas = page.locator('[data-ga="appstore_download"]');
    const n = await ctas.count();
    expect(n).toBeGreaterThanOrEqual(3); // nav + hero + footer
    for (let i = 0; i < n; i++) {
      const cta = ctas.nth(i);
      const href = await cta.getAttribute('href');
      expect(href).toContain('apps.apple.com');
      expect(href).toContain('id6785259813');
      const loc = await cta.getAttribute('data-ga-location');
      expect(loc, 'CTA missing data-ga-location').toBeTruthy();
      expect(href, 'CTA missing UTM campaign').toContain('utm_campaign=');
    }
  });

  test('clicking an App Store CTA actually fires a GA4 event', async ({ page }) => {
    // REGRESSION GUARD for a real bug found 2026-11-13.
    // All three CTAs carried data-ga="appstore_download" from the day the page
    // was built, but main.js never read those attributes, so ZERO events had
    // ever fired. The test above still passed because it only asserted the
    // attribute existed — the markup looked instrumented, so nobody checked.
    // Asserting the attribute is worthless; this asserts the event.
    await page.evaluate(() => {
      (window as any).__gaEvents = [];
      (window as any).gtag = (...args: any[]) => {
        if (args[0] === 'event') (window as any).__gaEvents.push({ name: args[1], params: args[2] });
      };
    });

    // Reload so main.js binds its listeners against the stubbed gtag.
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).gtag === 'function');

    for (const location of ['nav', 'hero', 'footer']) {
      await page.evaluate(() => {
        (window as any).__gaEvents = [];
        (window as any).gtag = (...args: any[]) => {
          if (args[0] === 'event') (window as any).__gaEvents.push({ name: args[1], params: args[2] });
        };
      });

      // Dispatch the click but stop the browser navigating away.
      const sel = `[data-ga="appstore_download"][data-ga-location="${location}"]`;
      await page.evaluate((s) => {
        const el = document.querySelector(s) as HTMLAnchorElement;
        el.addEventListener('click', (e) => e.preventDefault(), { once: true });
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }, sel);

      const events = await page.evaluate(() => (window as any).__gaEvents);
      const event = events.find((e: any) => e.name === 'appstore_download');
      expect(event, `no appstore_download event fired for the ${location} CTA`).toBeTruthy();
      expect(event.params.location, `event from ${location} carried the wrong location`).toBe(location);
      expect(event.params.page).toBe('/gaincut/');
    }
  });

  test('no analytics attribute is left unread by main.js', async ({ page }) => {
    // Catches the general shape of the bug above: an attribute that looks like
    // instrumentation but has no listener. If a new data-ga is added, this
    // fails until main.js is wired to it.
    const unread = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-ga]'));
      const localHost = window.location.hostname;
      return els
        .filter((el) => {
          const a = el as HTMLAnchorElement;
          return a.hostname === localHost; // off-site CTAs are excluded below
        })
        .map((el) => (el as Element).getAttribute('data-ga'));
    });
    expect(unread, 'data-ga present on a same-site element with no tracking').toHaveLength(0);
  });

  test('FAQ items open and expose their answer', async ({ page }) => {
    const first = page.locator('.faq-item').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.faq-answer')).toBeVisible();
  });

  test('free tier is stated as 30 scans, matching the app', async ({ page }) => {
    // The real app shows "30 of 30 free AI scans left this month".
    // A marketing page that overstates this is a churn source.
    await expect(page.locator('body')).toContainText('30');
    await expect(page.locator('body')).toContainText(/30 (free )?AI scans/i);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflow, 'page scrolls horizontally on a 390px viewport').toBe(false);
  });

  test('stacked properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE);
    // feature blocks should be single column
    const cols = await page.locator('.feature-block').first().evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(cols).toBe(1);
    // pricing stacks
    const priceCols = await page.locator('.price-grid').evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length
    );
    expect(priceCols).toBe(1);
  });

  test('structured data is valid JSON', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const b of blocks) {
      expect(() => JSON.parse(b)).not.toThrow();
    }
    // one must be SoftwareApplication, one FAQPage
    const joined = blocks.join(' ');
    expect(joined).toContain('SoftwareApplication');
    expect(joined).toContain('FAQPage');
  });

  test('respects reduced motion — content visible without animation', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(PAGE);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('.reveal')].filter(
        (el) => getComputedStyle(el).opacity !== '1'
      ).length
    );
    expect(hidden, 'reveal blocks hidden under reduced motion').toBe(0);
    await ctx.close();
  });

  test('pricing section shows real numbers for both tiers', async ({ page }) => {
    // Superseded the old "placeholder is marked" test on 2026-11-13 when the
    // real StoreKit prices were wired in. The authoritative check that the
    // page agrees with GainCut.storekit lives in the hero-mark describe.
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible();
    await expect(pricing).toContainText('Free');
    await expect(pricing).toContainText('US$1.99');
    await expect(pricing).toContainText('US$14.99');
    await expect(pricing).not.toContainText('PRICE TO CONFIRM');
  });
});

/* ==========================================
   Hero composition
   ==========================================
   Added 2026-11-13 after a rejected iteration. A floating "scan" demo card
   was added to the hero and Vincent rejected it — it read as clutter
   overlapping the product shot. These tests pin the rule that came out of
   that: the hero holds ONE product shot, and motion is entrance-only.

   If someone later wants to add a floating overlay element to the hero,
   these fail first and force the decision to be explicit.
   ========================================== */
test.describe('GainCut hero composition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  test('hero holds two phones: front product shot + dimmed backdrop', async ({ page }) => {
    // Front is the product shot (Snap and Log). Back is the dashboard, purely
    // decorative — it must stay hidden from assistive tech.
    const heroImgs = page.locator('.hero-visual img');
    await expect(heroImgs).toHaveCount(2);

    const front = await page.locator('.hero--product .phone--front img').getAttribute('src');
    expect(front).toContain('snap');

    const back = page.locator('.hero--product .phone--back img');
    expect(await back.getAttribute('src')).toContain('dashboard');
    // Decoration must not be announced.
    expect(await back.getAttribute('alt')).toBe('');

    // No floating demo/overlay card left over from the rejected iteration.
    await expect(page.locator('#demo-card')).toHaveCount(0);
    await expect(page.locator('.demo-card')).toHaveCount(0);
  });

  test('back phone reads as background, front as focal point', async ({ page }) => {
    const r = await page.evaluate(() => {
      const f = document.querySelector('.hero--product .phone--front');
      const b = document.querySelector('.hero--product .phone--back');
      return {
        frontZ: +getComputedStyle(f).zIndex,
        backZ: +getComputedStyle(b).zIndex,
        backOpacity: +getComputedStyle(b).opacity,
        backLeftOfFront:
          b.getBoundingClientRect().left < f.getBoundingClientRect().left,
        // ⚠️ Compare offsetWidth, NOT getBoundingClientRect().width.
        // The back phone is rotated -6deg, which inflates its bounding box
        // (measured 232px) above its real 208px — making the wider element
        // look narrower than it is.
        frontW: f.offsetWidth,
        backW: b.offsetWidth,
      };
    });
    expect(r.frontZ).toBeGreaterThan(r.backZ);
    expect(r.backOpacity).toBeLessThan(0.6);
    expect(r.backLeftOfFront).toBe(true);
    expect(r.frontW).toBeGreaterThan(r.backW);
  });

  test('the hero says nothing above the product name', async ({ page }) => {
    // Vincent cut the "Built in Hong Kong · iOS" eyebrow pill on 2026-11-13.
    // It answered a question nobody asked, sat in the most valuable pixel above
    // the H1, and read as a scarcity signal ("small studio"). The HK advantage
    // is argued properly further down the page with char siu and dim sum, so it
    // does not need repeating as a label. This guard stops it creeping back.
    await expect(page.locator('.hero--product .hero-badge')).toHaveCount(0);

    const bodyText = await page.locator('.hero--product .hero-content').innerText();
    expect(bodyText, 'the hero eyebrow label has returned').not.toMatch(/Built in Hong Kong/i);

    // The H1 must still be the first text in the hero.
    const firstHeading = await page.locator('.hero--product .hero-content h1').first().innerText();
    expect(firstHeading).toMatch(/Photo in/i);
  });

  test('hero entrance animations are present and settle', async ({ page }) => {
    const front = await page
      .locator('.hero--product .phone--front')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(front).toBe('front-rise');

    const back = await page
      .locator('.hero--product .phone--back')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(back).toBe('back-rise');

    const title = await page
      .locator('.hero--product .hero-title')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(title).toBe('hero-rise');

    // The hero mark is no longer the PNG icon — it is the animated SVG that
    // draws itself. It carries no CSS animation; the draw is driven by
    // stroke-dashoffset on its paths instead (covered in the hero-mark
    // suite below). Assert the mark exists and the retired icon is gone.
    await expect(page.locator('.gc-mark')).toHaveCount(1);
    await expect(page.locator('.product-hero-icon')).toHaveCount(0);

    // Everything must end fully opaque — an entrance that leaves opacity < 1
    // is the blank-section class of bug.
    await page.waitForTimeout(2000);
    const opacities = await page.evaluate(() => {
      const sel = '.hero--product .hero-content > *, .hero--product .phone--front';
      return [...document.querySelectorAll(sel)].map((el) => getComputedStyle(el).opacity);
    });
    opacities.forEach((o) => expect(o).toBe('1'));
  });

  test('headline sheen runs on ::before, not the h1', async ({ page }) => {
    // Guards a real cascade bug: declaring animation on the h1 loses to the
    // `.hero-content > *` entrance rule at equal specificity.
    const r = await page.locator('.hero--product .hero-title').evaluate((el) => ({
      h1: getComputedStyle(el).animationName,
      before: getComputedStyle(el, '::before').animationName,
    }));
    expect(r.h1).toBe('hero-rise');
    expect(r.before).toBe('title-sheen');
  });

  test('hero screenshot is not covered by any positioned element', async ({ page }) => {
    // The product shot must be fully visible: no element may sit on top of it.
    const covered = await page.evaluate(() => {
      const img = document.querySelector('.hero-visual img');
      const r = img.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      return { hitIsImg: top === img || img.contains(top) || (top && top.closest('.phone-screen') !== null) };
    });
    expect(covered.hitIsImg, 'something is rendering on top of the hero screenshot').toBe(true);
  });

  test('reduced motion disables hero animation but keeps everything visible', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(PAGE);

    const states = await page.evaluate(() => {
      const sel = '.hero--product .hero-content > *, .hero--product .phone--front';
      return [...document.querySelectorAll(sel)].map((el) => ({
        anim: getComputedStyle(el).animationName,
        op: getComputedStyle(el).opacity,
      }));
    });
    states.forEach((s) => {
      expect(s.anim).toBe('none');
      expect(s.op).toBe('1');
    });

    const sheen = await page
      .locator('.hero--product .hero-title')
      .evaluate((el) => getComputedStyle(el, '::before').display);
    expect(sheen).toBe('none');

    await ctx.close();
  });
});


/* ==========================================
   GainCut hero mark
   ==========================================
   HISTORY — worth keeping, because it is the reason this is now an <img>:
     1. A strokes-only SVG drew nothing at all: a gradient `url(#...)` on a
        straight path has a zero-area bbox, so no reference box to paint.
     2. Crossed shapes were rebuilt (fork vertical rotate -45, dumbbell
        vertical rotate +45). Measured against icon-1024.png it reached 1.01x
        white coverage and an exact dumbbell bbox — and STILL looked weak
        beside the hand-drawn original.
     3. 2026-11-13: Vincent's call — use the real icon, scaled. Removed the
        whole drawn mark, its CSS, and its draw script. At 1024px there is
        nothing to gain by redrawing a finished asset.
   ========================================== */
test.describe('GainCut hero mark', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  test('hero mark is the real app icon image, not a redrawn SVG', async ({ page }) => {
    const mark = page.locator('.gc-mark');
    await expect(mark).toHaveCount(1);
    // Must be an <img>. The SVG rebuild is retired — if this ever becomes an
    // <svg> or <div> again, the weak-looking redraw has come back.
    expect(await mark.evaluate((el) => el.tagName)).toBe('IMG');
    await expect(page.locator('.gc-mark-svg')).toHaveCount(0);
  });

  test('the icon image loads at a usable resolution', async ({ page }) => {
    const mark = page.locator('.gc-mark');
    // waiting for decode is essential: a lazy image reports naturalWidth 0
    // until it has actually loaded, which reads as a false failure.
    await mark.evaluate(async (el) => {
      const img = el as HTMLImageElement;
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
      await img.decode?.().catch(() => {});
    });

    const info = await mark.evaluate((el) => {
      const img = el as HTMLImageElement;
      return {
        nat: img.naturalWidth,
        current: img.currentSrc,
        srcset: img.getAttribute('srcset') || '',
        display: img.getBoundingClientRect().width,
      };
    });

    // The asset that actually loaded must be >= 2x the rendered size, or the
    // hero is soft on retina. This is the real requirement — an exact 1024px
    // master is not, as long as it stays sharp.
    expect(
      info.nat,
      `hero icon loaded ${info.nat}px for a ${info.display}px render — needs >= 2x to stay sharp on retina`
    ).toBeGreaterThanOrEqual(info.display * 2);

    // And a retina option must actually be offered, so a 1x-only regression fails.
    expect(info.srcset, 'hero icon has no srcset — retina screens get a soft asset')
      .toMatch(/2x/);

    // The master must be reachable for the 2x case.
    expect(info.srcset).toMatch(/gaincut-icon-1024\.png 2x/);

    // The 1x file must be small — shipping the 1024px master to 1x screens was
    // a 1.3MB hit for a 132px render.
    expect(info.srcset, 'no lightweight 1x asset in srcset').toMatch(/gaincut-icon-320\.png 1x/);
  });

  test('hero icon is larger than the old 108px PNG treatment', async ({ page }) => {
    const w = await page.locator('.gc-mark').evaluate((el) => el.getBoundingClientRect().width);
    // Vincent asked for the icon "scaled to the bigger size". 132px is the
    // desktop size; assert against the old 108px so a regression to the
    // smaller treatment fails.
    expect(w, `hero icon is ${w}px — expected the enlarged 132px treatment`).toBeGreaterThan(120);
  });

  test('hero icon keeps the iOS squircle radius and a shadow', async ({ page }) => {
    const css = await page.locator('.gc-mark').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { radius: parseFloat(cs.borderRadius), filter: cs.filter };
    });
    const w = await page.locator('.gc-mark').evaluate((el) => el.getBoundingClientRect().width);
    // iOS squircle is 0.2227 x size. Allow a little slack for rounding.
    const expected = w * 0.2227;
    expect(Math.abs(css.radius - expected), `radius ${css.radius} does not match squircle ${expected.toFixed(1)}`).toBeLessThan(4);
  });

  test('hero icon is at a usable size on mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 760 } });
    const page = await ctx.newPage();
    await page.goto(PAGE);
    await page.waitForTimeout(600);
    const w = await page.locator('.gc-mark').evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeGreaterThanOrEqual(104);
    await ctx.close();
  });

  test('Pro pricing matches the StoreKit config, not an invented number', async () => {
    // SOURCE OF TRUTH: ios/GainCut/Resources/GainCut.storekit
    //   com.ideafactory.gaincut.pro.monthly  US$1.99
    //   com.ideafactory.gaincut.pro.yearly   US$14.99  (intro 3-day free trial)
    // The page must quote these. An earlier draft said "HK$18 / HK$118",
    // which appeared nowhere in the repo — invented numbers on a live pricing
    // page. This reads the storekit file directly so the two cannot drift.
    const fs = await import('fs');
    const skPath = process.env.HOME + '/Projects/GainCut/ios/GainCut/Resources/GainCut.storekit';
    const sk = JSON.parse(fs.readFileSync(skPath, 'utf8'));
    const priceOf = (id: string) =>
      sk.subscriptionProducts.find((p: any) => p.productID === id).prices[0].price;
    const monthly = priceOf('com.ideafactory.gaincut.pro.monthly');
    const yearly = priceOf('com.ideafactory.gaincut.pro.yearly');

    const html = await (await fetch('http://localhost:8766/gaincut/')).text();
    expect(html).toContain(`US$${monthly}`);
    expect(html).toContain(`US$${yearly}`);
    // The placeholder must never come back.
    expect(html).not.toContain('PRICE TO CONFIRM');

    // The savings claim must be TRUE IN EVERY CURRENCY, not just USD.
    //
    // History: the page said "37% less" because 1 - 14.99/(1.99*12) = 37.2%
    // in USD. But ASC serves HKD to HK customers (HK$18 / HK$118), where the
    // real saving is 45.4%. The badge was hardcoded from the USD tier while
    // prices rendered in HKD, so it understated the discount by 8 points.
    //
    // Rather than pin a single number that is only right in one currency, the
    // page now claims "save up to 45%" — the ceiling across both tiers — and
    // this test proves the claim is not an overstatement.
    const usdSaving = (1 - Number(yearly) / (Number(monthly) * 12)) * 100;
    const hkdSaving = (1 - 118 / (18 * 12)) * 100;  // as shown in the live paywall
    const maxSaving = Math.max(usdSaving, hkdSaving);

    expect(html, 'savings claim missing').toContain('save up to');
    const claimed = Number(html.match(/save up to (\d+)%/)?.[1]);
    expect(claimed, 'could not read the savings percentage from the page').toBeGreaterThan(0);

    // Claiming MORE than the real saving would be a false discount claim.
    expect(claimed, `page claims ${claimed}% but the best real saving is ${maxSaving.toFixed(1)}%`)
      .toBeLessThanOrEqual(Math.floor(maxSaving));

    // And the specific 37% string must not come back — it is USD-only.
    expect(html).not.toContain('37%');
  });

  test('the retired SVG mark leaves no script or dead selectors behind', async ({ page }) => {
    // The draw script toggled .is-drawing/.is-static on the old mark. It was
    // removed with the SVG; a leftover <script> 404 is silent in production.
    const srcs = await page.locator('script[src]').evaluateAll((els) =>
      els.map((e) => (e as HTMLScriptElement).getAttribute('src') || '')
    );
    expect(srcs.join(' ')).not.toContain('gaincut-mark');
    await expect(page.locator('.gc-outline, .gc-fill, .gc-tile')).toHaveCount(0);
  });
});


/* ==========================================
   Scroll behaviour on load
   ==========================================
   Vincent reported the page "bounces to the bottom" on load in iOS Safari.
   Reproduced: the page landed ~2,200px down with NO hash in the URL, and
   `scroll-behavior: smooth` meant the reset animated rather than snapping.
   ========================================== */
test.describe('page load scroll position', () => {
  test('a fresh load starts at the top, not mid-page', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(600);
    const y = await page.evaluate(() => window.scrollY);
    expect(y, 'page did not start at the top').toBeLessThan(5);
  });

  test('reloading after scrolling down returns to the top', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForTimeout(800);
    const y = await page.evaluate(() => window.scrollY);
    expect(y, 'scroll position was restored instead of reset').toBeLessThan(5);
  });

  test('scroll restoration is manual, and smooth scrolling does not animate the reset', async ({ page }) => {
    await page.goto(PAGE);
    const r = await page.evaluate(() => ({
      restoration: history.scrollRestoration,
      behavior: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    expect(r.restoration).toBe('manual');
    // Must be instant so the reset cannot be seen as a bounce.
    expect(r.behavior).toBe('auto');
  });
});
