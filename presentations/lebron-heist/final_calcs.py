"""Final numbers for the deck — every projection computed here, from verified inputs."""
from model import finals_prob
from projections import (MAXEY, BROWN_2526, BROWN_2324, EMBIID, EDGECOMBE,
                         LEBRON_2526, LEAGUE, assisted_share, arrival_deltas)

print("=" * 70)
print("1) FINALS PROBABILITY CURVE (Log5, 3 rounds, gauntlet 48/53/57, HC iff W>=opp)")
GAUNTLET = [48, 53, 57]
def p_finals(w):
    return finals_prob(w, GAUNTLET, [w >= o for o in GAUNTLET])
curve = {w: p_finals(w) for w in range(38, 67)}
for w in [45, 51, 52]:
    print(f"   {w}w -> {curve[w]:.2%}")
print(f"   45->51 ratio {curve[51]/curve[45]:.1f}x | 45->52 ratio {curve[52]/curve[45]:.1f}x")
print(f"   empirical check: 44-47w = 2/78 full-season Finals berths (2.6%) vs model 45w {curve[45]:.1%}")

print("=" * 70)
print("2) WIN PROJECTION LEDGER")
srs_true = 41.0  # 45-37 record but SRS -0.27 => ~41-win true talent (0 SRS = 41 wins)
lebron_wor = 2.8 * 2.7  # BBRef VORP 2.8 (60 GP) x 2.7 wins/VORP
lebron_net = 5.0        # vs the rotation player he displaces, availability-adjusted
brown_net = 3.0         # full season of Brown vs 2025-26 George (suspended 25 g, 16.7 ppg, 36yo)
embiid_net = 2.0        # 38 -> ~50 games sensitivity
proj = srs_true + lebron_net + brown_net + embiid_net
print(f"   SRS-true baseline {srs_true:.0f} + LeBron {lebron_net:+.0f} + Brown-for-George full yr {brown_net:+.0f}"
      f" + Embiid games {embiid_net:+.0f} = {proj:.0f} wins")
print(f"   (LeBron 2025-26 wins-over-replacement: VORP 2.8 x 2.7 = {lebron_wor:.1f} in 60 GP)")
print(f"   market cross-check: FanDuel post-signing win total 50.5 | video: 51")

print("=" * 70)
print("3) MAXEY — unassisted share of FGM")
mx = assisted_share(MAXEY)
d = arrival_deltas()
guards = [d['Kyrie Irving (guard)'], d['Mo Williams (guard)'], d["D'Angelo Russell (guard)"]]
g = sum(guards) / len(guards)
print(f"   2025-26: unassisted {1-mx:.1%} (694 FGM) | league {1-LEAGUE['assisted_share']:.1%}")
print(f"   projected: {1-(mx+g):.1%}  [guard-arrival mean {g:+.1%}; range {1-(mx+max(guards)):.1%}..{1-(mx+min(guards)):.1%}] | video: 45%")

print("=" * 70)
print("4) BROWN — assisted share of FGM")
b26, b24 = assisted_share(BROWN_2526), assisted_share(BROWN_2324)
allm = sum(d.values()) / len(d)
br = b24 + allm / 2
print(f"   2025-26 (Tatum hurt, USG 36.2): {b26:.1%} | 2023-24 (healthy co-star, USG 28.9): {b24:.1%}")
print(f"   projected: {br:.1%}  [restore {b24:.1%} + half arrival-mean {allm/2:+.1%}] | video: 48%")

print("=" * 70)
print("5) EMBIID — at-rim share of FGM")
e0 = EMBIID['rim_fgm'] / EMBIID['fgm']
LEBRON_RIM_AST = .421   # 182/432 assists at rim, 2025-26 (2024-25: .466)
def embiid_proj(s, r):   # s = share of Embiid FGM assisted by LeBron; r = rim rate of those
    return (1 - s) * e0 + s * r
lo, mid, hi = embiid_proj(.20, .55), embiid_proj(.25, .60), embiid_proj(.30, .65)
print(f"   2025-26: {e0:.1%} (119/341) | LeBron assist profile: {LEBRON_RIM_AST:.1%} at rim (all targets; bigs higher)")
print(f"   projected: {mid:.1%}  [s=25% of makes LeBron-assisted, rim rate 60% for a big target; range {lo:.1%}..{hi:.1%}]")
print(f"   video: 37% -> 42% (its 37% baseline & '52% of 765 assists' both unsupported; real: 34.9%, 42.1% of 432)")

print("=" * 70)
print("6) EDGECOMBE — corner-3 share of FGM")
c0 = EDGECOMBE['corner3m'] / EDGECOMBE['fgm']
LEBRON_C3_AST = .118    # 51/432 corner-3 assists 2025-26 (2024-25: .125); 162 in 2016-17 = record
def edge_proj(s):
    return (1 - s) * c0 + s * LEBRON_C3_AST
print(f"   2025-26: {c0:.1%} (25/451, pbpstats; BBRef-derived ~4.4%) | LeBron corner-3 assist share {LEBRON_C3_AST:.1%}")
print(f"   projected: {edge_proj(.22):.1%}  [22% of makes LeBron-assisted; range {edge_proj(.15):.1%}..{edge_proj(.30):.1%}]")
print(f"   video: 8% -> 12% (neither supported by shot data)")

print("=" * 70)
print("7) LEBRON — usage & TS")
u0, ts0 = .272, .594
drops = [28.5 - 23.4, 28.7 - 21.6]  # Bosh, Love verified usage sheds
shed = sum(drops) / len(drops)
u1 = u0 - shed / 100
ts_gain = shed * 0.4  # skill-curve: ~+0.3..0.6 TS pts per usage pt shed
age_drag = 1.0
ts1 = ts0 + (ts_gain - age_drag) / 100
print(f"   usage {u0:.1%} (career low; rookie low was 28.2%) -> {u1:.1%}  [star-arrival shed {shed:.1f} pts]")
print(f"   TS {ts0:.3f} -> {ts1:.3f}  [+0.4/usage-pt skill curve - 1.0 age drag]  range .60-.63")
print(f"   career-best TS .649 (2013-14); career .590 | video: 22% usage, .627 TS")

print("=" * 70)
print("8) THE HEIST, QUANTIFIED")
salary = 3.876529
worth_2526 = 28.2      # Sporting News salary model (via CBS), 2025-26 production
worth_2627 = 21.9      # same model, aging-regressed 2026-27
wins_x_price = 5.0 * 3.9  # my wins-added x ~$3.9M/win market rate cross-check
print(f"   salary $%.2fM = %.2f%% of the $164.961M cap" % (salary, 100 * salary / 164.961))
print(f"   market value: $28.2M (25-26 production) / $21.9M (26-27 projection) / cross-check {wins_x_price:.0f}M")
print(f"   surplus ~= ${worth_2627 - salary:.1f}M -> paying {100*salary/worth_2627:.0f} cents on the dollar")
print(f"   pay cut from $52.6M Lakers salary: {100*(1-8/ (52.6*2)):.0f}% over 2 yrs; -$48.7M/yr")

# dump curve for the deck chart
import json
json.dump({str(w): round(curve[w], 5) for w in curve}, open("curve.json", "w"), indent=0)
print("\ncurve.json written")
