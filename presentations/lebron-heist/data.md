# Verified data + my calculations — "Biggest Heist" rebuild
All regular season unless noted. RS = regular season.

## The video being recreated
- TikTok @leah.cammarano, 2:52, "LeBron going to the 76ers is the biggest heist in NBA free agency history"
- Structure: intro thesis → Log5 Finals-probability curve (45w=4% → 51w=12%, "3.2x") →
  five player charts (Maxey 55/36/45 unassisted; Brown 36/46/48 assisted; Embiid 37/52/42 rim;
  Edgecombe 8/10/12 corner-3; LeBron usage 27.2→22, TS .594→.627 "63%") → outro.

## Contract (verified)
- 2 yr / ~$8M vet minimum, player option yr 2. 2026-27 salary/cap hit $3,876,529; 2027-28 option $4,070,355. [NBC Sports, CBS Sports]
- Lakers 2025-26 salary: $52.6M ("nearly $53M"). Pay cut >90%, biggest in NBA history. [Fortune, NBA.com]
- Cap 2026-27: $164.961M → LeBron = 2.35% of cap. Tax line $200.428M. [NBA.com]
- Sixers payroll after moves: $209.47M, $457,507 over first apron. [SixersHoops]
- CBS: production value ≈ $28M vs min salary (verify final # vs my own $/win calc).
- Announced Fri Jul 24, 2026 on X; "This is my last decision... I still want to compete, to win."
- Jaylen Brown trade Jul 2, 2026: BOS→PHI for Paul George + 2 firsts (2028, 2031 unprot) + 2 seconds.
- Projected five: Maxey, Edgecombe, Brown, LeBron, Embiid — 36 All-Star selections, 5 MVPs combined.

## Market shock (verified, for "the market agrees" slide)
- StubHub demand 207x, search 470x (Jill Gonzalez, StubHub, to 6abc).
- SeatGeek get-in Oct 16 preseason vs BOS: $107 → $540 in under an hour (peak; later ~$322).
- Fanatics/NBA store sold out LeBron #23 Sixers jerseys in ~2 hours. Title odds +2000 → +1000 (book-dependent).
- Gov. Shapiro declared Jul 24 "LeBron James Day" in PA.

## 2025-26 verified stats (pbpstats API ⨯ Basketball-Reference ⨯ StatMuse — all agree)
- League: assisted share of FGM 63.7% → unassisted 36.3%. TS .581, ORtg 115.8. (video league bar: 36 ✓)
- Maxey: 70 GP, 694 FGM (474 2P, 220 3P), 28.3 ppg. Assisted 44.7% → UNASSISTED 55.3% (video: 55 ✓, n=694 ✓)
- Brown 25-26: 71 GP, 736 FGM, 28.7 ppg, USG 36.2. Assisted 36.4% (video: 36 ✓, n=736 ✓)
- Brown 23-24: 627 FGM, USG 28.9. Assisted 47.6% (video said 46 — minor discrepancy)
- Embiid: 38 GP, 341 FGM. At-rim makes 119/341 = 34.9% (pbpstats); BBRef 0-3ft ≈31%. (video said 37 — not supported; use 34.9)
- Edgecombe: 75 GP, 451 FGM, 149 3PM, 16.0 ppg. Corner-3 makes 25 (pbpstats) = 5.5% of FGM (video said 8 — not supported).
  3P makes 81.2% assisted.
- LeBron: 60 GP, 33.2 mpg, 20.9 ppg, 432 AST (video's "765 assists" is wrong), USG 27.2 (video ✓), TS .594 (video ✓).
- Sixers 2025-26: 45-37, SRS -0.27 (outscored!), 7-seed → beat BOS 4-3 R1 (first 3-1 comeback in franchise history) → swept by champion NYK.
- East 2025-26 standings: DET 60 (SRS 7.53), BOS 56 (7.37), NYK 53 (6.05, champ), CLE 52, TOR 46, ATL 46, PHI 45, ORL 45 (8th).
- 2026 Finals: NYK (3) def SAS (2, 62-20) 4-1.

## LeBron-arrival teammate effect (pbpstats, first yr with LeBron vs yr before)
assisted share of FGM:
- Love .655→.794 (+13.9); Bosh .498→.603 (+10.5); AD .653→.632 (−2.1)  [bigs mean +7.4]
- Kyrie .310→.325 (+1.5, 3P asst 45.5→61.8); Mo Williams .340→.466 (+12.6); DLo .434→.545 (+11.1) [guards mean +8.4]
- All mean +7.9.

## Finals-berth empirics (Wikipedia champions list + season standings, 1984-2026, n=86 berths)
- Median finalist: 58 wins. Full 82-game seasons: 50+ wins = 75/78 berths (96.2%); 44-47 wins = 2/78 (2.6%)
  (1995 HOU 47w champ; 2023 MIA 44w). No 7-seed has EVER made the Finals; 1-seed 50%, 2-seed 27.9%, 3-seed 11.6%, 4-seed 4.7%.

## MY MODEL (model.py)
Log5 single-game + home-court odds ×1.21 (54.8% home base), exact best-of-7 (2-2-1-1-1), three rounds.
Generic gauntlet [48, 53, 57] wins; home court iff W ≥ opponent:
- 42w 0.99% | 45w 2.10% | 48w 4.41% | 51w 8.06% | 52w 9.71% | 55w 17.1% | 58w 28.2%
- 45→51: 3.8x. 45→52: 4.6x. (video: 4%→12% = 3.2x/"triple" — same shape, my baseline better matches the 2.6% empirical rate)
- Bracket-aware reality check: actual 2026 path (7-seed: BOS/NYK/DET, no HC) = 0.75%;
  51w as ~4-5 seed = 4.6%; 52w with R1 HC = 7.9%.

## MY PROJECTIONS (projections.py)
- Maxey: unassisted 55.3% → 46.9% (guard-comp mean +8.4 assisted). Range 42.7-53.8. (video: 45)
- Brown: assisted 36.4% → restore 47.6 (2023-24 w/ healthy Tatum) + ½·7.9 = 51.6% ≈ 50-52. (video: 48)
- Embiid rim share: 34.9% → PENDING LeBron assist-location data (video: 37→42)
- Edgecombe corner-3 share: 5.5% → PENDING (video: 8→12)
- LeBron usage/TS: PENDING career data (video: 27.2→22 usage; .594→.627 TS)
- Wins: PENDING LeBron value metrics + market totals (video: 45→51)

## Palette (validated, dataviz six checks pass)
baseline 3659A8 · flaw/current C8102E · LeBron input 0091E6 · projection 1E7A46; surface FFFFFF; navy title slides 002B5C.
