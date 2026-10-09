/* cashflow.js — India Insurance Cashflow View
 * Exports: renderCashflow(container), updateCashflowSummary(summaryBar)
 * Follows same ES-module pattern as component_in.js / health.js
 */

const TODAY_YEAR = new Date().getFullYear(); // 2026

/* ─────────────────────────────────────────────────────────────
   RAW POLICY DATA
   For ULIPs we store currentCV (today's fund value).
   For savings/pension/retirement we store fixed future payouts.
───────────────────────────────────────────────────────────── */
const RAW_CF = [

  /* ── ASSIGNED ULIPs (surrender in 6th year OR after premEndY, whichever later) ── */
  {
    id: 'axismax',
    name: 'AxisMax Fast Track',
    type: 'ULIP',
    subtype: 'assigned',
    annualPremium: 500000,
    commenced: 2022,
    premEndY: 2027,
    currentCV: 3030000,
    owner: 'self',
  },
  {
    id: 'bhartiAxa',
    name: 'BhartiAXA Wealth Pro',
    type: 'ULIP',
    subtype: 'assigned',
    annualPremium: 200000,
    commenced: 2023,
    premEndY: 2029,
    currentCV: 180000,
    owner: 'self',
  },
  {
    id: 'indiaFirst',
    name: 'IndiaFirst Money Balance',
    type: 'ULIP',
    subtype: 'assigned',
    annualPremium: 50000,
    commenced: 2022,
    premEndY: 2027,
    currentCV: 71000,
    owner: 'self',
  },

  /* ── STANDARD ULIPs (project currentCV @ 4% to matY) ── */
  {
    id: 'bajajAssureGoal',
    name: 'BajajLife Assure Goal',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 100000,
    premEndY: 2026,
    matY: 2030,
    currentCV: 464791,
    owner: 'self',
  },
  {
    id: 'bajajFutureGain',
    name: 'BajajLife Future Gain II',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 50000,
    premEndY: 2026,
    matY: 2029,
    currentCV: 150653,
    owner: 'self',
  },
  {
    id: 'bajajGoalSelf',
    name: 'BajajLife Goal Assure Self',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 100000,
    premEndY: 2030,
    matY: 2036,
    currentCV: 119738,
    owner: 'self',
  },
  {
    id: 'bajajGoalWife',
    name: 'BajajLife Goal Assure Wife',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 100000,
    premEndY: 2030,
    matY: 2036,
    currentCV: 58074,
    owner: 'wife',
  },
  {
    id: 'sbiSmartPriv',
    name: 'SBI Smart Privilege Plus',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 200000,
    premEndY: 2030,
    matY: 2040,
    currentCV: 859504,
    owner: 'self',
  },
  {
    id: 'icicSignature',
    name: 'ICICI Pru Signature',
    type: 'ULIP',
    subtype: 'standard',
    annualPremium: 500000,
    premEndY: 2026,
    matY: 2052,
    currentCV: 472882,
    owner: 'self',
  },

  /* ── SAVINGS ── */
  {
    id: 'indusMoneyback',
    name: 'IndusInd Moneyback',
    type: 'Savings',
    annualPremium: 50000,
    premEndY: 2026,
    payouts: [
      { year: 2027, amt: 15000 }, { year: 2028, amt: 15000 },
      { year: 2029, amt: 15000 }, { year: 2030, amt: 15000 },
      { year: 2031, amt: 15000 },
    ],
    matY: 2032,
    matAmt: 179713,
    owner: 'self',
  },
  {
    id: 'indusSamrudhi',
    name: 'IndusInd Samrudhi',
    type: 'Savings',
    annualPremium: 100000,
    premEndY: 2030,
    payouts: Array.from({ length: 20 }, (_, i) => ({ year: 2031 + i, amt: 100000 })),
    matY: 2050,
    matAmt: 1750854,
    owner: 'self',
  },
  {
    id: 'indusNishchit',
    name: 'IndusInd Nishchit Ace',
    type: 'Savings',
    annualPremium: 150000,
    premEndY: 2030,
    payouts: [
      { year: 2031, amt: 100000 }, { year: 2032, amt: 110000 },
      { year: 2033, amt: 121000 }, { year: 2034, amt: 133100 },
      { year: 2035, amt: 146410 },
    ],
    matY: 2055,
    matAmt: 2626948,
    owner: 'self',
  },
  {
    id: 'kotakMaximizer',
    name: 'Kotak Maximizer',
    type: 'Savings',
    annualPremium: 50000,
    premEndY: 2026,
    payouts: Array.from({ length: 10 }, (_, i) => ({ year: 2026 + i, amt: 23495 })),
    matY: 2060,
    matAmt: 711994,
    owner: 'self',
  },
  {
    id: 'generaliAssured',
    name: 'Generali Assured Wealth',
    type: 'Savings',
    annualPremium: 100000,
    premEndY: 2032,
    matY: 2042,
    matAmt: 1499120,
    owner: 'self',
  },
  {
    id: 'generaliAssurePlus',
    name: 'Generali Assure Plus',
    type: 'Savings',
    annualPremium: 100000,
    premEndY: 2027,
    matY: 2037,
    matAmt: 1217534,
    owner: 'self',
  },
  {
    id: 'edelweiss',
    name: 'Edelweiss Saral Nivesh',
    type: 'Savings',
    annualPremium: 50000,
    premEndY: 2025,
    matY: 2035,
    matAmt: 260000,
    owner: 'self',
  },

  /* ── PENSION ── */
  {
    id: 'indusPension',
    name: 'IndusInd Pension SL',
    type: 'Pension',
    annualPremium: 89830,
    premEndY: 2031,
    payouts: Array.from({ length: 20 }, (_, i) => ({ year: 2032 + i, amt: 89830 })),
    matY: 2051,
    matAmt: 0,
    owner: 'self',
  },

  /* ── RETIREMENT ── */
  {
    id: 'kotakRetire',
    name: 'Kotak Confident Retirement',
    type: 'Retirement',
    annualPremium: 50000,
    premEndY: 2030,
    matY: 2040,
    matAmt: 323695,
    owner: 'self',
  },
];

/* ─────────────────────────────────────────────────────────────
   ULIP BUSINESS RULES — compute final matY & matAmt
───────────────────────────────────────────────────────────── */
function resolvePolicy(p) {
  if (p.type !== 'ULIP') return p;

  if (p.subtype === 'assigned') {
    const surrenderYear = Math.max(p.commenced + 6, p.premEndY);
    const yearsGrowth = surrenderYear - TODAY_YEAR;
    const matAmt = Math.round(p.currentCV * Math.pow(1.04, yearsGrowth));
    return { ...p, matY: surrenderYear, matAmt };
  }

  // standard ULIP
  const yearsGrowth = p.matY - TODAY_YEAR;
  const matAmt = Math.round(p.currentCV * Math.pow(1.04, yearsGrowth));
  return { ...p, matAmt };
}

const POLICIES = RAW_CF.map(resolvePolicy);

/* ─────────────────────────────────────────────────────────────
   CHART HELPERS
───────────────────────────────────────────────────────────── */
const TYPE_COLOR = {
  ULIP:       '#60a5fa',
  Savings:    '#34d399',
  Pension:    '#fb923c',
  Retirement: '#f472b6',
};

const TYPE_GLOW = {
  ULIP:       'rgba(96,165,250,0.35)',
  Savings:    'rgba(52,211,153,0.35)',
  Pension:    'rgba(251,146,60,0.35)',
  Retirement: 'rgba(244,114,182,0.35)',
};

function fmtInr(v) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v}`;
}

/* Build year → { inflows:[{type,name,amt}], outflows:[{type,name,amt}] } */
function buildYearMap(policies, rangeStart, rangeEnd) {
  const map = {};
  for (let y = rangeStart; y <= rangeEnd; y++) map[y] = { inflows: [], outflows: [] };

  policies.forEach(p => {
    // Premiums (outflows) — years that are still in range
    const premStart = (p.commenced || (p.premEndY - 5)); // approx if no commenced
    for (let y = Math.max(rangeStart, premStart); y <= Math.min(rangeEnd, p.premEndY); y++) {
      if (map[y]) {
        map[y].outflows.push({ type: p.type, name: p.name, amt: p.annualPremium });
      }
    }

    // Mid-term payouts (inflows)
    (p.payouts || []).forEach(({ year, amt }) => {
      if (year >= rangeStart && year <= rangeEnd && map[year]) {
        map[year].inflows.push({ type: p.type, name: p.name, amt });
      }
    });

    // Maturity / surrender (inflow)
    if (p.matY >= rangeStart && p.matY <= rangeEnd && p.matAmt > 0 && map[p.matY]) {
      map[p.matY].inflows.push({ type: p.type, name: p.name, amt: p.matAmt, isMat: true });
    }
  });

  return map;
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED BACKGROUND STYLES (injected once)
───────────────────────────────────────────────────────────── */
function injectCFStyles() {
  if (document.getElementById('cf-styles')) return;
  const s = document.createElement('style');
  s.id = 'cf-styles';
  s.textContent = `
    #cf-section {
      position: relative;
      background: #0a0f1e;
      border-radius: 32px;
      overflow: hidden;
      padding: 32px;
      margin-top: 24px;
      min-height: 520px;
    }

    /* Drifting grid */
    #cf-section .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: cfGridDrift 20s linear infinite;
      pointer-events: none;
      z-index: 0;
    }
    @keyframes cfGridDrift {
      0%   { background-position: 0 0; }
      100% { background-position: 48px 48px; }
    }

    /* Floating orbs */
    #cf-section .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
      animation: cfOrbFloat 12s ease-in-out infinite alternate;
    }
    #cf-section .orb-1 { width:340px; height:340px; background:rgba(99,102,241,0.25); top:-80px; left:-60px; animation-delay:0s; }
    #cf-section .orb-2 { width:260px; height:260px; background:rgba(236,72,153,0.18); bottom:-60px; right:10%; animation-delay:-4s; }
    #cf-section .orb-3 { width:200px; height:200px; background:rgba(52,211,153,0.15); top:40%; left:55%; animation-delay:-8s; }
    @keyframes cfOrbFloat {
      0%   { transform: translate(0,0) scale(1); }
      100% { transform: translate(30px,25px) scale(1.08); }
    }

    /* Relative z-index wrapper for chart content */
    #cf-section .cf-content {
      position: relative;
      z-index: 1;
    }

    /* Filter pills */
    .cf-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }
    .cf-pill:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }
    .cf-pill.active { color: #fff; border-color: var(--pill-color, #6366f1); background: rgba(99,102,241,0.22); box-shadow: 0 0 12px var(--pill-color, #6366f1); }
    .cf-pill .dot { width:8px; height:8px; border-radius:50%; background:var(--pill-color,#6366f1); }

    /* Range pills */
    .cf-range-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cf-range-pill.active,
    .cf-range-pill:hover {
      background: rgba(99,102,241,0.25);
      border-color: #6366f1;
      color: #fff;
    }

    /* Chart canvas wrapper */
    #cf-chart-wrap {
      position: relative;
      width: 100%;
      overflow-x: auto;
    }
    #cf-svg {
      display: block;
    }

    /* Tooltip */
    #cf-tooltip {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      background: rgba(10,15,30,0.96);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 12px;
      color: #e2e8f0;
      min-width: 180px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      display: none;
    }
    #cf-tooltip .tt-year { font-size:13px; font-weight:900; color:#fff; margin-bottom:8px; }
    #cf-tooltip .tt-row { display:flex; align-items:center; gap:6px; margin:3px 0; }
    #cf-tooltip .tt-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    #cf-tooltip .tt-name { flex:1; color:#94a3b8; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; }
    #cf-tooltip .tt-amt { font-weight:700; font-size:12px; white-space:nowrap; }
    #cf-tooltip .tt-divider { border:none; border-top:1px solid rgba(255,255,255,0.08); margin:6px 0; }

    /* Summary strip */
    #cf-summary-strip {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .cf-stat {
      flex: 1;
      min-width: 130px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 14px 18px;
    }
    .cf-stat-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom:4px; }
    .cf-stat-value { font-size:20px; font-weight:900; color:#fff; }

    /* Legend */
    #cf-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 14px;
    }
    .cf-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }
    .cf-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

    /* Y axis labels */
    .cf-y-label {
      fill: #475569;
      font-size: 10px;
      font-family: 'Inter', sans-serif;
    }
    /* X axis labels */
    .cf-x-label {
      fill: #64748b;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
    }
    /* Center baseline label */
    .cf-baseline-label {
      fill: #334155;
      font-size: 9px;
      font-family: 'Inter', sans-serif;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
   CHART RENDERER
───────────────────────────────────────────────────────────── */
let cfState = {
  activeTypes: new Set(['ULIP', 'Savings', 'Pension', 'Retirement']),
  rangeEnd: 2045,
};

function drawChart(container) {
  const rangeStart = TODAY_YEAR;
  const rangeEnd = cfState.rangeEnd;
  const filteredPolicies = POLICIES.filter(p => cfState.activeTypes.has(p.type));
  const yearMap = buildYearMap(filteredPolicies, rangeStart, rangeEnd);

  const years = [];
  for (let y = rangeStart; y <= rangeEnd; y++) years.push(y);

  // Compute stacked totals per year
  const types = ['ULIP', 'Savings', 'Pension', 'Retirement'];
  const stackedIn = years.map(y => {
    const row = {};
    types.forEach(t => { row[t] = 0; });
    (yearMap[y].inflows || []).forEach(f => { if (cfState.activeTypes.has(f.type)) row[f.type] += f.amt; });
    return row;
  });
  const stackedOut = years.map(y => {
    const row = {};
    types.forEach(t => { row[t] = 0; });
    (yearMap[y].outflows || []).forEach(f => { if (cfState.activeTypes.has(f.type)) row[f.type] += f.amt; });
    return row;
  });

  const maxIn = Math.max(...stackedIn.map(r => types.reduce((s, t) => s + r[t], 0)), 1);
  const maxOut = Math.max(...stackedOut.map(r => types.reduce((s, t) => s + r[t], 0)), 1);
  const maxVal = Math.max(maxIn, maxOut);

  // Layout
  const BAR_W = 22;
  const BAR_GAP = 8;
  const SLOT_W = BAR_W + BAR_GAP;
  const PAD_L = 68, PAD_R = 20, PAD_TOP = 20, PAD_BOT = 36;
  const CHART_H = 280; // half chart height (above & below baseline)
  const SVG_H = CHART_H * 2 + PAD_TOP + PAD_BOT + 20; // extra for midline label
  const SVG_W = PAD_L + years.length * SLOT_W + PAD_R;
  const BASELINE_Y = PAD_TOP + CHART_H;

  // Build SVG
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'cf-svg';
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  const tooltip = document.getElementById('cf-tooltip');

  // Grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  gridLevels.forEach(frac => {
    // Above baseline
    const yAbove = BASELINE_Y - frac * CHART_H;
    const gAbove = document.createElementNS(ns, 'line');
    gAbove.setAttribute('x1', PAD_L); gAbove.setAttribute('x2', SVG_W - PAD_R);
    gAbove.setAttribute('y1', yAbove); gAbove.setAttribute('y2', yAbove);
    gAbove.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    gAbove.setAttribute('stroke-width', '1');
    svg.appendChild(gAbove);

    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', PAD_L - 6); lbl.setAttribute('y', yAbove + 3);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('class', 'cf-y-label');
    lbl.textContent = fmtInr(maxVal * frac);
    svg.appendChild(lbl);

    // Below baseline
    const yBelow = BASELINE_Y + frac * CHART_H;
    const gBelow = document.createElementNS(ns, 'line');
    gBelow.setAttribute('x1', PAD_L); gBelow.setAttribute('x2', SVG_W - PAD_R);
    gBelow.setAttribute('y1', yBelow); gBelow.setAttribute('y2', yBelow);
    gBelow.setAttribute('stroke', 'rgba(255,255,255,0.04)');
    gBelow.setAttribute('stroke-width', '1');
    svg.appendChild(gBelow);

    const lblB = document.createElementNS(ns, 'text');
    lblB.setAttribute('x', PAD_L - 6); lblB.setAttribute('y', yBelow + 3);
    lblB.setAttribute('text-anchor', 'end');
    lblB.setAttribute('class', 'cf-y-label');
    lblB.textContent = fmtInr(maxVal * frac);
    svg.appendChild(lblB);
  });

  // Baseline
  const baseLine = document.createElementNS(ns, 'line');
  baseLine.setAttribute('x1', PAD_L); baseLine.setAttribute('x2', SVG_W - PAD_R);
  baseLine.setAttribute('y1', BASELINE_Y); baseLine.setAttribute('y2', BASELINE_Y);
  baseLine.setAttribute('stroke', 'rgba(255,255,255,0.18)');
  baseLine.setAttribute('stroke-width', '1.5');
  svg.appendChild(baseLine);

  // Midline labels
  const lblIn = document.createElementNS(ns, 'text');
  lblIn.setAttribute('x', PAD_L - 6); lblIn.setAttribute('y', BASELINE_Y - 6);
  lblIn.setAttribute('text-anchor', 'end');
  lblIn.setAttribute('class', 'cf-baseline-label');
  lblIn.setAttribute('fill', '#34d399');
  lblIn.textContent = '▲ INFLOWS';
  svg.appendChild(lblIn);

  const lblOut = document.createElementNS(ns, 'text');
  lblOut.setAttribute('x', PAD_L - 6); lblOut.setAttribute('y', BASELINE_Y + 14);
  lblOut.setAttribute('text-anchor', 'end');
  lblOut.setAttribute('class', 'cf-baseline-label');
  lblOut.setAttribute('fill', '#f87171');
  lblOut.textContent = '▼ PREMIUMS';
  svg.appendChild(lblOut);

  // Bars per year
  years.forEach((y, i) => {
    const x = PAD_L + i * SLOT_W;
    const inRow = stackedIn[i];
    const outRow = stackedOut[i];

    // Draw stacked inflow bars (upward from BASELINE_Y)
    let yInCursor = BASELINE_Y;
    types.forEach(t => {
      const amt = inRow[t];
      if (!amt) return;
      const h = Math.round((amt / maxVal) * CHART_H);
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', yInCursor - h);
      rect.setAttribute('width', BAR_W);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', TYPE_COLOR[t]);
      rect.setAttribute('rx', '3');
      rect.setAttribute('opacity', '0.88');
      svg.appendChild(rect);
      yInCursor -= h + 1; // 1px gap between segments
    });

    // Draw stacked outflow bars (downward from BASELINE_Y)
    let yOutCursor = BASELINE_Y;
    types.forEach(t => {
      const amt = outRow[t];
      if (!amt) return;
      const h = Math.round((amt / maxVal) * CHART_H);
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', yOutCursor);
      rect.setAttribute('width', BAR_W);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', TYPE_COLOR[t]);
      rect.setAttribute('rx', '3');
      rect.setAttribute('opacity', '0.55');
      svg.appendChild(rect);
      yOutCursor += h + 1;
    });

    // Hover zone
    const hoverH = CHART_H * 2;
    const hoverRect = document.createElementNS(ns, 'rect');
    hoverRect.setAttribute('x', x - 4);
    hoverRect.setAttribute('y', PAD_TOP);
    hoverRect.setAttribute('width', BAR_W + 8);
    hoverRect.setAttribute('height', hoverH);
    hoverRect.setAttribute('fill', 'transparent');
    hoverRect.style.cursor = 'crosshair';

    hoverRect.addEventListener('mouseenter', (e) => {
      // highlight column
      hoverRect.setAttribute('fill', 'rgba(255,255,255,0.05)');
      // build tooltip
      const inflows = yearMap[y].inflows.filter(f => cfState.activeTypes.has(f.type));
      const outflows = yearMap[y].outflows.filter(f => cfState.activeTypes.has(f.type));
      const totalIn = inflows.reduce((s, f) => s + f.amt, 0);
      const totalOut = outflows.reduce((s, f) => s + f.amt, 0);
      const net = totalIn - totalOut;

      let html = `<div class="tt-year">${y}</div>`;
      if (inflows.length) {
        html += `<div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:4px;">▲ INFLOWS</div>`;
        inflows.forEach(f => {
          html += `<div class="tt-row"><span class="tt-dot" style="background:${TYPE_COLOR[f.type]}"></span><span class="tt-name">${f.name}${f.isMat ? ' ★' : ''}</span><span class="tt-amt" style="color:${TYPE_COLOR[f.type]}">${fmtInr(f.amt)}</span></div>`;
        });
        html += `<div class="tt-row" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:4px;padding-top:4px;"><span style="flex:1;font-size:10px;color:#94a3b8">Total in</span><span class="tt-amt" style="color:#34d399">${fmtInr(totalIn)}</span></div>`;
      }
      if (outflows.length) {
        html += `<div style="font-size:10px;color:#f87171;font-weight:700;margin:6px 0 4px;">▼ PREMIUMS</div>`;
        outflows.slice(0, 5).forEach(f => {
          html += `<div class="tt-row"><span class="tt-dot" style="background:${TYPE_COLOR[f.type]};opacity:0.55"></span><span class="tt-name">${f.name}</span><span class="tt-amt" style="color:#f87171">${fmtInr(f.amt)}</span></div>`;
        });
        if (outflows.length > 5) html += `<div style="font-size:10px;color:#64748b;margin-top:2px;">+${outflows.length - 5} more policies</div>`;
        html += `<div class="tt-row" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:4px;padding-top:4px;"><span style="flex:1;font-size:10px;color:#94a3b8">Total out</span><span class="tt-amt" style="color:#f87171">${fmtInr(totalOut)}</span></div>`;
      }
      if (totalIn || totalOut) {
        html += `<div class="tt-row" style="margin-top:6px;"><span style="flex:1;font-size:11px;font-weight:700;color:#fff">Net</span><span class="tt-amt" style="color:${net >= 0 ? '#34d399' : '#f87171'}">${net >= 0 ? '+' : ''}${fmtInr(net)}</span></div>`;
      }
      if (!inflows.length && !outflows.length) {
        html += '<div style="color:#475569;font-size:11px;">No cashflows</div>';
      }
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
    });

    hoverRect.addEventListener('mousemove', (e) => {
      const tx = Math.min(e.clientX + 14, window.innerWidth - 210);
      const ty = Math.min(e.clientY - 30, window.innerHeight - tooltip.offsetHeight - 10);
      tooltip.style.left = tx + 'px';
      tooltip.style.top = ty + 'px';
    });

    hoverRect.addEventListener('mouseleave', () => {
      hoverRect.setAttribute('fill', 'transparent');
      tooltip.style.display = 'none';
    });

    svg.appendChild(hoverRect);

    // X axis label (every 2 years or on significant events)
    if (i % 2 === 0 || y === rangeEnd) {
      const xLbl = document.createElementNS(ns, 'text');
      xLbl.setAttribute('x', x + BAR_W / 2);
      xLbl.setAttribute('y', BASELINE_Y + CHART_H + PAD_BOT - 6);
      xLbl.setAttribute('text-anchor', 'middle');
      xLbl.setAttribute('class', 'cf-x-label');
      xLbl.textContent = y;
      svg.appendChild(xLbl);
    }
  });

  const wrap = container.querySelector('#cf-chart-wrap');
  wrap.innerHTML = '';
  wrap.appendChild(svg);
}

/* ─────────────────────────────────────────────────────────────
   SUMMARY STRIP DATA
───────────────────────────────────────────────────────────── */
function computeSummary() {
  const totalPremiums = POLICIES.reduce((s, p) => {
    const yrs = Math.max(0, p.premEndY - TODAY_YEAR + 1);
    return s + p.annualPremium * yrs;
  }, 0);

  const totalInflows = POLICIES.reduce((s, p) => {
    const mid = (p.payouts || []).reduce((a, f) => a + f.amt, 0);
    return s + mid + (p.matAmt || 0);
  }, 0);

  const net = totalInflows - totalPremiums;

  // Nearest maturity
  const future = POLICIES.filter(p => p.matY >= TODAY_YEAR).sort((a, b) => a.matY - b.matY);
  const next = future[0];

  return { totalPremiums, totalInflows, net, next };
}

/* ─────────────────────────────────────────────────────────────
   EXPORTED: updateCashflowSummary(bar)
   Updates the top summary bar when Cashflow tab is active
───────────────────────────────────────────────────────────── */
export function updateCashflowSummary(bar) {
  const { totalPremiums, totalInflows, net, next } = computeSummary();

  bar.className = 'grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 bg-slate-900 p-6 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500';

  bar.innerHTML = `
    <div class="border-r border-slate-700 text-center pr-4">
      <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Total Premiums</p>
      <p class="text-3xl font-black text-red-400">${fmtInr(totalPremiums)}</p>
      <p class="text-[10px] text-slate-500 mt-1">remaining outflows</p>
    </div>
    <div class="border-r border-slate-700 text-center">
      <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Total Inflows</p>
      <p class="text-3xl font-black text-emerald-400">${fmtInr(totalInflows)}</p>
      <p class="text-[10px] text-slate-500 mt-1">maturities + payouts</p>
    </div>
    <div class="border-r border-slate-700 text-center">
      <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Net Cashflow</p>
      <p class="text-3xl font-black ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}">${net >= 0 ? '+' : ''}${fmtInr(net)}</p>
      <p class="text-[10px] text-slate-500 mt-1">inflows − premiums</p>
    </div>
    <div class="text-center">
      <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Next Maturity</p>
      <p class="text-xl font-black text-indigo-400">${next ? next.matY : '—'}</p>
      <p class="text-[10px] text-slate-500 mt-1">${next ? next.name.split(' ').slice(0, 3).join(' ') + ' · ' + fmtInr(next.matAmt) : 'none'}</p>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
   EXPORTED: renderCashflow(container)
   Called by app.js render('cashflow')
   container = document.getElementById('cf-section')  [NEW div in index.html]
───────────────────────────────────────────────────────────── */
export function renderCashflow(container) {
  injectCFStyles();

  // Ensure tooltip exists
  if (!document.getElementById('cf-tooltip')) {
    const tt = document.createElement('div');
    tt.id = 'cf-tooltip';
    document.body.appendChild(tt);
  }

  const TYPES = ['ULIP', 'Savings', 'Pension', 'Retirement'];
  const RANGES = [
    { label: '2026–2035', end: 2035 },
    { label: '2026–2045', end: 2045 },
    { label: '2026–2060', end: 2060 },
  ];

  container.innerHTML = `
    <div class="bg-grid"></div>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="cf-content">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-tight">📊 India Insurance Cashflow</h2>
          <p class="text-xs text-slate-500 mt-0.5">Premiums out (↓) · Maturities & payouts in (↑) · ★ = maturity/surrender</p>
        </div>
        <!-- Range pills -->
        <div class="flex gap-2 flex-wrap" id="cf-range-pills">
          ${RANGES.map((r, i) => `<span class="cf-range-pill${r.end === cfState.rangeEnd ? ' active' : ''}" data-end="${r.end}">${r.label}</span>`).join('')}
        </div>
      </div>

      <!-- Type filter pills -->
      <div class="flex gap-2 flex-wrap mb-4" id="cf-type-pills">
        ${TYPES.map(t => `
          <span class="cf-pill${cfState.activeTypes.has(t) ? ' active' : ''}"
                data-type="${t}"
                style="--pill-color:${TYPE_COLOR[t]}">
            <span class="dot" style="background:${TYPE_COLOR[t]}"></span>${t}
          </span>
        `).join('')}
      </div>

      <!-- Legend -->
      <div id="cf-legend">
        ${TYPES.map(t => `
          <div class="cf-legend-item">
            <span class="cf-legend-dot" style="background:${TYPE_COLOR[t]}"></span>
            <span>${t}</span>
          </div>
        `).join('')}
        <div class="cf-legend-item">
          <span class="cf-legend-dot" style="background:rgba(255,255,255,0.55)"></span>
          <span style="color:#64748b">Darker shade = premiums out</span>
        </div>
      </div>

      <!-- Chart -->
      <div id="cf-chart-wrap"></div>
    </div>
  `;

  // Draw initial chart
  drawChart(container);

  // Wire type filter pills
  container.querySelectorAll('.cf-pill[data-type]').forEach(pill => {
    pill.addEventListener('click', () => {
      const t = pill.dataset.type;
      if (cfState.activeTypes.has(t)) {
        if (cfState.activeTypes.size > 1) cfState.activeTypes.delete(t);
      } else {
        cfState.activeTypes.add(t);
      }
      pill.classList.toggle('active', cfState.activeTypes.has(t));
      drawChart(container);
    });
  });

  // Wire range pills
  container.querySelectorAll('.cf-range-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      cfState.rangeEnd = parseInt(pill.dataset.end);
      container.querySelectorAll('.cf-range-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      drawChart(container);
    });
  });
}
