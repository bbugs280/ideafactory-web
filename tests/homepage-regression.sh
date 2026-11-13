#!/usr/bin/env bash
# Homepage regression checks for ideafactory.one
#
# Rewritten 2026-11-13 for the v2 design system. The previous version
# asserted on markup the redesign intentionally removed (the hero logo
# illustration, the PawMind video/poster tab widgets, the old product-card
# poster markup). Those assertions were correct for their era and wrong
# afterwards — they would have blocked the redesign rather than protected it.
#
# This version guards the things that must stay true:
#   1. Every referenced asset exists on disk (no broken images in prod)
#   2. The five colour themes stay deleted (the theme picker is gone by design)
#   3. Landed-and-shipped products carry a real store/TestFlight link
#   4. Card screenshots are NOT placed in .phone frames (aspect mismatch)
#   5. GA4 is present on the page
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_FILE="$ROOT_DIR/index.html"
CSS_FILE="$ROOT_DIR/assets/css/style.css"

fail() { echo "FAIL: $1" >&2; exit 1; }

assert_contains() {
  local file="$1" text="$2" label="$3"
  grep -Fq "$text" "$file" || fail "$label"
}

assert_not_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq "$text" "$file"; then fail "$label"; fi
}

assert_file_exists() {
  local file="$1" label="$2"
  [[ -f "$file" ]] || fail "$label"
}

# ---------------------------------------------------------------
# 1. Every local asset referenced in index.html must exist.
#    Catches the classic "image works locally, 404s on Pages" break.
# ---------------------------------------------------------------
# NOTE: macOS ships bash 3.2 — no `mapfile`/`readarray`. Use a while-read loop.
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  assert_file_exists "$ROOT_DIR/$rel" "index.html references missing asset: $rel"
done < <(
  grep -oE '(src|href)="(assets/[^"]+)"' "$INDEX_FILE" \
    | sed -E 's/^[^"]*"//; s/"$//' \
    | sort -u
)

# ---------------------------------------------------------------
# 2. Theme picker must stay deleted (design system v2 commits to one palette).
# ---------------------------------------------------------------
assert_not_contains "$INDEX_FILE" 'theme-toggle' \
  "Theme picker markup is back — v2 design system removed the 5-theme switcher"
assert_not_contains "$INDEX_FILE" 'data-theme=' \
  "Theme option markup is back — v2 design system removed the 5-theme switcher"
assert_not_contains "$CSS_FILE" ':root[data-theme=' \
  "Per-theme CSS blocks are back — v2 design system removed the 5-theme switcher"

# ---------------------------------------------------------------
# 3. Shipped products must link to a real destination.
# ---------------------------------------------------------------
assert_contains "$INDEX_FILE" 'apps.apple.com/hk/app/gaincut/id6785259813' \
  "GainCut App Store link missing — flagship product has no working CTA"
assert_contains "$INDEX_FILE" 'testflight.apple.com/join/7RhaGQSg' \
  "PawMind TestFlight link missing"
assert_contains "$INDEX_FILE" 'testflight.apple.com/join/QtY29Gbq' \
  "Art of War TestFlight link missing"
assert_contains "$INDEX_FILE" 'kidlaunch.beets3d.com' \
  "KidLaunch link missing"

# ---------------------------------------------------------------
# 3b. Restored designed posters must stay on their cards.
#     These were removed in the first v2 pass and Vincent asked for them
#     back by name ("the pictures, like my original ones"). Guards against
#     a future cleanup silently dropping them again.
# ---------------------------------------------------------------
assert_contains "$INDEX_FILE" 'pawmind/pawmind-poster-1.png' \
  "PawMind designed poster missing from its card"
assert_contains "$INDEX_FILE" 'art-of-war-poster.png' \
  "Art of War designed poster missing from its card"

# ---------------------------------------------------------------
# 4. Regression guard: landscape card screenshots must not go inside a
#    phone frame. A phone screen is aspect ~0.46; the card crops are ~1.29.
#    Putting one inside the other letterboxes it into a thin strip.
#    (This actually happened during the v2 build — see style.css comment.)
# ---------------------------------------------------------------
if grep -q 'target-math' "$INDEX_FILE" && grep -q 'class="phone-screen"' "$INDEX_FILE"; then
  # If anything inside a phone-screen references a card crop, fail.
  # Match on the src FILENAME only — matching raw text gives a false
  # positive on alt attributes (dashboard.png's alt legitimately contains
  # the words "7-day balance").
  python3 - "$INDEX_FILE" <<'PY'
import re, sys
html = open(sys.argv[1]).read()
card_crops = ('target-math', 'recovery', 'macros', 'meals', 'balance')
bad = []
for m in re.finditer(r'class="phone-screen".*?</div>', html, re.S):
    for src in re.findall(r'<img[^>]+src="([^"]+)"', m.group(0)):
        stem = src.rsplit('/', 1)[-1].split('.')[0]
        if stem in card_crops:
            bad.append(src)
if bad:
    print(f"FAIL: landscape card screenshot(s) placed inside a phone frame: {bad}", file=sys.stderr)
    print("      Use .feature-card-shot instead — see style.css", file=sys.stderr)
    sys.exit(1)
PY
else
  fail "Phone-frame guard could not run — expected markup not found"
fi

# ---------------------------------------------------------------
# 5. Analytics must be present so referral traffic is measurable.
# ---------------------------------------------------------------
assert_contains "$INDEX_FILE" 'G-QF4NXDNN3P' \
  "GA4 measurement ID missing from index.html"

# ---------------------------------------------------------------
# 6. UTM tagging on outbound store links (attribution).
# ---------------------------------------------------------------
assert_contains "$INDEX_FILE" 'utm_source=ideafactory' \
  "Outbound links lost UTM tagging"

echo "PASS: Homepage regression checks (v2 design system)"
