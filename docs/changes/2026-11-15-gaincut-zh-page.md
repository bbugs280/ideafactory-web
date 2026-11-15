# 2026-11-15 — GainCut Cantonese page `/gaincut/zh/`

**Type:** Site — new language version of the product page
**Purpose:** reach the HK Cantonese-reading audience that the English page cannot serve. The page's
entire claim is *"this app understands your food"* — writing that in English undercuts it.

## What shipped

- **`/gaincut/zh/`** — all nine sections translated into **Traditional Chinese, Cantonese written
  register** (嘅 係 唔 咗 喺 嘢 嚟 嗰 乜 瞓), per Vincent's decision on 2026-11-15.
- English kept as sublines only where the app UI is English (macro names, phase names, Apple Health
  terms). A Chinese page describing an English app in fully-Chinese vocabulary would mislead.
- **`hreflang` pairs both ways**: `en`, `zh-Hant-HK`, `x-default` on both pages.
- **Language switch** in both footers (`中文` / `English`), firing `lang_switch` with a direction
  suffix so the two directions are separable in GA4.
- **`utm_content=zh`** on every App Store link on the ZH page, so ZH traffic is attributable.
- `sitemap.xml` — `/gaincut/zh/` added, both GainCut URLs re-dated 2026-11-15.

## ⚠️ The near-miss worth recording: Inter-first font stack

**First implementation put `Inter` before `Noto Sans TC` in the body font stack.**

Measured result:
```
document.fonts.check('16px "Noto Sans TC"')   → false
Noto Sans TC faces                            → 72 loaded / 360 unloaded
```

Inter claims the glyph slot, so the browser never fetches the CJK face. **The page still looked
perfect on macOS** because PingFang HK covered every character as a system fallback. It would have
shipped and rendered as boxes for any Windows visitor.

⇒ CJK families must **lead** the stack on a Chinese page. Latin-only runs (numbers, prices, brand
names) get their own Inter rule instead of dragging Inter to the front globally.

This is the same failure class as the screenshot slot mislabel: **the local environment hid the
defect, and only a measurement caught it.**

## Tests

**12 new tests** in `tests/gaincut-zh.spec.ts`:

| Test | Guards |
|---|---|
| `lang` attribute | declares `zh-Hant-HK` |
| **CJK webfont actually loads** | the Inter-first bug — negative-tested, fails when the bug is re-injected |
| **no tofu** | the ten Cantonese particles measure differently from a missing glyph |
| hreflang both ways | reciprocal pairing on both pages |
| language switch | fires `lang_switch`, points at the twin |
| pricing | US$1.99 / US$14.99 / 45% present, **37% forbidden** |
| UTM tags | every store badge carries `utm_content=zh` |
| honesty table | all five rows survive translation |
| 7 FAQs | present and openable |
| narrow viewport | no horizontal overflow at 390px |
| canonical | points at the ZH URL |

**Full suite: 65/65 pass** (was 44 on the two prior spec files; ZH adds 12, and the EN analytics
test was rewritten — see below).

## Rewritten test: `no analytics attribute is left unread by main.js`

The old version collected same-site `[data-ga]` elements and asserted the set was empty. It only
passed because every `data-ga` at the time was an off-site App Store link. The moment a same-site
one appeared (the `中文` switch, `href="zh/"`), it failed **even though the listener was attached** —
proven by stubbing `gtag` and clicking.

Presence of an attribute is not evidence of a missing listener. The test is now **behavioural**: it
stubs `gtag`, dispatches a click on every `[data-ga]` anchor, and asserts each declared event name
actually fired. That catches the original bug (dead attribute) without false-failing on wired
same-site links.

## Open

- ⚠️ **Cantonese register is mine, not native-verified.** Flagged to Vincent: pricing copy and the
  `#limits` table are where register errors are most likely. He should read those two before this is
  treated as final.
- The trailing `│` and gap style choices were inherited from the EN page, not re-designed.
