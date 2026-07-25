// "The Biggest Heist in NBA Free Agency History" — every number derived from verified data.
const pptxgen = require("pptxgenjs");
const curve = require("./curve.json");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

// palette (validated)
const NAVY_BG = "002B5C";   // dark slides
const INK = "1C2B3A";       // body text
const MUTED = "5B6B7C";     // captions
const BASE = "3659A8";      // baseline bars
const RED = "C8102E";       // the flaw / current
const BLUE = "0091E6";      // LeBron input
const GREEN = "1E7A46";     // projection
const WHITE = "FFFFFF";
const SILVER = "C4CED4";

const HEAD = "Cambria";
const BODY = "Calibri";

const W = 13.33, M = 0.6;

// ---------- helpers ----------
function kicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: M, y: 0.42, w: W - 2 * M, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 12, bold: true, color: opts.color || RED,
    charSpacing: 2,
  });
}
function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: M, y: 0.72, w: opts.w || (W - 2 * M), h: 0.75, margin: 0,
    fontFace: HEAD, fontSize: opts.size || 30, bold: true, color: opts.color || NAVY_BG,
  });
}
function pageFoot(slide, n, note) {
  slide.addText(note, {
    x: M, y: 7.02, w: W - 2 * M - 0.5, h: 0.32, margin: 0, align: "left",
    fontFace: BODY, fontSize: 9, color: MUTED,
  });
  slide.addText(String(n), {
    x: W - M - 0.4, y: 7.02, w: 0.4, h: 0.32, margin: 0, align: "right",
    fontFace: BODY, fontSize: 9, color: MUTED,
  });
}
// one colored bar per category via one series per category (reliable per-bar color)
function barsChart(slide, x, y, w, h, cats, vals, colors, opts = {}) {
  const series = cats.map((c, i) => ({
    name: c,
    labels: cats,
    values: cats.map((_, j) => (j === i ? vals[i] : null)),
  }));
  slide.addChart(pres.ChartType.bar, series, {
    x, y, w, h,
    barDir: "col", barGrouping: "clustered", barOverlapPct: 100, barGapWidthPct: 55,
    chartColors: colors,
    showLegend: false, showTitle: false,
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelFormatCode: opts.fmt || '0.0"%"',
    dataLabelFontFace: BODY, dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelColor: INK,
    catAxisLabelColor: INK, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 10.5,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    valAxisMinVal: 0, valAxisMaxVal: opts.max,
    catAxisLineColor: SILVER, valAxisLineShow: false,
  });
}

// ============================================================ 1 TITLE
{
  const s = pres.addSlide();
  s.background = { color: NAVY_BG };
  s.addText("JULY 24, 2026  ·  PHILADELPHIA", {
    x: M, y: 1.55, w: 8, h: 0.35, margin: 0, fontFace: BODY, fontSize: 13,
    bold: true, color: "8FB8E8", charSpacing: 3,
  });
  s.addText("The Biggest Heist in\nNBA Free Agency History", {
    x: M, y: 1.95, w: 11.5, h: 2.3, margin: 0, fontFace: HEAD, fontSize: 47,
    bold: true, color: WHITE, lineSpacing: 54,
  });
  s.addText("What LeBron James to the 76ers actually means — every number derived from source data.", {
    x: M, y: 4.45, w: 9.6, h: 0.9, margin: 0, fontFace: BODY, fontSize: 17, color: "C9D8EA",
  });
  s.addText("Verified play-by-play stats, a from-scratch playoff-probability model, and measured history of what happens to teammates when LeBron arrives.", {
    x: M, y: 6.55, w: 11.5, h: 0.6, margin: 0, fontFace: BODY, fontSize: 11.5, color: "7E93AC",
  });
  s.addNotes("The thesis: LeBron going to the 76ers is the biggest heist in NBA free agency history — the player who has organized top-5 offenses as a solo hub for two decades signed for $8M over two years with the exact team whose fatal flaw is the thing he fixes.");
}

// ============================================================ 2 THE DEAL
{
  const s = pres.addSlide();
  kicker(s, "The deal");
  title(s, "A four-MVP resume at 2.35% of the salary cap");
  const cards = [
    ["2 yrs · $8M", "player option on 2027-28 ($4.07M)"],
    ["$3,876,529", "2026-27 cap hit — the 10+ yr veteran minimum"],
    ["–92%", "pay cut from his $52.6M Lakers salary, the largest in NBA history"],
    ["2.35%", "of the $164.96M cap for the all-time scoring leader (43,440 pts)"],
  ];
  const cw = 2.86, gap = 0.24;
  cards.forEach((c, i) => {
    const x = M + i * (cw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.75, w: cw, h: 1.9, rectRadius: 0.08, fill: { color: "F2F5F9" },
    });
    s.addText(c[0], { x: x + 0.18, y: 1.95, w: cw - 0.36, h: 0.6, margin: 0, fontFace: HEAD, fontSize: 25, bold: true, color: RED, align: "center" });
    s.addText(c[1], { x: x + 0.2, y: 2.62, w: cw - 0.4, h: 0.95, margin: 0, fontFace: BODY, fontSize: 11.5, color: INK, align: "center" });
  });
  s.addText("“This is my last decision. I’m not going for money. I’m not going for family… I still want to compete, to win and to have a chance at the feeling of winning another championship.”", {
    x: M, y: 4.0, w: 7.4, h: 1.5, margin: 0, fontFace: HEAD, fontSize: 15, italic: true, color: NAVY_BG,
  });
  s.addText("— LeBron James, announcing on X, entering season 24 at age 41 (42 on Dec 30)", {
    x: M, y: 5.42, w: 7.4, h: 0.4, margin: 0, fontFace: BODY, fontSize: 11, color: MUTED,
  });
  s.addText([
    { text: "The new starting five\n", options: { fontSize: 13, bold: true, color: NAVY_BG } },
    { text: "Maxey · Edgecombe · Brown · James · Embiid\n", options: { fontSize: 14, bold: true, color: RED } },
    { text: "36 All-Star selections and 5 MVP awards combined. Brown arrived July 2 from Boston for Paul George and four picks; LeBron arrived for the minimum.", options: { fontSize: 11.5, color: INK } },
  ], {
    x: 8.4, y: 4.0, w: 4.3, h: 2.2, margin: 0, fontFace: BODY, lineSpacing: 18,
  });
  pageFoot(s, 2, "Contract: Klutch to ESPN; cap figures NBA.com (2026-27 cap $164.961M). Salary history: Fortune. Roster: CBS Sports, NBC News.");
  s.addNotes("The deal itself: $3.876M year one with a year-two player option — the 10+ year veteran minimum. He made $52.6M with the Lakers in 2025-26; this is the largest pay cut in NBA history.");
}

// ============================================================ 3 THE FATAL FLAW
{
  const s = pres.addSlide();
  kicker(s, "Why Philadelphia");
  title(s, "The one fatal flaw — nobody creates easy shots — is the thing he fixes");
  s.addText([
    { text: "The 2025-26 Sixers won 45 games while being outscored (SRS –0.27) — a 7-seed that survived on Maxey’s solo shot-making and lost the moment the playoffs demanded easy offense (swept 4-0 by the champion Knicks).\n\n", options: {} },
    { text: "LeBron is the most decorated table-setter alive:\n", options: { bold: true, color: NAVY_BG } },
    { text: "9 of 10 seasons from 2008-09 to 2017-18 his offenses finished top-5 as he ran them solo. In 2025-26, 42.1% of his assists produced rim shots and 11.8% corner threes — the two most efficient shots in basketball. His 162 corner-3 assists in 2016-17 remain the most ever recorded.", options: {} },
  ], {
    x: M, y: 1.75, w: 5.7, h: 4.4, margin: 0, fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 19,
  });
  const rows = [
    ["55.3%", "of Maxey’s 694 makes were unassisted — league mean is 36.3%", RED],
    ["34.9%", "of Embiid’s makes came at the rim — an MVP big living on jumpers", RED],
    ["36.4%", "of Brown’s makes were assisted carrying Boston — down from 47.6%", RED],
    ["5.5%", "of rookie Edgecombe’s makes were corner 3s — the skip pass never came", RED],
  ];
  rows.forEach((r, i) => {
    const y = 1.8 + i * 1.12;
    s.addShape(pres.ShapeType.roundRect, { x: 6.7, y, w: 6.0, h: 0.98, rectRadius: 0.07, fill: { color: "F2F5F9" } });
    s.addText(r[0], { x: 6.9, y: y + 0.12, w: 1.35, h: 0.74, margin: 0, fontFace: HEAD, fontSize: 21, bold: true, color: r[2], valign: "middle" });
    s.addText(r[1], { x: 8.3, y: y + 0.1, w: 4.25, h: 0.8, margin: 0, fontFace: BODY, fontSize: 11.5, color: INK, valign: "middle" });
  });
  pageFoot(s, 3, "All shot-profile splits: pbpstats.com play-by-play totals, cross-checked vs Basketball-Reference; identical to the decimal. Offense ranks: pbpstats ORtg (±1 on borderline years).");
  s.addNotes("The matchup logic: the Sixers' one structural weakness — shot creation for everyone but Maxey — is precisely LeBron's elite skill. Every red number on the right is a symptom of the same missing pass.");
}

// ============================================================ 4 WINS LEDGER
{
  const s = pres.addSlide();
  kicker(s, "Team level");
  title(s, "45 wins was a mirage; 51 is the honest projection");
  const cats = ["true level, 2025-26\n(SRS-implied)", "+ LeBron\n(VORP 2.8 in 60 g)", "+ Brown, full year\n(for ’25-26 George)", "+ Embiid\n38 → ~50 games", "2026-27\nprojection"];
  const base = [null, 41, 46, 49, null];
  const navy = [41, null, null, null, null];
  const blue = [null, 5, 3, 2, null];
  const green = [null, null, null, null, 51];
  s.addChart(pres.ChartType.bar, [
    { name: "base", labels: cats, values: base },
    { name: "start", labels: cats, values: navy },
    { name: "adds", labels: cats, values: blue },
    { name: "proj", labels: cats, values: green },
  ], {
    x: M, y: 1.8, w: 7.6, h: 4.6,
    barDir: "col", barGrouping: "stacked", barGapWidthPct: 45,
    chartColors: [WHITE, BASE, BLUE, GREEN],
    showLegend: false, showTitle: false,
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: "0;;;",
    dataLabelFontFace: BODY, dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelColor: WHITE,
    catAxisLabelColor: INK, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 9.5,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    valAxisMinVal: 0, valAxisMaxVal: 55, catAxisLineColor: SILVER,
  });
  s.addText([
    { text: "The ledger\n", options: { bold: true, fontSize: 14, color: NAVY_BG } },
    { text: "45-37 overstated the 2025-26 team: its –0.27 point differential is 41-win talent. LeBron’s 2025-26 value (B-Ref VORP 2.8 in 60 games ≈ 7.6 wins over replacement) nets ~+5 over the minutes he displaces; a full year of Jaylen Brown replacing 36-year-old Paul George nets ~+3; Embiid reaching ~50 games adds ~+2.\n\n", options: {} },
    { text: "The market agrees\n", options: { bold: true, fontSize: 14, color: NAVY_BG } },
    { text: "FanDuel set the post-signing win total at 50.5. Title odds moved +2000 → +900 (DraftKings) within hours. Two independent routes, one answer.", options: {} },
  ], {
    x: 8.5, y: 1.85, w: 4.2, h: 4.7, margin: 0, fontFace: BODY, fontSize: 12, color: INK, lineSpacing: 16.5,
  });
  pageFoot(s, 4, "SRS & VORP: Basketball-Reference. Win total & odds: FanDuel via Liberty Ballers; DraftKings via NBC Sports. VORP→wins ×2.7 conversion is standard.");
  s.addNotes("The win projection: SRS-true 41 + 5 (LeBron) + 3 (Brown full season) + 2 (Embiid health) = 51, and the sportsbook total (50.5) lands in the same place.");
}

// ============================================================ 5 LOGISTIC CURVE
{
  const s = pres.addSlide();
  kicker(s, "The curve that makes it a heist");
  title(s, "Finals probability is logistic — six wins land on the steep part");
  const wins = Object.keys(curve).map(Number).filter(w => w >= 40 && w <= 64).sort((a, b) => a - b);
  const pv = wins.map(w => +(curve[w] * 100).toFixed(2));
  s.addChart(pres.ChartType.line, [
    { name: "P(reach Finals)", labels: wins.map(String), values: pv },
  ], {
    x: M, y: 1.75, w: 7.9, h: 4.75,
    chartColors: [BASE],
    lineSize: 2.5, lineSmooth: true,
    lineDataSymbol: "none",
    showLegend: false, showTitle: false, showValue: false,
    catAxisLabelColor: MUTED, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontFace: BODY, valAxisLabelFontSize: 10,
    valAxisLabelFormatCode: '0"%"', valAxisMinVal: 0, valAxisMaxVal: 60,
    valGridLine: { color: "E4E9EF", size: 0.5 }, catGridLine: { style: "none" },
    catAxisTitle: "regular-season wins", catAxisTitleColor: MUTED, catAxisTitleFontSize: 10, showCatAxisTitle: true,
  });
  // marker dots on the curve at 45 and 51 wins (plot geometry measured from render)
  s.addShape(pres.ShapeType.ellipse, { x: 2.67, y: 5.53, w: 0.14, h: 0.14, fill: { color: RED } });
  s.addShape(pres.ShapeType.ellipse, { x: 4.40, y: 5.14, w: 0.14, h: 0.14, fill: { color: RED } });
  // annotation callouts adjacent to their points
  s.addText("45 wins → 2.1%\n(last season)", {
    x: 1.15, y: 4.55, w: 1.9, h: 0.72, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: INK, align: "center",
    fill: { color: "F2F5F9" },
  });
  s.addText("51 wins → 8.1%", {
    x: 4.72, y: 5.18, w: 1.8, h: 0.4, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: INK, align: "center",
    fill: { color: "F2F5F9" },
  });
  s.addText("3.8×", {
    x: 6.45, y: 4.5, w: 1.5, h: 0.75, margin: 0, fontFace: HEAD, fontSize: 33, bold: true, color: RED,
  });
  s.addText([
    { text: "The model: ", options: { bold: true } },
    { text: "Log5 game odds + home court, exact best-of-7, three rounds vs a 48/53/57-win playoff gauntlet. 45 wins → 2.1%; 51 → 8.1% (3.8×); 52 → 9.7% (4.6×).\n\n", options: {} },
    { text: "History says the same: ", options: { bold: true } },
    { text: "since 1984, 44-47-win teams took 2 of 78 full-season Finals berths (2.6%) — and no 7-seed has ever made the Finals. The median finalist won 58. 50+ wins covered 96% of all berths.\n\n", options: {} },
    { text: "The point: ", options: { bold: true, color: RED } },
    { text: "the six wins LeBron adds sit exactly where the curve bends.", options: {} },
  ], {
    x: 8.75, y: 1.85, w: 4.0, h: 4.7, margin: 0, fontFace: BODY, fontSize: 11.5, color: INK, lineSpacing: 16,
  });
  pageFoot(s, 5, "Model: model.py in this repo (Log5, HCA odds ×1.21, 2-2-1-1-1). Empirics: 86 Finals berths 1984-2026, Wikipedia champions list + season standings.");
  s.addNotes("Why 51 wins matters so much more than 45: Finals probability is not linear in wins. The Log5 model gives 2.1% at 45 wins and 8.1% at 51 — a 3.8x jump — and the empirical rate for 44-47-win teams (2.6% of berths since 1984) confirms the low starting point.");
}

// ============================================================ 6-9 PLAYER SLIDES
function playerSlide(n, name, sub, cats, vals, colors, story, foot, notes, fmt) {
  const s = pres.addSlide();
  kicker(s, "The starting five, one by one");
  title(s, name, { size: 28 });
  s.addText(sub, { x: M, y: 1.42, w: W - 2 * M, h: 0.35, margin: 0, fontFace: BODY, fontSize: 12.5, color: MUTED });
  barsChart(s, M, 2.0, 6.9, 4.45, cats, vals, colors, { fmt: fmt || '0.0"%"', max: Math.max(...vals) * 1.3 });
  s.addText(story, {
    x: 7.9, y: 2.05, w: 4.8, h: 4.5, margin: 0, fontFace: BODY, fontSize: 12.5, color: INK, lineSpacing: 17.5,
  });
  pageFoot(s, n, foot);
  s.addNotes(notes);
  return s;
}

playerSlide(6, "Maxey — five years of doing it alone",
  "Unassisted share of made field goals, 2025-26 (694 FGM)",
  ["Maxey, 2025-26", "league average", "projected with LeBron"],
  [55.3, 36.3, 46.9],
  [RED, BASE, GREEN],
  [
    { text: "55.3% of Maxey’s baskets were self-created — 19 points above the league mean. He led the team at 28.3 ppg on 70 games of isolation offense.\n\n", options: {} },
    { text: "The projection: ", options: { bold: true, color: NAVY_BG } },
    { text: "guards who joined LeBron saw their assisted share rise +8.4 pts on average (Mo Williams +12.6, D’Angelo Russell +11.1, Kyrie +1.5 — and Kyrie’s 3P assisted share jumped 45.5→61.8%). Applied to Maxey: unassisted falls to ~47%.\n\n", options: {} },
    { text: "For the first time in his career, he gets to run to a spot and shoot.", options: { italic: true } },
  ],
  "Splits: pbpstats/B-Ref (2P 37.8% astd, 3P 59.5% astd). Comps: first-season-with-LeBron deltas, pbpstats 2000-01+.",
  "Maxey has been the league's most self-reliant high-volume scorer: 55.3% of his makes unassisted vs a 36.3% league mean. The guard-arrival comps project that down to ~47% — easier shots at the same volume.");

playerSlide(7, "Brown — a Finals MVP getting easy ones again",
  "Assisted share of made field goals (736 FGM in 2025-26)",
  ["2025-26\n(Tatum hurt)", "2023-24\n(healthy co-star)", "projected with LeBron"],
  [36.4, 47.6, 51.6],
  [RED, BASE, GREEN],
  [
    { text: "Carrying Boston at a career-high 36.2% usage, Brown’s assisted share collapsed to 36.4%. With a healthy star beside him in 2023-24 it was 47.6%.\n\n", options: {} },
    { text: "The projection: ", options: { bold: true, color: NAVY_BG } },
    { text: "restore the healthy-co-star baseline, then add half the average LeBron-arrival premium (+4.0): ~52% assisted. LeBron delivers the ball early in the clock, not with three seconds left.\n\n", options: {} },
    { text: "The easiest shot diet of his career, at age 30.", options: { italic: true } },
  ],
  "Splits: pbpstats/B-Ref both seasons (25-26: 2P 32.4% astd, 3P 53.6% astd; 23-24: 42.9%/63.4%).",
  "Brown's assisted share collapsed to 36.4% carrying Boston at a career-high 36.2% usage. Restoring his healthy-co-star baseline (47.6%) plus half the measured LeBron-arrival premium projects ~52% — the easiest shot diet of his career.");

playerSlide(8, "Embiid — an MVP big fed where he wants it",
  "At-rim share of made field goals (341 FGM in 38 games)",
  ["rim share of FGM\n2025-26", "LeBron assists\narriving at rim", "projected rim share\nwith LeBron"],
  [34.9, 42.1, 41.2],
  [RED, BLUE, GREEN],
  [
    { text: "Only 34.9% of Embiid’s makes came at the rim — a skilled giant surviving on fadeaways because nobody could get him the ball where he wanted it.\n\n", options: {} },
    { text: "The projection: ", options: { bold: true, color: NAVY_BG } },
    { text: "42.1% of LeBron’s 432 assists arrived at the rim (46.6% the year before) — the pocket pass, the lob, the entry nobody else sees. If LeBron assists ~25% of Embiid’s makes at a big-man rim rate (~60%), Embiid’s rim share climbs to ~41% (range 39-44).\n\n", options: {} },
    { text: "Bosh and Love both saw double-digit jumps in assisted makes the year LeBron arrived. Embiid is a better interior finisher than either.", options: { italic: true } },
  ],
  "Rim = pbpstats ‘at rim’ (119/341). LeBron assist locations: pbpstats 2025-26 (182 rim / 51 corner-3 / 93 AB3 / 106 midrange).",
  "Embiid's 34.9% rim share is remarkably low for an MVP-level center — a symptom of entry passing, not finishing. LeBron's rim-heavy assist profile projects it to ~41%.");

playerSlide(9, "Edgecombe — the skip pass finally comes",
  "Corner-3 share of made field goals (451 FGM as a rookie)",
  ["corner-3 share of FGM\n2025-26", "corner-3 share of\nLeBron’s assists", "projected corner-3\nshare with LeBron"],
  [5.5, 11.8, 6.9],
  [RED, BLUE, GREEN],
  [
    { text: "25 of Edgecombe’s 451 makes (5.5%) were corner threes — even though 81% of his 3-point makes were assisted. The cross-court skip simply never came from this roster.\n\n", options: {} },
    { text: "The projection: ", options: { bold: true, color: NAVY_BG } },
    { text: "LeBron throws the skip better than anyone alive — 11.8% of his assists were corner 3s, and his 162 corner-3 assists in 2016-17 are the most ever recorded. If LeBron assists ~22% of Edgecombe’s makes: ~7% (range 6.5-7.4).\n\n", options: {} },
    { text: "A ~30% relative jump in the most efficient catch-and-shoot look in basketball — free points that were just sitting there.", options: { italic: true } },
  ],
  "Corner-3 counts: pbpstats (25 makes / 67 attempts). B-Ref’s different corner-zone definition gives ~20 makes.",
  "Edgecombe already hits assisted threes (81% of his 3P makes were assisted) — he just never got corner looks. LeBron's record-setting skip pass projects a ~30% relative jump in the best shot in basketball.");

// ============================================================ 10 LEBRON
{
  const s = pres.addSlide();
  kicker(s, "The starting five, one by one");
  title(s, "LeBron — fewer possessions, the perfect ones", { size: 28 });
  s.addText("Usage rate and true shooting, 2025-26 measured → 2026-27 projected", {
    x: M, y: 1.42, w: W - 2 * M, h: 0.35, margin: 0, fontFace: BODY, fontSize: 12.5, color: MUTED,
  });
  barsChart(s, M, 2.0, 3.5, 4.3,
    ["usage\n2025-26", "usage projected\n2026-27"], [27.2, 21.5], [BASE, GREEN], { max: 36 });
  barsChart(s, 4.35, 2.0, 3.5, 4.3,
    ["TS%\n2025-26", "TS% projected\n2026-27"], [59.4, 61.5], [BASE, GREEN], { max: 80 });
  s.addText([
    { text: "Usage: ", options: { bold: true, color: NAVY_BG } },
    { text: "27.2% was already a career low (his rookie floor was 28.2%). Stars who joined LeBron shed 5-7 usage points (Bosh 28.5→23.4, Love 28.7→21.6). Now he’s the one joining three stars: ~21-22%, the fewest possessions of his life.\n\n", options: {} },
    { text: "Efficiency: ", options: { bold: true, color: NAVY_BG } },
    { text: "the skill-curve tradeoff (+0.3-0.6 TS pts per usage point shed, minus an age-42 drag) projects .594 → .60-.63 — brushing career-best territory (.649 in 2013-14) at the top of the band.\n\n", options: {} },
    { text: "At 42, in a Sixers jersey, plausibly the most efficient season of his life.", options: { italic: true } },
  ], {
    x: 8.25, y: 2.05, w: 4.45, h: 4.5, margin: 0, fontFace: BODY, fontSize: 12.5, color: INK, lineSpacing: 17.5,
  });
  pageFoot(s, 10, "Usage/TS: B-Ref & StatMuse (27.2 B-Ref method; NBA.com’s formula says 26.2 — both career lows). Sheds: StatMuse. Skill curve: usage-efficiency tradeoff literature.");
  s.addNotes("The paradox of the signing: giving LeBron less to do makes him better. Usage projects to ~21-22% (the Bosh/Love arrival sheds applied to him), and the efficiency tradeoff projects TS toward .61-.63 at age 42.");
}

// ============================================================ 11 THE HEIST QUANTIFIED
{
  const s = pres.addSlide();
  s.background = { color: NAVY_BG };
  kicker(s, "The heist, quantified", { color: "8FB8E8" });
  title(s, "18 cents on the dollar", { color: WHITE, size: 34 });
  const items = [
    ["$21.9M", "modeled market value of his 2026-27 production (Sporting News salary model via CBS; $28.2M for 2025-26)"],
    ["$3.88M", "what Philadelphia pays. Surplus ≈ $18M — about 5 wins of talent, free"],
    ["3.8×", "the Finals-odds multiplier those six extra wins buy on the logistic curve"],
    ["207×", "StubHub demand spike within hours; debut get-in $107 → $540; jerseys gone in ~2 hours"],
  ];
  items.forEach((it, i) => {
    const x = M + (i % 2) * 6.2, y = 2.0 + Math.floor(i / 2) * 2.15;
    s.addText(it[0], { x, y, w: 2.5, h: 0.85, margin: 0, fontFace: HEAD, fontSize: 40, bold: true, color: i === 1 ? "FF5A73" : "8FB8E8" });
    s.addText(it[1], { x: x + 0.05, y: y + 0.85, w: 5.6, h: 1.05, margin: 0, fontFace: BODY, fontSize: 12.5, color: "C9D8EA", lineSpacing: 16 });
  });
  s.addText("Cross-check: ~5 wins added × ~$3.9M market price per win ≈ $20M. Three methods, one answer: the Sixers acquired a top-25 player for the price of a 12th man.", {
    x: M, y: 6.35, w: 12.1, h: 0.6, margin: 0, fontFace: BODY, fontSize: 12, italic: true, color: "7E93AC",
  });
  s.addNotes("Quantifies 'biggest heist in free agency history': $3.876M salary vs $21.9M modeled value = paying 18% of market rate. Market reaction receipts verify the demand shock (StubHub 207x, SeatGeek $107→$540, Fanatics sellout ~2 hrs).");
}

// ============================================================ 12 METHOD & SOURCES
{
  const s = pres.addSlide();
  s.background = { color: NAVY_BG };
  kicker(s, "Method & sources", { color: "8FB8E8" });
  title(s, "Every number, re-derived", { color: WHITE, size: 30 });
  const col = (x, head, body) => {
    s.addText(head, { x, y: 1.85, w: 3.85, h: 0.4, margin: 0, fontFace: BODY, fontSize: 13.5, bold: true, color: "8FB8E8" });
    s.addText(body, { x, y: 2.35, w: 3.85, h: 4.3, margin: 0, fontFace: BODY, fontSize: 10.5, color: "C9D8EA", lineSpacing: 15, valign: "top" });
  };
  col(M, "Data", [
    { text: "Shot profiles & assist locations: pbpstats.com play-by-play API, cross-checked against Basketball-Reference splits (agreement to the decimal) and StatMuse.\n\n", options: {} },
    { text: "Standings, SRS, advanced value: Basketball-Reference 2025-26.\n\n", options: {} },
    { text: "Contract & cap: NBA.com, ESPN/Klutch, CBS Sports. Market: FanDuel/DraftKings via NBC & Liberty Ballers; StubHub/SeatGeek via 6abc.", options: {} },
  ]);
  col(M + 4.15, "Models (in this repo)", [
    { text: "Finals curve: Log5 game probabilities, home-court odds ×1.21, exact best-of-7 enumeration, three rounds vs a 48/53/57 gauntlet (model.py).\n\n", options: {} },
    { text: "Win ledger: SRS-implied baseline + VORP-based wins added (final_calcs.py).\n\n", options: {} },
    { text: "Teammate projections: first-season-with-LeBron deltas measured for 6 stars, 2000-2026 (projections.py).", options: {} },
  ]);
  col(M + 8.3, "Honesty box", [
    { text: "Projections carry ranges, not certainties; central values shown.\n\n", options: {} },
    { text: "Stat sites draw shot zones differently (corner-3, at-rim); pbpstats’ exact play-by-play counts are used, with alternates noted in slide footers.\n\n", options: {} },
    { text: "Embiid availability (38 games) is the single biggest swing factor no model fixes.", options: {} },
  ]);
  s.addText("Compiled July 25, 2026 — the day after the signing.", {
    x: M, y: 6.75, w: 12, h: 0.4, margin: 0, fontFace: BODY, fontSize: 10.5, color: "7E93AC",
  });
  s.addNotes("Method summary and provenance. All scripts and the source data file (data.md) accompany the deck in the repository.");
}

pres.writeFile({ fileName: "lebron-sixers-heist.pptx" }).then(() => console.log("written"));
