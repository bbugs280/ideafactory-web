# GainCut product page — full rebuild

**Date:** 2026-11-13
**Page:** https://ideafactory.one/gaincut/
**Scope:** Website only. The GainCut iOS app was not modified.

## Why

The app has been live since late July with **0 App Store ratings** and no
sign-ups. Google Search Console for the old page showed the cause at the
level that matters:

| Metric | Reading |
|---|---|
| `/gaincut/` impressions (90d) | 11 |
| Average position | 3.0 – 3.4 |
| Clicks | **0** |

Position 3 with zero clicks is a snippet problem, not a ranking problem.
The old `<title>` read *"All Gym. No Results? Here's What You're Missing."* —
it never contained the words **calorie tracker** or **macro**, so it did not
look like an answer to what anyone was searching for.

The page was also a single dense screen with no real product screenshots in
any position of prominence, and it had no pricing, no FAQ, and no honesty
section.

## What changed

### 1. Rewritten for the query, not for the slogan
- Title: `GainCut — AI Calorie Tracker & Macro Logging for Lifters | Hong Kong` (72 chars)
- Description names the category and the free allowance (182 chars)
- Single `<h1>`: `Photo in. Macros out.`
- H2s carry the feature vocabulary: macros, recovery, 7-day balance

### 2. Nine sections, each with a job
1. Hero — app icon, real dashboard screenshot in a phone frame
2. Stat row — 30 scans / 3 macros / 1 photo
3. The enemy — "a measurement problem, not a discipline problem"
4. How it works — 3 numbered steps + the target-math screenshot
5. Features — macros, recovery, 7-day balance, snap & log
6. **What it does not do** — explicit limits table
7. Pricing — free tier real, Pro price marked as placeholder
8. FAQ — 7 questions, marked up as `FAQPage`
9. Final CTA + cross-sell

### 3. Screenshot placement — the main technical risk
Only **2 of 6** screenshots are true full-screen phone aspect (1206×2622 = 0.46):

| File | Aspect | Plate |
|---|---|---|
| `dashboard.png` | 0.46 | phone frame ✓ |
| `snap.jpg` | 0.46 | phone frame ✓ |
| `meals.jpg` | 1.124 | `.shot-card` |
| `macros.jpg` | 2.124 | `.shot-card` |
| `balance.jpg` | 0.929 | `.shot-card` |
| `recovery.jpg` | 0.778 | `.shot-card` |
| `target-math.jpg` | 1.287 | `.shot-card` |

The other four are **crops of one card**, not full screens. Putting them in a
phone frame reproduces the homepage letterboxing defect (0.460 frame vs 1.287
source → ~65% dead space). Two Playwright guards now enforce this.

### 4. Balance screen — reframed, not dropped
`balance.jpg` shows "Under plan" and "behind the surplus target", which on a
marketing page can read as *this user is failing*. Vincent chose option A:
keep the screen, control the caption.

> **7-Day Balance** — On plan or off, you see the real number — against your
> plan and against maintenance.

This keeps the strongest differentiator vs Cal AI (real arithmetic over a
rolling week) without inviting a failure read.

### 5. Reveal-on-scroll bug — found and fixed in shared JS
`assets/js/main.js` used `IntersectionObserver` with `threshold: 0.05` and
unobserved on first fire. Two failure modes were measured on this page:

- **Tall blocks.** Blocks 695px and 622px high in a viewport with 860px
  usable height (after `-40px` rootMargin) could be sampled before the ratio
  crossed 0.05.
- **Jumped-past blocks.** Fast scrolling moved a block from below the
  viewport to above it between samples. `isIntersecting` never fired, so the
  block stayed at `opacity: 0` **forever** — a permanently blank gap.
  Reproduced on *"Snap, log, move on."*

Fix: `threshold: 0`, plus a sweep that also reveals any element whose bottom
is above the viewport top (already scrolled past), bound to scroll/resize and
a 250ms interval that self-clears once everything is visible.

This is shared code — the fix applies to the homepage too, and the full suite
was re-run afterwards to confirm no regression.

### 6. Analytics
Every App Store CTA carries `data-ga="appstore_download"` and a
`data-ga-location` (`nav` / `hero` / `footer`), plus UTM parameters per
placement. Previously there was no way to attribute a single install.

## Testing

`tests/gaincut.spec.ts` — 14 tests, all passing:

| Test | Purpose |
|---|---|
| title + single H1 | basic correctness |
| category in title/desc | guards the snippet fix |
| every image resolves | no broken assets |
| **crops never in phone frame** | aspect ratio guard |
| **no screenshot letterboxed** | display-vs-natural drift < 8% |
| all reveals visible after scroll | guards the JS fix above |
| CTAs link + tagged | analytics cannot silently disappear |
| FAQ opens | interactive elements work |
| 30-scan claim present | marketing cannot overstate the free tier |
| no mobile overflow | 390px viewport |
| mobile stacking | 1-col grids |
| structured data valid | JSON parses, both types present |
| reduced motion | content visible with all motion off |
| pricing rendered | blocks shipping a blank page |

Full suite after the shared-JS change: **34/34 passing** (11 homepage,
9 KidLaunch, 14 GainCut).

## Open item

**Pro pricing is a visible placeholder.** The page renders `PRICE TO CONFIRM`
inside a dashed amber chip at `/gaincut/#pricing`. It is deliberately loud so
it cannot ship unnoticed. Replace with the real tier price and update the
`pro pricing placeholder` test to assert the number.

## Hero revision — demo card rejected, new hero image (v3, final)

Vincent reviewed v2 and rejected it:

> *"I meant this screen need to have a better hero image and animation.
> What u have added as animation is weird pls revert"*

### What was removed
The floating "scan" demo card (photo → scan line → counting macros). It was
built to demonstrate the product, but on a real phone it read as **an extra
object cluttering the product shot**, not as the product working. Deleted:
`.demo-card` markup, all its CSS, and `assets/js/gaincut-demo.js`.

**Rule recorded:** the hero holds one product story. No floating overlay
cards. Motion carries arrival and depth only.

### What replaced it
**A better hero image.** The dashboard screenshot was the original pick and
it was the wrong one — a measured critique called it *"bland and utilitarian,
more appropriate for an app store listing than a homepage hero"*. Four data
points compete and it reads as an internal tool.

The hero now leads with **Snap & Log** — one idea ("Snap Your Meal"), the
core action, and lots of whitespace. The dashboard sits behind it, dimmed to
42%, blurred and rotated −6°, purely for depth. It is `alt=""` so a screen
reader gets one product shot, not two.

### Animation, kept restrained
| Motion | Where |
|---|---|
| `front-rise` | Front phone rises into place |
| `back-rise` | Back phone settles slightly earlier |
| `hero-rise` | Text lines stagger 70ms apart |
| `icon-pop` | App icon lands with slight overshoot |
| `hero-float` | Front screen drifts ±8px over 7s |
| `glow-breathe` | Amber glow behind, 8s |
| `title-sheen` | Highlight travels the headline, 7.5s |

All disabled under `prefers-reduced-motion`, with everything left at
`opacity: 1` and no transform.

### Test changes
4 new hero-composition tests replace the 6 demo-card ones:
- two phones exactly, front = snap, back = dashboard with `alt=""`
- back is dimmed (<0.6), behind (lower z-index), left of front, and narrower
- entrance animations present (`front-rise` / `back-rise` / `hero-rise`)
- sheen on `::before`, not the `h1` (cascade-bug guard)
- nothing renders on top of the hero screenshot (`elementFromPoint`)
- reduced motion: animations `none`, opacity `1`, sheen hidden

One measurement lesson recorded in the test: the back phone is rotated, so
`getBoundingClientRect().width` reports **232px** for a **208px** element. Width
comparisons must use `offsetWidth`.

Final: **40/40 project suite**, 60/60 over 3 repeats of the GainCut spec.

## App icon — bigger + 3D tilt (2026-11-13)

> *"Can u make the icon bigger or you can research how to make animations of
> it using js?"*

### Size
**76px → 108px** (88px under 768px). The fork/dumbbell mark was unreadable
at a glance on a phone. Squircle radius follows iOS (~0.2227 × size). Source
asset is 1024×1024, so this is still downscaling.

### Animation — researched, not improvised
Searched the standard patterns (vanilla-tilt, tiltEffect, and Apple's
Liquid Glass icon guidance). The consistent approach is **3D perspective
rotation toward the pointer + a specular highlight that tracks the cursor**,
so the surface reads as physically lit rather than a flat bitmap. Apple's own
HIG notes real app icons carry specular highlights that respond to movement —
same idea, pointer instead of gyroscope.

Implementation: `assets/js/icon-tilt.js` + the `.icon-tilt` block in
`product-pages.css`.

| Behaviour | Detail |
|---|---|
| Tilt | 14deg at the icon edge, eased 0.18 toward the pointer |
| Highlight | Radial gradient tracking the cursor, brighter on hover |
| Idle | 9s ambient drift until first interaction |
| Touch | Brief press-in on tap, no stuck tilt |
| Reduced motion | No listeners attached, no rAF, static class applied |
| Perf | mousemove only stores coords; transform written once per rAF |

Rotation and highlight sit on **different layers**: rotating the `<img>`
itself would skew the gradient and the light would look painted on.

### Three real bugs found and fixed

1. **Half-strength tilt.** `target.x/y` are normalised to -0.5...0.5, so
   `x MAX_TILT` produced only half of it — 14deg yielded ~6deg.
2. **Listener on the rotating element.** Attached to the shell that rotates,
   the edge moved out from under the cursor, firing `mouseleave` then reset
   then `mouseenter`. Capped the tilt and flickered. Moved to the `<img>`.
3. **Measuring a rotated box.** `getBoundingClientRect()` on the animating
   shell reports **110px for a 108px element**. Used for coordinates it
   dilutes the normalisation; used for assertions it fails a correct page.
   Width comparisons and pointer maths now use `offsetWidth`.

### Tests
6 new tests: size >=100px, JS wrap + shine injection, real tilt angle at the
edges (>8deg), tilt responds and flattens on leave, highlight follows the
pointer, reduced-motion disables it.

Writing them surfaced a harness lesson: `settle()` must require the transform
to be IDENTICAL across **three** consecutive reads. Comparing two reads 100ms
apart "matched" mid-ease, because the eased value moves by less than the
printed precision between samples. Measured convergence is ~1.2s.

Final: **46/46 project suite**, green across 3 consecutive full runs.

## Testing

`tests/gaincut.spec.ts` — **26 tests**, all passing. Full project suite:
**46/46** (11 homepage, 9 KidLaunch, 26 GainCut). Green across 3 consecutive
full runs.

| Test | Purpose |
|---|---|
| title + single H1 | basic correctness |
| category in title/desc | guards the snippet fix |
| every image resolves | no broken assets |
| **crops never in phone frame** | aspect ratio guard |
| **no screenshot letterboxed** | display-vs-natural drift < 8% |
| all reveals visible after scroll | guards the reveal JS fix |
| CTAs link + tagged | analytics cannot silently disappear |
| FAQ opens | interactive elements work |
| 30-scan claim present | marketing cannot overstate the free tier |
| no mobile overflow | 390px viewport |
| mobile stacking | 1-col grids |
| structured data valid | JSON parses, both types present |
| reduced motion | content visible with all motion off |
| pricing rendered | blocks shipping a blank page |
| **count-up reaches real values** | 659 / 34 / 72 / 26 |
| **never leaves zeroes** | 3.5s safety net works |
| **scan + card animating** | animation actually applied |
| **sheen on ::before, not h1** | guards the cascade bug |
| **card does not cover phone** | product stays visible |
| **demo readable under reduced motion** | answer present without motion |

## Pricing wording and savings claim

The Pro card carried a hardcoded **"37% less than monthly"** claim. That figure
is only correct in USD. Checked against the live StoreKit screenshot:

| Currency | Monthly | Yearly | 12 x monthly | Real saving |
|---|---|---|---|---|
| USD | $1.99 | $14.99 | $23.88 | 37.2% |
| HKD | $18.00 | $118.00 | $216.00 | **45.4%** |

The app renders HKD, so the 37% badge understated the discount. Rather than
hardcode a figure that is only true in one storefront, the claim is now
**"save up to 45%"** — the ceiling across both currencies, true in either, and
never an overstatement. The JSON-LD `priceCurrency` was also corrected from
`HKD` to `USD` so the schema matches the rendered price.

A test now recomputes the saving in **both** currencies, takes the maximum, and
asserts the page's claim never exceeds it. Claiming more than the real discount
fails the build. `37%` cannot return.

## Hero icon asset size

The real 1024px icon was shipping as a **1.3 MB PNG** to render at 132px — about
300x more pixels than any 1x screen could use. Added a **320px** derivative
(110 KB, a 92% reduction) and wired both through `srcset`:

- `gaincut-icon-320.png 1x` — 110 KB
- `gaincut-icon-1024.png 2x` — full sharpness on retina

The resolution test was rewritten. It previously demanded an exact 1024px
natural width, which was a proxy for "sharp on retina" rather than the real
requirement — it would have rejected a smaller-but-still-retina-safe asset. It
now asserts the loaded asset is at least **2x the rendered size**, that a `2x`
option is offered at all, and that a lightweight `1x` file exists. Measured at
DPR 1: 320px natural for a 132px render.

## Hero eyebrow removed

The hero carried a pill badge above the icon reading **"Built in Hong Kong ·
iOS"**. Removed on Vincent's call.

It occupied the most valuable pixel on the page — immediately above the H1 —
to answer a question nobody had asked. Worse, it is a *scarcity* signal: "built
in Hong Kong" reads as small studio to someone deciding in three seconds whether
this is a real product. Cal AI and MacroFactor lead with the outcome, not the
postcode.

The Hong Kong advantage is real, but it is already argued properly further down
the page — "Most trackers fail on the food you actually eat" followed by char
siu, wonton noodles and dim sum. That is proof. A label above the headline is
just repetition. The `iOS` half was redundant twice over, since the CTA
immediately below already says "App Store".

The `.hero-badge` CSS was kept — the homepage uses it for "Product studio ·
Hong Kong", which is a genuine brand line, and KidLaunch has its own variant.
Only the GainCut element was removed.

A negative-tested guard holds this: the test fails if `.hero-badge` returns to
the product hero or if "Built in Hong Kong" reappears in `.hero-content`.

## Deploy

Committed and pushed to `main`. GA4 `appstore_download` events fire on all
three CTAs. Subdomain `gaincut.ideafactory.one` is deferred; the path
`/gaincut/` is already indexed at position 3 and moving to a subdomain would
discard that.

Still unverified: the App Store Connect base territory. The ASC API returns
`403 FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED` and `altool` reports no
applications, so the live tier could not be read — an agreement likely needs
signing at App Store Connect -> Business. The page shows USD and the App Store
converts per storefront, so the page is correct either way.
