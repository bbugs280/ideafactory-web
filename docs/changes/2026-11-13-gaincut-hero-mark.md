# GainCut page — hero mark rebuilt to match the app icon

**Date:** 2026-11-13
**Scope:** `ideafactory.one/gaincut/` — hero only. No iOS changes.
**Status:** Uncommitted, verified locally at http://localhost:8766/gaincut/

## What Vincent asked for

> "The icon animations are also okay, but it doesn't look like the original
> icon. Can you make it look as much as possible like the original icon?"

The first animated mark was built from guessed geometry and rendered in the
site's amber accent — it animated nicely but was not GainCut's icon.

## Measured, not eyeballed

Two vision passes over `assets/images/GainCut-icon.jpg` **contradicted each
other**, so the source pixels were sampled directly. Both vision
descriptions were wrong on specifics:

| Detail | Vision pass said | Measured reality |
|---|---|---|
| Background | dark navy `#1E293B` | white corners; dark slate tile `#183030` inside |
| Fork | mint gradient `#34D399→#10B981` | flat green `#00a848` |
| Dumbbell | orange gradient | flat orange `#f06000` |
| Tine count | 4, splayed | **3**, straight |
| Layering | (disagreed) | **fork in front** — orange has a clean gap where the fork crosses |
| Diagonals | (disagreed) | fork `/` head top-left; dumbbell `\` |

Layering was proven by scanning the anti-diagonal: orange pixels vanish at the
two samples either side of centre, i.e. the fork occludes it. The fork
orientation was proven by quadrant counts — the original has **383 green
pixels top-left vs 10 top-right**.

## What was built

Inline SVG, two groups:

- `.gc-dumbbell` — `rotate(45)`, bar plus three stacked plates at each end,
  drawn **first** so the fork occludes it
- `.gc-fork` — `rotate(-45)`, three tines, U-shaped junction, handle to a
  rounded tip, drawn **second**

The draw-on animation is retained: `stroke-dasharray`/`stroke-dashoffset`
with `pathLength="1"` on every path so one CSS value drives all twelve.
Colours are solid, matching the flat look of the original.

## Three real bugs found by building this

1. **Gradient strokes painted nothing.** `stroke: url(#grad)` on a straight
   vertical or horizontal path renders NOTHING — the path has a zero-area
   bounding box, so the gradient has no reference box. The mark rendered as
   tile-only plus one small green U. Confirmed by colour census: 32,166 tile
   pixels, 81 green, **zero orange**. Fixed by using solid colours.
2. **The two diagonals were swapped.** The fork head sat top-right instead of
   top-left. Caught by measuring tine-centre coordinates after transform
   rather than trusting a screenshot. A vision model then insisted the head
   was top-right — the pixel census proved it wrong.
3. **`stroke-dasharray: 1` on a `pathLength=1` path** means "1 dash then 1
   gap", repeating — a dotted line. Fixed by setting `fill: none` and keeping
   dasharray at the full normalised length.

## Also fixed (reported by Vincent)

**Page bounced to mid-page on load.** Two independent causes:

- The browser was restoring a stale scroll offset. Nothing in our JS scrolls;
  the page is ~10,000px tall, so a saved offset landed wherever. Fixed with
  `history.scrollRestoration = 'manual'`.
- `scroll-behavior: smooth` applied to the programmatic reset, so it
  *animated* — that is the visible bounce. Measured: `scrollTo(0, 2500)`
  sampled 300ms later had only reached 849px. Scoped to
  `html:not(:focus-within)` so anchor jumps still glide but the load reset
  snaps.

Verified: scroll to 2500, reload, lands at **0**.

## Tooling fix

`python3 -m http.server` sends no `Cache-Control`, so browsers apply
heuristic caching and kept serving pre-edit CSS and JS. This produced roughly
an hour of false debugging — fixes read as "not working" when the files on
disk were correct. Replaced with `tools/preview.py` (no-store headers,
threaded so one idle socket cannot block all requests).

## Revision 2 — the objects overlapped instead of crossing

Vincent: *"the fork and dumbell are overlapp.. and not crossed like the icon."*

Correct, and the cause was geometric, not cosmetic.

**Measured from the source PNG**, each object runs the full face of the icon:

| Along its own axis | Extent (of 1024) |
|---|---|
| Fork (green) | −407 → +436 = **843** |
| Dumbbell (orange) | −410 → +402 = **812** |
| Fork's width across the dumbbell | only ±31 |
| Dumbbell's width across the fork | only ±43 |

My first build had both at ~60 units — so they sat in the middle and
overlapped. Fixed by extending both corner to corner.

**Then a second, subtler bug.** After extending them they *still* landed on
the same diagonal. Cause: the dumbbell was drawn **horizontally** then
rotated +45°, which puts it on the SAME axis as a **vertical** fork rotated
−45°. Two rotations 90° apart do not produce crossing lines unless the source
shapes share an orientation. Proven by transforming the plate centres:
they landed at (24.6, 24.6) and (95.4, 95.4) — on the fork's own diagonal.

Fixed by drawing the dumbbell **vertically** too. Quadrant pixel census now:

| Quadrant | Green | Orange |
|---|---|---|
| Top-left | 2,290 | 0 |
| Top-right | 45 | 2,812 |
| Bottom-left | 55 | 2,812 |
| Bottom-right | 1,262 | 0 |

**Third bug:** the three tines merged into one solid block — every row across
the head was a single continuous green run, zero gaps. At 8-unit spacing with
a 9px stroke they fused, so the head read as a *spoon*. Fixed with 11-unit
spacing plus a thinner `.gc-tine` stroke (6). Rows through the head now show
three separate runs.

### Note on verification method

Vision models were unreliable here and repeatedly contradicted the pixels —
one insisted the fork head was top-right when a quadrant count showed 383
green pixels top-left vs 10 top-right; another claimed the tines were
separate when no row had a single gap. Every geometry decision above was
settled by counting pixels, not by reading a description. The three new
tests rasterise the rendered mark and count runs for the same reason.

## Tests

`tests/gaincut.spec.ts` — 35 tests, of which **14 are new**:

- mark renders as inline SVG, fork and dumbbell groups present, old PNG gone
- fork has five distinct paths and three separated tines
- **every stroke is a real colour, never a `url(#…)` reference** (guards bug 1)
- fork is green, dumbbell is orange
- **fork head top-left, handle bottom-right** (guards the swapped diagonals)
- **the two objects cross into four arms in four quadrants** (guards the
  horizontal-rotation bug — fails if the dumbbell ends sit on the fork's axis)
- **both objects span the full tile** (fails if they shrink back to centre)
- **three tines separated by real gaps** — screenshots the mark and counts
  pixel runs, so it fails if they merge into a spoon blob
- draw animation completes — every path reaches dashoffset 0
- dumbbell precedes fork in document order (layering)
- mark stays ≥112px on mobile (a mobile override once shrank it to 88px)
- reduced motion renders a fully drawn mark, not an empty tile
- fresh load starts at top; reload after scrolling returns to top;
  scrollRestoration is manual and scroll-behavior is auto

Full suite: **55 passed** (was 40 before this work). Repeat-stability:
**110/110 across 2 runs.**

## Open

- Pro pricing still a `PRICE TO CONFIRM` placeholder.
- "What GainCut does not do" table still awaiting approval.
- Nothing committed.

---

# Update, same day — the SVG mark was abandoned

Everything above describes an inline-SVG rebuild of the app icon. **It was
removed.** Worth recording why, because the measurements were good and it
still failed.

## What happened

Vincent: *"it is very close now. but can you try to make the portion even
closer to the icon? and add some white border to the fork and dumbell"* —
then, after that iteration, *"the icon is too weak.. maybe just use the
orginal icon.. but scale to the bigger size.."*

The rebuild was measured against `icon-1024.png` on every pass:

| Check | Result at hand-off |
|---|---|
| White outline coverage | 14,627 px vs 14,489 px = **1.01×** |
| Green coverage | 9,482 vs 8,821 = **1.07×** |
| Dumbbell bounding box | 253×252 vs 248×252 = **effectively exact** |
| Fork head/handle weight split | 5,845/3,281 vs source 3,852/4,872 — **wrong** |

Numbers were close. It still read as weak beside the hand-drawn original.

**Lesson: matching a finished asset by pixel statistics is not the same as
matching it by craft.** At 1024px there was nothing to gain by redrawing.
The source file existed the whole time. Reach for it first.

## What replaced it

`<img class="gc-mark" src="/assets/images/gaincut/gaincut-icon-1024.png">`
— the real 1024px master copied from
`~/Projects/GainCut/ios/GainCut/Assets.xcassets/AppIcon.appiconset/`.

- Size **132px** desktop / **112px** mobile (was 124px / 108px)
- `border-radius: 29px` = 0.2227 × size, the iOS squircle ratio
- Master downscales 7.7× and stays sharp on retina
- **Resizing is two numbers**, not a geometry rebuild — noted in the CSS

## Deleted with it

- ~109 lines of `.gc-outline` / `.gc-fill` / `.gc-tile` / tilt CSS
- `assets/js/gaincut-mark.js` (drove the SVG draw)
- `assets/js/icon-tilt.js` (drove the older PNG tilt — already orphaned,
  found still sitting in the tree during the pre-commit review)

## Bugs found on the way

1. **Stray `</div>` left by my own edit.** `.hero-content` closed after the
   badge, so the `<h1>` and every CTA landed outside its container. The whole
   hero layout was broken. Caught by a test asserting `animationName ===
   'hero-rise'`; it read `none` because the parent selector no longer matched.
2. **New tests missing `page.goto`.** Dropped the `beforeEach` when
   rewriting the block, so four tests asserted against an empty DOM.

## Pricing wired in (real source, not guessed)

Read from `ios/GainCut/Resources/GainCut.storekit`:

- monthly `com.ideafactory.gaincut.pro.monthly` — **US$1.99**
- yearly `com.ideafactory.gaincut.pro.yearly` — **US$14.99**, 3-day free trial
- `ScanAllowance.freeLimit = 30` confirmed in source

A first draft said "HK$18 / HK$118 — about 45% less". **Both numbers were
invented** — nothing in the repo had them. Caught by grepping for `HK$` and
getting zero hits. Replaced with the storekit values.

Guard added: the test suite now **reads `GainCut.storekit` at runtime** and
asserts the page matches it, including that the "37% less" claim is
arithmetically true.

## Final test state

**50 passed**, **100/100 across 2 repeats.**

- retired-SVG guards: no `<svg>`, no draw script, no dead selectors
- icon is an `<img>` with `naturalWidth >= 1024`
- icon ≥120px desktop, ≥104px mobile, squircle radius within 4px of 0.2227×w
- pricing matches storekit; `PRICE TO CONFIRM` must never return

## Open

- ⚠️ **US$1.99 / US$14.99 is the local StoreKit test config.** Confirm
  against App Store Connect → Subscriptions before publishing. HK pricing
  may differ and would need both the page and the test updated.
- "What GainCut does not do" table still awaiting approval.
- Nothing committed at time of writing.

## Pricing claim corrected — "37%" was wrong in HKD

Vincent sent a screenshot of the live paywall: **HK$18/month, HK$118/year**
with a "BEST VALUE — SAVE 37%" badge. That exposed a real inconsistency.

Arithmetic, both currencies:

| | Monthly | Yearly | 12x monthly | Real saving |
|---|---|---|---|---|
| USD (storekit) | $1.99 | $14.99 | $23.88 | **37.2%** |
| HKD (live ASC) | $18 | $118 | $216 | **45.4%** |

37% is only true in USD. ASC serves HKD to HK customers, where the real
saving is 45.4% — the badge understated the discount by 8 points because the
string was hardcoded from the USD tier while prices rendered in HKD.

**Fix:** the page now says **"save up to 45%"** on both the price card and
the FAQ. Restated as a single number valid in EVERY currency, so it needs no
ASC access to stay correct.

Also changed `priceCurrency` in the JSON-LD from `HKD` to `USD`, to match
what the page actually displays.

Guard: the test now computes the saving in **both** currencies, takes the
max, and asserts the page's claim **never exceeds** it. Claiming more than
the real saving would be a false discount claim. It also asserts the string
`37%` cannot return.

### Could not verify ASC directly

Tried to read live subscription prices via the App Store Connect API:

- `/v1/apps` → **403 `FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`**
  (a required agreement needs signing at ASC → Business)
- `xcrun altool --list-apps` → **"No applications found"**, same cause

So live tier selection in ASC is **unconfirmed**. The HKD figures come from
Vincent's screenshot of the running app, which reads live StoreKit values —
that IS live ASC data. The storekit file (US-only) is an Xcode stub.
