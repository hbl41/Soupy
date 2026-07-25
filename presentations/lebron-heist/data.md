# Verified data + calculations — "The Biggest Heist in NBA Free Agency History"
All regular season unless noted. RS = regular season.

## Contract (verified)
- 2 yr / ~$8M vet minimum, player option yr 2. 2026-27 salary/cap hit $3,876,529; 2027-28 option $4,070,355. [NBC Sports, CBS Sports]
- Lakers 2025-26 salary: $52.6M ("nearly $53M"). Pay cut >90%, biggest in NBA history. [Fortune, NBA.com]
- Cap 2026-27: $164.961M → LeBron = 2.35% of cap. Tax line $200.428M. [NBA.com]
- Sixers payroll after moves: $209.47M, $457,507 over first apron. [SixersHoops]
- Production value ≈ $28.2M for 2025-26, $21.9M aging-regressed for 2026-27 (Sporting News salary model, via CBS).
- Announced Fri Jul 24, 2026 on X; "This is my last decision... I still want to compete, to win."
- Jaylen Brown trade Jul 2, 2026: BOS→PHI for Paul George + 2 firsts (2028, 2031 unprot) + 2 seconds.
- Projected five: Maxey, Edgecombe, Brown, LeBron, Embiid — 36 All-Star selections, 5 MVPs combined.

## Market shock (verified)
- StubHub demand 207x, search 470x (Jill Gonzalez, StubHub, to 6abc).
- SeatGeek get-in Oct 16 preseason vs BOS: $107 → $540 in under an hour (peak; later ~$322).
- Fanatics/NBA store sold out LeBron #23 Sixers jerseys in ~2 hours. Title odds +2000 → +900 (DraftKings; book-dependent).
- Gov. Shapiro declared Jul 24 "LeBron James Day" in PA.

## 2025-26 verified stats (pbpstats API ⨯ Basketball-Reference ⨯ StatMuse — all agree)
- League: assisted share of FGM 63.7% → unassisted 36.3%. TS .581, ORtg 115.8.
- Maxey: 70 GP, 694 FGM (474 2P, 220 3P), 28.3 ppg. Assisted 44.7% → UNASSISTED 55.3%.
- Brown 25-26: 71 GP, 736 FGM, 28.7 ppg, USG 36.2. Assisted 36.4%.
- Brown 23-24: 627 FGM, USG 28.9. Assisted 47.6%.
- Embiid: 38 GP, 341 FGM. At-rim makes 119/341 = 34.9% (pbpstats); BBRef 0-3ft ≈31%.
- Edgecombe: 75 GP, 451 FGM, 149 3PM, 16.0 ppg. Corner-3 makes 25 (pbpstats) = 5.5% of FGM (BBRef corner definition ≈20).
  3P makes 81.2% assisted.
- LeBron: 60 GP, 33.2 mpg, 20.9 ppg, 432 AST, USG 27.2 (B-Ref; NBA.com formula 26.2 — both career lows), TS .594.
  Assist locations: 182 at-rim (42.1%), 51 corner-3 (11.8%), 93 above-break-3, 106 midrange. 2024-25: 46.6% rim, 12.5% corner.
  Career: best TS .649 (2013-14), career TS .590; rookie usage 28.2 was the previous low; peak 33.7 (2008-09).
  9 top-5 offenses in the 10 seasons 2008-09..2017-18 as primary hub (pbpstats ORtg ranks, ±1 borderline).
  162 corner-3 assists in 2016-17 — most ever recorded (NBA.com).
- Sixers 2025-26: 45-37, SRS -0.27 (outscored), 7-seed → beat BOS 4-3 R1 (first 3-1 comeback in franchise history) → swept by champion NYK.
- East 2025-26 standings: DET 60 (SRS 7.53), BOS 56 (7.37), NYK 53 (6.05, champ), CLE 52, TOR 46, ATL 46, PHI 45, ORL 45 (8th).
- 2026 Finals: NYK (3) def SAS (2, 62-20) 4-1.

## LeBron-arrival teammate effect (pbpstats, first yr with LeBron vs yr before)
assisted share of FGM:
- Love .655→.794 (+13.9); Bosh .498→.603 (+10.5); AD .653→.632 (−2.1)  [bigs mean +7.4]
- Kyrie .310→.325 (+1.5, 3P asst 45.5→61.8); Mo Williams .340→.466 (+12.6); DLo .434→.545 (+11.1) [guards mean +8.4]
- All mean +7.9.
Usage sheds on arrival (StatMuse): Bosh 28.5→23.4 (−5.1); Love 28.7→21.6 (−7.1).

## Finals-berth empirics (Wikipedia champions list + season standings, 1984-2026, n=86 berths)
- Median finalist: 58 wins. Full 82-game seasons: 50+ wins = 75/78 berths (96.2%); 44-47 wins = 2/78 (2.6%)
  (1995 HOU 47w champ; 2023 MIA 44w). No 7-seed has EVER made the Finals; 1-seed 50%, 2-seed 27.9%, 3-seed 11.6%, 4-seed 4.7%.

## MODEL (model.py)
Log5 single-game + home-court odds ×1.21 (54.8% home base), exact best-of-7 (2-2-1-1-1), three rounds.
Generic gauntlet [48, 53, 57] wins; home court iff W ≥ opponent:
- 42w 0.99% | 45w 2.10% | 48w 4.41% | 51w 8.06% | 52w 9.71% | 55w 17.1% | 58w 28.2%
- 45→51: 3.8x. 45→52: 4.6x. Model's 45w (2.1%) matches the 2.6% empirical rate for 44-47-win finalists.
- Bracket-aware reality check: actual 2026 path (7-seed: BOS/NYK/DET, no HC) = 0.75%;
  51w as ~4-5 seed = 4.6%; 52w with R1 HC = 7.9%.

## PROJECTIONS (projections.py, final_calcs.py)
- Wins: SRS-true 41 + LeBron +5 (VORP 2.8 in 60 GP ≈ 7.6 WOR, net of displaced minutes) + Brown-for-George full year +3
  + Embiid 38→~50 games +2 = 51. Market cross-check: FanDuel post-signing total 50.5.
- Maxey: unassisted 55.3% → 46.9% (guard-comp mean +8.4 assisted). Range 42.7-53.8.
- Brown: assisted 36.4% → restore 47.6 (2023-24 w/ healthy Tatum) + ½·7.9 = 51.6%.
- Embiid rim share: 34.9% → 41.2% (s=25% of makes LeBron-assisted at 60% big-target rim rate; range 38.9-43.9).
- Edgecombe corner-3 share: 5.5% → 6.9% (22% of makes LeBron-assisted at his 11.8% corner rate; range 6.5-7.4).
- LeBron: usage 27.2% → 21.5% (Bosh/Love arrival sheds); TS .594 → ~.615 (skill curve +0.4/usage pt − 1.0 age drag), range .60-.63.
- Value: $3.876M salary vs $21.9M modeled value → surplus ≈ $18M, 18 cents on the dollar;
  cross-check ~5 wins × ~$3.9M/win ≈ $20M.

## Palette (validated, dataviz six checks pass)
baseline 3659A8 · flaw/current C8102E · LeBron input 0091E6 · projection 1E7A46; surface FFFFFF; navy title slides 002B5C.
