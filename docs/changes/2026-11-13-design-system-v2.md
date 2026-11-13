# 2026-11-13 — Design system v2: homepage rebuild

**Repo:** `~/ideafactory-web` (bbugs280/ideafactory-web, GitHub Pages)

## Why

Vincent: *"the look and feel is not very good."* The old homepage was benchmarked
against Linear, Cal AI and MacroFactor by loading all four and comparing directly.
Three structural failures, none of them "the palette is wrong":

1. **Hero showed a logo illustration, not the product.** All three references put
   the actual product UI in the first viewport.
2. **Zero proof.** No screenshots, no numbers, no ratings anywhere on the page.
3. **Four products, identical weight.** No flagship, so nothing led.

Plus one thing that read as indecision: a five-option colour theme picker (🎨).

## What changed

### Design system (`assets/css/style.css`) — full rewrite

| Token | v1 | v2 |
|---|---|---|
| `--bg` | `#0f3d4f` (mid teal — reads as "coloured page") | `#0c0c0e` (near-black, warm) |
| `--accent` | `#d4a574` (gold, low contrast on teal) | `#f59e0b` (amber, action-only) |
| Type scale | ad-hoc sizes | `--fs-display` … `--fs-xs`, 1.25 ratio, clamped |
| Themes | 5 swappable palettes | 1 committed palette |

Token **names** were kept v1-compatible (`--bg`, `--accent`, `--text-secondary`, …)
so the still-unmigrated `gaincut/`, `pawmind/`, `speakable/`, `kidlaunch/` pages
inherit the new surface colours without being edited. **They have not been
migrated to the v2 layout** — see Follow-up.

### Homepage (`index.html`) — rewrite

- **Hero**: two-column. Claim left, two real GainCut screenshots in phone frames
  right, bleeding slightly past the container.
- **Proof bar**: three claims that are checkable, not adjectives.
- **Products**: GainCut is now a **wide feature card** with the *"How your target
  is calculated"* screenshot (BMR 1,577 + 220 active = 1,798 TDEE, + 300 surplus
  = 2,098 budget). PawMind / Art of War / KidLaunch sit below as equal cards.
- **Process**: 4-up grid, one line each.
- **About**: rewritten, lead with the honest origin (screen-time argument).
- Copy now names the enemy from the App Store listing: *"a measurement problem,
  not a discipline problem."*

### JS (`assets/js/main.js`) — rewrite

Removed the five-theme switcher, `localStorage` theme persistence, and dropdown
handling. Kept: nav scroll state, mobile menu, reveal-on-scroll, footer year.

## Bug found and fixed during the build

The *"How your target is calculated"* screenshot is a **landscape card crop**
(1206×937, aspect 1.287). It was first placed inside a `.phone` frame, whose
screen is aspect ~0.46. With `object-fit: contain` this letterboxed it into a
thin strip with roughly 65% dead space.

Measured: `displayed aspect 0.460` vs `natural aspect 1.287`.
After fix: `displayed 1.287` vs `natural 1.287`.

Landscape crops now use `.feature-card-shot` (free-standing card + caption).
Only full phone screenshots (1206×2622) go inside `.phone`.

## Tests

| Suite | Result |
|---|---|
| `tests/homepage-regression.sh` | PASS |
| `tests/homepage.spec.ts` (new, 8 tests) | 8/8 |
| `tests/kidlaunch-story.spec.ts` (existing, 9 tests) | 9/9 |
| **Total Playwright** | **17/17** |

### `homepage-regression.sh` was rewritten, not deleted

The old version asserted on markup v2 intentionally removed — the hero logo
`<img>`, the PawMind video/poster tab widgets, the old product-card poster
markup. It failed on the first run (`Hero logo source changed unexpectedly`).
Those assertions were right for their era and became wrong afterwards; they
would have blocked the redesign rather than protected it.

New guards:
1. Every `assets/` reference in `index.html` exists on disk
2. The theme picker stays deleted (markup **and** CSS)
3. All four products keep a real store/TestFlight link
4. Landscape crops stay out of phone frames
5. GA4 present
6. UTM tagging present

Guard #4 was **negative-tested**: injecting `macros.jpg` into a phone frame
produced the expected failure, then the file was restored and it passed again.
A test that cannot fail is not a test.

### Pitfalls hit

- `mapfile` is bash 4+; macOS ships bash 3.2 → `while IFS= read -r` loop.
- Guard #4 initially false-positived on the word "balance" inside an `alt`
  attribute → now matches the `src` filename stem only.

## Screenshots

Vincent supplied 7 real device screenshots. Copied to
`assets/images/gaincut/shots/` and `chmod 644`:

| File | Source | Placement |
|---|---|---|
| `dashboard.png` | 1206×2622 full screen | hero front phone |
| `snap.jpg` | 1206×2622 full screen | hero back phone |
| `target-math.jpg` | 1206×937 card | GainCut feature card |
| `recovery.jpg`, `macros.jpg`, `meals.jpg`, `balance.jpg` | card crops | available for the GainCut page |

`dashboard.png` was checked and contains **no personal body data** (no weight,
no body-fat %). The Body-tab screenshot showing 149.7 lb / 12.3% was **not**
used.

## Follow-up (not done)

- [ ] **Migrate `/gaincut/` to v2.** It is still on the old layout. The
      `Read the full story →` button on the homepage currently links to a page
      in the *old* visual language — the most visible inconsistency left.
- [ ] `/pawmind/`, `/speakable/`, `/kidlaunch/` — same migration, lower priority.
- [ ] The 6 unused GainCut screenshots (`recovery`, `macros`, `meals`, `balance`)
      are staged for the GainCut page rebuild.
- [ ] `sitemap.xml` — lastmod dates not bumped.

---

## Revision — posters restored + motion layer

Vincent, after previewing: *"The style looks okay. In terms of the pictures, I
think I need some animations to make it more engaging. Also, the pictures, like
my original ones, can you consider putting those back?"*

### Original posters restored

The first v2 pass replaced **all** artwork with the new device screenshots. That
was too aggressive — the PawMind and Art of War assets are **designed marketing
posters** (headline + phone + photography), not raw screenshots, and removing
them lost real work.

Now restored, with the intended split:

| Placement | What goes there | Why |
|---|---|---|
| Hero phone frames | Real device screenshots (`dashboard.png`, `snap.jpg`) | Actual UI beats illustration where the claim is "this is what it looks like" |
| Product cards | Designed posters (`pawmind-poster-1.png`, `art-of-war-poster.png`) | Marketing art earns its place at card scale |

**Not restored:** `idea-factory-logo.png` (the lightbulb illustration) in the
hero. The hero's job is to show product; a logo drawing does not do that job.
`gaincut-poster-1.png` (0.46 portrait welcome screen) also stays out of the hero —
`dashboard.png` is a better ambassador for the same slot.

⚠️ If Vincent meant "put the logo back in the hero", that is **not** what was
done here. The clarify question went unanswered, so the safest reading was taken
and flagged. Reverting is one edit in `index.html`.

### Bug found in the restoration itself

Restoring two posters onto three cards created a visible imbalance: PawMind and
Art of War had 150px image slots, KidLaunch had none, so its card was half empty
next to two image-led cards.

Fixed by giving KidLaunch an equal-height slot containing the **Kip guardian**
portrait (`assets/images/kidlaunch/kip.png`, copied from the KidLaunch repo) with
a caption. Measured after fix: all three cards **561px tall**, all three poster
slots **150px**, all bottoms at **609px**.

A test now asserts equal poster heights *and* equal card heights — the failure
mode was invisible in prose but obvious in a measured row.

### Motion layer

All motion is: meaning-bearing, transform/opacity only (no layout shift), and
fully disabled under `prefers-reduced-motion`.

| Motion | Where | Purpose |
|---|---|---|
| `hero-text-in` | Hero children, staggered 80ms | Gives the eye a reading path |
| `phone-in` / `phone-in-back` | Hero phones, 250ms/150ms delay | Product arrives, doesn't just exist |
| `glow-pulse` | Hero ambient glow, 9s loop | Reads as "alive" |
| `float-drift` | GainCut feature screenshot, 7s loop | Same |
| Reveal + stagger | Cards, process steps | Cascade rather than pop |
| Pointer tilt (≤4°) | Product cards, desktop only | Touchable, subtle |
| Poster zoom (1.04) | Card hover | Confirms interactivity |
| Sheen sweep | Primary buttons | Same |
| Logo rotate (−10°) | Nav hover | Small brand moment |

⚠️ **Reduced-motion needed a real fix, not just a duration override.** The first
version only set `animation-duration: 0.01ms`, which leaves an *infinite*
animation parked on its last keyframe — for `float-drift` that is a permanently
offset image. Now `animation: none !important` on both infinite loops, and a test
asserts `animationName === 'none'` under `reducedMotion: 'reduce'`.

### Tests after revision

| Suite | Result |
|---|---|
| `tests/homepage-regression.sh` | PASS (2 new poster guards added) |
| `tests/homepage.spec.ts` | **11/11** (3 new: posters+level row, hero animation settles, reduced-motion) |
| `tests/kidlaunch-story.spec.ts` | 9/9 |
| **Total** | **20/20** |
