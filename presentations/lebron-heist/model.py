"""
Independent rebuild of the 'biggest heist' analysis.
All formulas implemented from scratch; data slots filled from verified sources.

Model 1: Log5 Finals-probability curve
--------------------------------------
- Team quality expressed as regular-season win fraction p = W/82.
- Single-game Log5 (Bill James): P(A beats B) = pA(1-pB) / (pA(1-pB) + pB(1-pA)).
- Home-court: home team win prob gets multiplicative odds boost h (NBA home teams
  win ~54.8% of games in recent seasons -> h = 0.548/0.452 odds factor applied
  as +/- adjustment per game).
- Best-of-7, 2-2-1-1-1 format, higher seed hosts G1,2,5,7.
- Reaching the Finals = winning 3 rounds. Opponent quality by round is set from
  the actual Eastern Conference landscape (win totals filled from research).
"""

from itertools import product

def log5(pa: float, pb: float) -> float:
    return pa * (1 - pb) / (pa * (1 - pb) + pb * (1 - pa))

def game_prob(pa: float, pb: float, a_home: bool, home_edge_odds: float = 1.21) -> float:
    """Log5 with home-court as an odds multiplier.
    home_edge_odds = (league home win%)/(1 - league home win%) / 1  -> ~0.548 home
    win rate for evenly matched teams => odds factor 0.548/0.452 = 1.212."""
    base = log5(pa, pb)
    odds = base / (1 - base)
    odds *= home_edge_odds if a_home else (1 / home_edge_odds)
    return odds / (1 + odds)

HOME_PATTERN = [True, True, False, False, True, False, True]  # 2-2-1-1-1 for higher seed

def series_prob(pa: float, pb: float, a_has_homecourt: bool) -> float:
    """P(team A wins best-of-7). Exact enumeration over game outcomes."""
    pattern = HOME_PATTERN if a_has_homecourt else [not x for x in HOME_PATTERN]
    pwin = 0.0
    # enumerate sequences of game winners until one side hits 4
    def rec(w_a, w_b, g, prob):
        nonlocal pwin
        if w_a == 4:
            pwin += prob
            return
        if w_b == 4:
            return
        p = game_prob(pa, pb, pattern[g])
        rec(w_a + 1, w_b, g + 1, prob * p)
        rec(w_a, w_b + 1, g + 1, prob * (1 - p))
    rec(0, 0, 0, 1.0)
    return pwin

def finals_prob(team_wins: float, opponents: list, team_seed_better: list) -> float:
    """P(reach Finals) = product of three series wins.
    opponents: list of 3 opponent win totals (R1, R2=semis, R3=conf finals)
    team_seed_better: list of 3 bools - does our team hold home court that round."""
    p = team_wins / 82.0
    prob = 1.0
    for opp_w, hc in zip(opponents, team_seed_better):
        prob *= series_prob(p, opp_w / 82.0, hc)
    return prob

if __name__ == "__main__":
    # sanity checks with placeholder opponents (to be replaced with real East data):
    # 45-win team as low seed: faces 52, 55, 58-win teams, never home court
    lo = finals_prob(45, [52, 55, 58], [False, False, False])
    # 51-win team as mid seed: faces 47, 55, 58, home court in R1 only
    hi = finals_prob(51, [47, 55, 58], [True, False, False])
    print(f"placeholder: 45w -> {lo:.3%}   51w -> {hi:.3%}   ratio {hi/lo:.2f}x")
