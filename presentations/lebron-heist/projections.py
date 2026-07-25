"""
Independent projections for the 'biggest heist' rebuild.
Every input below is verified (source noted in data.md / final deck).
Regular season only throughout.
"""

# ---------- verified 2025-26 inputs (pbpstats API + Basketball-Reference, cross-checked) ----------
MAXEY = dict(fgm=694, fgm2=474, fgm3=220, ast2=.378, ast3=.595, gp=70, ppg=28.3)
BROWN_2526 = dict(fgm=736, fgm2=596, fgm3=140, ast2=.324, ast3=.536, usage=.362)
BROWN_2324 = dict(fgm=627, fgm2=482, fgm3=145, ast2=.429, ast3=.634, usage=.289)
EMBIID = dict(fgm=341, rim_fgm=119, gp=38)          # pbpstats 'at rim'
EDGECOMBE = dict(fgm=451, fgm3=149, corner3m=25, ast3=.812)  # pbpstats corner-3 makes
LEBRON_2526 = dict(gp=60, mpg=33.2, ppg=20.9, apg=7.2, ast=432, usage=.272, ts=.594)
LEAGUE = dict(assisted_share=.637, ts=.581, ortg=115.8)

def assisted_share(d):
    return (d['fgm2']*d['ast2'] + d['fgm3']*d['ast3']) / d['fgm']

# ---------- verified LeBron-arrival deltas (pbpstats, first season w/ LeBron vs season before) ----
# player: (before_assisted_share, with_assisted_share)
ARRIVALS = {
    'Kevin Love (big)':      (.655, .794),
    'Kyrie Irving (guard)':  (.310, .325),
    'Chris Bosh (big)':      (.498, .603),
    'Anthony Davis (big)':   (.653, .632),
    'Mo Williams (guard)':   (.340, .466),
    "D'Angelo Russell (guard)": (.434, .545),
}

def arrival_deltas():
    out = {}
    for k, (b, a) in ARRIVALS.items():
        out[k] = a - b
    return out

if __name__ == "__main__":
    d = arrival_deltas()
    guards = [v for k, v in d.items() if 'guard' in k]
    bigs = [v for k, v in d.items() if 'big' in k]
    alln = list(d.values())
    print("== arrival deltas (assisted share of FGM) ==")
    for k, v in d.items():
        print(f"  {k:26s} {v:+.3f}")
    print(f"  guards mean {sum(guards)/len(guards):+.3f}  bigs mean {sum(bigs)/len(bigs):+.3f}  all mean {sum(alln)/len(alln):+.3f}")

    print("\n== 2025-26 verified baselines ==")
    mx = assisted_share(MAXEY)
    print(f"  Maxey assisted {mx:.3f} -> unassisted {1-mx:.3f}")
    b26 = assisted_share(BROWN_2526); b24 = assisted_share(BROWN_2324)
    print(f"  Brown assisted 25-26 {b26:.3f} | 23-24 {b24:.3f}")
    print(f"  Embiid rim share {EMBIID['rim_fgm']/EMBIID['fgm']:.3f}")
    print(f"  Edgecombe corner-3 share of FGM {EDGECOMBE['corner3m']/EDGECOMBE['fgm']:.3f}")

    # ---------- Maxey projection ----------
    # Method: Maxey = incumbent primary guard becoming 1B next to LeBron.
    # Guard comps: Kyrie (+.015), Mo Williams (+.126), DLo (+.111).
    # Kyrie down-weighted 0.5? No - keep simple transparent mean of guard deltas.
    g_mean = sum(guards)/len(guards)
    mx_proj_assisted = mx + g_mean
    print(f"\n  Maxey projected assisted {mx_proj_assisted:.3f} -> unassisted {1-mx_proj_assisted:.3f}"
          f"  [guard-comp mean {g_mean:+.3f}]")
    # range: Kyrie-only (conservative) to Mo/DLo mean (aggressive)
    lo = mx + min(guards); hi = mx + max(guards)
    print(f"    range: unassisted {1-hi:.3f} (max effect) to {1-lo:.3f} (min effect)")

    # ---------- Brown projection ----------
    # Method: step 1 - restore to healthy-costar baseline (47.6% assisted, 2023-24).
    # step 2 - LeBron premium above a generic costar: mean arrival delta for
    # non-primary scorers joining LeBron minus what a normal costar provides.
    # Transparent proxy: half the all-comp mean delta applied to the restored baseline.
    all_mean = sum(alln)/len(alln)
    br_proj = b24 + all_mean/2
    print(f"  Brown projected assisted {br_proj:.3f}  [restore {b24:.3f} + ½·{all_mean:+.3f}]"
          "")
