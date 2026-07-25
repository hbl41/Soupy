# The Biggest Heist in NBA Free Agency History — rebuilt with verified data

A data-verified recreation of the viral TikTok breakdown (by @leah.cammarano) of what
LeBron James signing with the Philadelphia 76ers (July 24, 2026 — 2 yr / $8M, player
option) actually means. Her structure and thesis are kept; **every number was
independently re-derived** from primary stat sources, and the deck flags where the
video's numbers did and didn't survive verification.

## Deliverable

- `lebron-sixers-heist.pptx` — the 13-slide deck (PowerPoint, native charts)
- `lebron-sixers-heist.pdf` — rendered preview

## Analysis (all numbers reproducible)

- `model.py` — Log5 single-game odds + home-court (odds x1.21), exact best-of-7
  enumeration (2-2-1-1-1), three playoff rounds vs a 48/53/57-win gauntlet.
  Output: 45 wins -> 2.1% Finals probability; 51 -> 8.1% (3.8x); 52 -> 9.7% (4.6x).
- `projections.py` — verified 2025-26 shot-profile baselines (pbpstats API,
  cross-checked vs Basketball-Reference to the decimal) + the measured
  "first season with LeBron" assisted-share deltas for six stars (Love, Bosh, AD,
  Kyrie, Mo Williams, D'Angelo Russell).
- `final_calcs.py` — every projection used in the deck: Maxey, Brown, Embiid,
  Edgecombe, LeBron usage/TS, the 41+5+3+2=51 win ledger, and the value math
  ($3.876M salary vs ~$21.9M modeled market value = 18 cents on the dollar).
- `curve.json` — the computed Finals-probability curve feeding slide 5.
- `data.md` — the full verified fact base with sources and the video-vs-verified
  discrepancy log.
- `gen_deck.js` — deck generator (pptxgenjs).

## Headline findings

- Her data was largely excellent: Maxey (55% unassisted, n=694), Brown (36%
  assisted, n=736), league mean (36%), and LeBron's usage/TS (27.2% / .594) all
  verify exactly.
- Two real errors: "52% of LeBron's 765 assists at the rim" (actual: 42.1% of 432)
  and the Edgecombe corner-3 chart (8% -> 12%; actual 5.5% -> ~7%).
- Her Finals curve had the right shape but a soft baseline: empirically, 44-47-win
  teams took 2 of 78 full-season Finals berths since 1984, and no 7-seed has ever
  made the Finals. My model's 45-win figure (2.1%) matches the 2.6% empirical rate.
- The heist quantified: the market projects ~50.5-51 wins (FanDuel) and the value
  models put his production near $22M — Philadelphia pays $3.88M.
