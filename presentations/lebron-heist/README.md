# The Biggest Heist in NBA Free Agency History

A data-driven presentation on what LeBron James signing with the Philadelphia 76ers
(July 24, 2026 — 2 yr / $8M, player option) actually means. Every number is derived
from primary stat sources; every projection comes from a model in this folder.

## Deliverable

- `lebron-sixers-heist.pptx` — the 12-slide deck (PowerPoint, native charts)
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
- `data.md` — the full verified fact base with sources.
- `gen_deck.js` — deck generator (pptxgenjs).

## The argument in one paragraph

The 2025-26 Sixers won 45 games while being outscored — a team whose one structural
flaw was that nobody created easy shots for anyone else. LeBron James, whose offenses
finished top-5 in 9 of 10 seasons as he ran them and whose assists disproportionately
create rim shots and corner threes, signed for 2.35% of the salary cap. The roster
upgrades project to ~51 wins (the betting market opened at 50.5), and because Finals
probability is logistic in wins, those six extra wins nearly quadruple the Sixers'
chance of reaching the Finals. Modeled production value: ~$21.9M. Price: $3.88M.
