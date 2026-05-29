#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_FILE="$ROOT_DIR/index.html"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  local file="$1"
  local text="$2"
  local label="$3"
  if ! grep -Fq "$text" "$file"; then
    fail "$label"
  fi
}

assert_file_exists() {
  local file="$1"
  local label="$2"
  if [[ ! -f "$file" ]]; then
    fail "$label"
  fi
}

# Asset existence guards
assert_file_exists "$ROOT_DIR/assets/images/idea-factory-logo.png" "Missing hero logo asset: assets/images/idea-factory-logo.png"
assert_file_exists "$ROOT_DIR/assets/images/bio/IdeaFactory-Bio.png" "Missing About bio image asset: assets/images/bio/IdeaFactory-Bio.png"
assert_file_exists "$ROOT_DIR/assets/products/pawmind/tester-video-1-web.mp4" "Missing PawMind video asset: assets/products/pawmind/tester-video-1-web.mp4"
assert_file_exists "$ROOT_DIR/assets/products/pawmind/test-video2-web.mp4" "Missing PawMind video asset: assets/products/pawmind/test-video2-web.mp4"
assert_file_exists "$ROOT_DIR/assets/images/pawmind/pawmind-poster-1.png" "Missing PawMind poster asset: assets/images/pawmind/pawmind-poster-1.png"
assert_file_exists "$ROOT_DIR/assets/images/pawmind/pawmind-poster-2.png" "Missing PawMind poster asset: assets/images/pawmind/pawmind-poster-2.png"
assert_file_exists "$ROOT_DIR/assets/images/pawmind/pawmind-poster-3.png" "Missing PawMind poster asset: assets/images/pawmind/pawmind-poster-3.png"
assert_file_exists "$ROOT_DIR/assets/images/art-of-war-poster.png" "Missing Art Of War poster asset: assets/images/art-of-war-poster.png"

# Markup contract guards
assert_contains "$INDEX_FILE" '<img src="assets/images/idea-factory-logo.png" alt="" class="hero-logo">' "Hero logo source changed unexpectedly"
assert_contains "$INDEX_FILE" 'src="assets/images/bio/IdeaFactory-Bio.png"' "About bio image source changed unexpectedly"
assert_contains "$INDEX_FILE" '<source src="assets/products/pawmind/tester-video-1-web.mp4" type="video/mp4">' "PawMind default video source changed unexpectedly"
assert_contains "$INDEX_FILE" 'poster="assets/images/pawmind/pawmind-poster-1.png"' "PawMind default poster changed unexpectedly"
assert_contains "$INDEX_FILE" 'data-video-src="assets/products/pawmind/tester-video-1-web.mp4"' "PawMind Video 1 tab source changed unexpectedly"
assert_contains "$INDEX_FILE" 'data-video-src="assets/products/pawmind/test-video2-web.mp4"' "PawMind Video 2 tab source changed unexpectedly"
assert_contains "$INDEX_FILE" 'data-poster-src="assets/images/pawmind/pawmind-poster-1.png"' "PawMind Poster 1 source changed unexpectedly"
assert_contains "$INDEX_FILE" 'data-poster-src="assets/images/pawmind/pawmind-poster-2.png"' "PawMind Poster 2 source changed unexpectedly"
assert_contains "$INDEX_FILE" 'data-poster-src="assets/images/pawmind/pawmind-poster-3.png"' "PawMind Poster 3 source changed unexpectedly"
assert_contains "$INDEX_FILE" '<img class="product-card-poster" src="assets/images/art-of-war-poster.png" alt="Art Of War AI poster">' "Art Of War poster markup changed unexpectedly"

# Prevent accidental fallback to MOV sources in the card tabs
if grep -Fq 'data-video-src="assets/products/pawmind/tester-video-1.MOV"' "$INDEX_FILE" || \
   grep -Fq 'data-video-src="assets/products/pawmind/Test-video2.MOV"' "$INDEX_FILE"; then
  fail "PawMind tabs must use web MP4 sources, not MOV files"
fi

echo "PASS: Homepage asset and video-source regression checks"
