/* cashflow.js — India Insurance Cashflow View
 * Exports: renderCashflow(container, indiaList), updateCashflowSummary(bar, indiaList)
 *
 * Reads directly from the same localPolicyData.india array that the India tab uses.
 * No hardcoded policy data — everything comes from Google Sheets via loader.js.
 *
 * Policy object shape (from loader.js / data.js):
 *   p.name             — policy name string
 *   p.company          — insurer name e.g. "LIC", "HDFC Life" (used for logo)
 *   p.logo             — full logo URL (set by loader: githubLogo + logo_<company>.png)
 *   p.type             — "ULIP", "Savings", "Pension", "Retirement", "Term", etc.
 *   p.premium          — annual premium (number)
 *   p.commenced        — "DD MMM YYYY" string
 *   p.ppt              — premium payment term in years (number)
 *   p.maturity         — maturity date string "DD MMM YYYY"
 *   p.unitValueNumeric — current fund value (number, ULIPs only)
 *   p.payoutSchedule   — { [policyYear]: amount } for money-back policies
 *   p.calculatedMaturity — final maturity amount (non-ULIP)
 */

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TODAY_YEAR = new Date().getFullYear();

const TYPE_COLOR = {
  ULIP:       '#60a5fa',
  Savings:    '#34d399',
  Pension:    '#fb923c',
  Retirement: '#f472b6',
  Term:       '#a78bfa',
};
const DEFAULT_COLOR = '#94a3b8';

// Assigned ULIPs: surrender at max(commenced+5, premEndY), NOT eligible for drawdown
const ASSIGNED_ULIP_KEYWORDS = ['fast track', 'wealth pro', 'money balance'];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function fmtInr(v) {
  if (!v || isNaN(v)) return '₹0';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function parseDateYear(dateStr) {
  if (!dateStr) return NaN;
  const parts = String(dateStr).trim().split(' ');
  return parseInt(parts[parts.length - 1]);
}

function typeColor(type) {
  return TYPE_COLOR[type] || DEFAULT_COLOR;
}

function isAssignedULIP(p) {
  const nameLower = (p.name || '').toLowerCase();
  return ASSIGNED_ULIP_KEYWORDS.some(k => nameLower.includes(k));
}

/* ─────────────────────────────────────────────────────────────
   DRAWDOWN MATH
   Computes a level annual withdrawal W such that a fund of
   value FV (at 4% p.a.) is spread evenly to zero over n years.

   PMT formula (end-of-year withdrawals):
     W = FV × r / (1 − (1+r)^−n)
   where r = 0.04

   Returns array of { year, monthlyAmt, annualAmt }
   starting from drawdownStartY through maturityY - 1.
   The residual at maturityY (≈ 0) is handled separately as matAmt.
───────────────────────────────────────────────────────────── */
function computeDrawdownSchedule(cv, drawdownStartY, maturityY, premEndY) {
  // Project fund value from TODAY to drawdownStartY at 4% p.a.
  const yearsToStart = Math.max(0, drawdownStartY - TODAY_YEAR);
  const fvAtStart = Math.round(cv * Math.pow(1.04, yearsToStart));

  const n = maturityY - drawdownStartY; // number of years of drawdown
  if (n <= 0 || fvAtStart <= 0) return { schedule: [], residual: fvAtStart || 0 };

  const r = 0.04;
  // Level annual withdrawal (annuity formula)
  const annualW = Math.round(fvAtStart * r / (1 - Math.pow(1 + r, -n)));
  const monthlyW = Math.round(annualW / 12);

  const schedule = [];
  let balance = fvAtStart;
  for (let i = 0; i < n; i++) {
    const year = drawdownStartY + i;
    // Fund grows first, then withdrawal at year-end
    balance = Math.round(balance * (1 + r));
    const withdrawal = Math.min(annualW, balance); // don't overshoot
    balance -= withdrawal;
    schedule.push({ year, annualAmt: withdrawal, monthlyAmt: Math.round(withdrawal / 12) });
  }

  // Residual (should be ~0 by design)
  const residual = Math.max(0, balance);
  return { schedule, residual };
}

/* ─────────────────────────────────────────────────────────────
   RESOLVE EACH POLICY → cashflow facts
───────────────────────────────────────────────────────────── */
function resolvePolicy(p, drawdownMode) {
  const isULIP = (p.type || '').toUpperCase().includes('ULIP');
  const commencedY = parseDateYear(p.commenced);
  const maturityY = parseDateYear(p.maturity);
  const premEndY = isNaN(commencedY) ? NaN : commencedY + (p.ppt || 0) - 1;
  const premStartY = isNaN(commencedY) ? TODAY_YEAR : commencedY;

  let matY, matAmt, payouts = [], drawdowns = [];
  const isAssigned = isULIP && isAssignedULIP(p);

  if (isULIP) {
    const cv = p.unitValueNumeric || 0;

    if (isAssigned) {
      // Assigned ULIP: surrender at max(commencedY+5, premEndY)
      // Policy year 6 ends at commencedY + 5 (year 1 = commencedY)
      const sixthYearEnd = commencedY + 5;
      const surrenderY = Math.max(sixthYearEnd, premEndY);
      const years = surrenderY - TODAY_YEAR;
      matY = surrenderY;
      matAmt = years >= 0 ? Math.round(cv * Math.pow(1.04, years)) : cv;
      // Drawdown is NOT applicable for assigned ULIPs

    } else if (drawdownMode) {
      // Standard ULIP with drawdown ON:
      // - Project CV to drawdown start year (premEndY + 1) at 4%
      // - Spread evenly to maturity using annuity formula
      // - Maturity shows any tiny residual
      const drawdownStartY = Math.max(TODAY_YEAR, (isNaN(premEndY) ? TODAY_YEAR : premEndY) + 1);
      const { schedule, residual } = computeDrawdownSchedule(cv, drawdownStartY, maturityY, premEndY);
      drawdowns = schedule;
      matY = maturityY;
      matAmt = residual; // ~0 — still shown as maturity if non-zero

    } else {
      // Standard ULIP, normal mode: hold to maturity, project at 4%
      const years = maturityY - TODAY_YEAR;
      matY = maturityY;
      matAmt = (years >= 0 && cv > 0) ? Math.round(cv * Math.pow(1.04, years)) : (p.calculatedMaturity || 0);
    }
  } else {
    matY = maturityY;
    matAmt = p.calculatedMaturity || 0;
    if (p.payoutSchedule && Object.keys(p.payoutSchedule).length > 0) {
      Object.entries(p.payoutSchedule).forEach(([yr, amt]) => {
        const calYear = commencedY + parseInt(yr) - 1;
        if (!isNaN(calYear) && amt > 0) payouts.push({ year: calYear, amt });
      });
    }
  }

  // For assigned ULIPs: premiums stop the year before surrender
  const effectivePremEndY = isAssigned
    ? Math.min(isNaN(premEndY) ? matY : premEndY, matY - 1)
    : premEndY;

  return {
    id: p.id || p.name,
    name: p.name,
    company: p.company || '',
    logo: p.logo || '',
    type: p.type || 'Savings',
    premium: p.premium || 0,
    premStartY: isNaN(premStartY) ? TODAY_YEAR : premStartY,
    premEndY: isNaN(effectivePremEndY) ? TODAY_YEAR : effectivePremEndY,
    matY: isNaN(matY) ? 0 : matY,
    matAmt: matAmt || 0,
    payouts,
    drawdowns,   // [] unless standard ULIP + drawdownMode ON
    isAssigned,
    isULIP,
  };
}

/* ─────────────────────────────────────────────────────────────
   BUILD YEAR MAP   year → { inflows:[…], outflows:[…] }
───────────────────────────────────────────────────────────── */
function buildYearMap(resolved, rangeStart, rangeEnd) {
  const map = {};
  for (let y = rangeStart; y <= rangeEnd; y++) map[y] = { inflows: [], outflows: [] };

  resolved.forEach(r => {
    // Premiums (outflows)
    for (let y = Math.max(rangeStart, r.premStartY); y <= Math.min(rangeEnd, r.premEndY); y++) {
      if (map[y] && r.premium > 0)
        map[y].outflows.push({ type: r.type, name: r.name, amt: r.premium, logo: r.logo, company: r.company });
    }
    // Money-back payouts
    r.payouts.forEach(({ year, amt }) => {
      if (year >= rangeStart && year <= rangeEnd && map[year])
        map[year].inflows.push({ type: r.type, name: r.name, amt, logo: r.logo, company: r.company });
    });
    // Drawdown annual inflows (standard ULIP in drawdown mode)
    r.drawdowns.forEach(({ year, annualAmt, monthlyAmt }) => {
      if (year >= rangeStart && year <= rangeEnd && map[year])
        map[year].inflows.push({
          type: r.type, name: r.name, amt: annualAmt,
          isDrawdown: true, monthlyAmt, logo: r.logo, company: r.company,
        });
    });
    // Maturity / surrender inflow
    if (r.matY >= rangeStart && r.matY <= rangeEnd && r.matAmt > 0 && map[r.matY])
      map[r.matY].inflows.push({
        type: r.type, name: r.name, amt: r.matAmt,
        isMat: true, isSurrender: r.isAssigned, logo: r.logo, company: r.company,
      });
  });

  return map;
}

/* ─────────────────────────────────────────────────────────────
   DRILLDOWN PANEL — renders below chart on year click
───────────────────────────────────────────────────────────── */
function renderDrilldown(panel, year, yearMap, cfState) {
  const inflows  = (yearMap[year]?.inflows  || []).filter(f => cfState.activeTypes.has(f.type));
  const outflows = (yearMap[year]?.outflows || []).filter(f => cfState.activeTypes.has(f.type));
  const totalIn  = inflows.reduce((s, f) => s + f.amt, 0);
  const totalOut = outflows.reduce((s, f) => s + f.amt, 0);
  const net      = totalIn - totalOut;

  const outByType = {};
  outflows.forEach(f => { outByType[f.type] = (outByType[f.type] || 0) + f.amt; });
  const inByType  = {};
  inflows.forEach(f => { inByType[f.type]  = (inByType[f.type]  || 0) + f.amt; });

  const makeRows = (items, isInflow) => items.map(f => `
    <tr class="cf-dd-row">
      <td>
        <span class="cf-dd-badge" style="background:${typeColor(f.type)}22;color:${typeColor(f.type)};border-color:${typeColor(f.type)}44">
          ${f.type}
        </span>
      </td>
      <td class="cf-dd-name">
        <span class="cf-dd-name-inner">
          ${f.logo ? `<img class="cf-dd-logo" src="${f.logo}" alt="${f.company || ''}" title="${f.company || ''}" onerror="this.style.display='none'">` : (f.company ? `<span class="cf-dd-logo-initials" title="${f.company}">${f.company.replace(/[^A-Z]/g,'').slice(0,3) || f.company.slice(0,2).toUpperCase()}</span>` : '')}
          <span>${f.name}</span>
        </span>
        ${f.isMat && !f.isSurrender ? '<span class="cf-dd-star">★ maturity</span>' : ''}
        ${f.isSurrender ? '<span class="cf-dd-star" style="background:rgba(251,146,60,0.15);color:#fb923c;border-color:rgba(251,146,60,0.3)">⚡ surrender</span>' : ''}
        ${f.isDrawdown ? `<span class="cf-dd-drawdown-badge">↓ ${fmtInr(f.monthlyAmt)}/mo</span>` : ''}
      </td>
      <td class="cf-dd-amt" style="color:${isInflow ? '#34d399' : '#f87171'}">
        ${isInflow ? '+' : '−'}${fmtInr(f.amt)}
      </td>
    </tr>
  `).join('');

  const makeTypePills = (byType, isInflow) => Object.entries(byType).map(([t, amt]) => `
    <span class="cf-dd-type-pill" style="--c:${typeColor(t)}">
      <span class="cf-dd-type-dot"></span>${t}
      <strong>${isInflow ? '+' : '−'}${fmtInr(amt)}</strong>
    </span>
  `).join('');

  panel.innerHTML = `
    <div class="cf-dd-inner">
      <div class="cf-dd-header">
        <div class="cf-dd-title">
          <span class="cf-dd-year-badge">${year}</span>
          <span class="cf-dd-subtitle">Full Cashflow Breakdown</span>
          ${cfState.drawdownMode ? '<span class="cf-dd-mode-chip">📉 ULIP Drawdown ON</span>' : ''}
        </div>
        <button class="cf-dd-close" id="cf-dd-close-btn">✕ Close</button>
      </div>

      <div class="cf-dd-net-strip">
        <div class="cf-dd-net-cell">
          <span class="cf-dd-net-label">▲ Total Inflows</span>
          <span class="cf-dd-net-val" style="color:#34d399">${fmtInr(totalIn)}</span>
        </div>
        <div class="cf-dd-net-sep">−</div>
        <div class="cf-dd-net-cell">
          <span class="cf-dd-net-label">▼ Total Premiums</span>
          <span class="cf-dd-net-val" style="color:#f87171">${fmtInr(totalOut)}</span>
        </div>
        <div class="cf-dd-net-sep">=</div>
        <div class="cf-dd-net-cell cf-dd-net-result">
          <span class="cf-dd-net-label">Net Cashflow</span>
          <span class="cf-dd-net-val" style="color:${net >= 0 ? '#34d399' : '#f87171'};font-size:1.5rem">
            ${net >= 0 ? '+' : ''}${fmtInr(net)}
          </span>
        </div>
      </div>

      <div class="cf-dd-cols">
        <div class="cf-dd-col">
          <div class="cf-dd-col-header" style="color:#34d399">
            ▲ Inflows
            <span class="cf-dd-col-count">${inflows.length} item${inflows.length !== 1 ? 's' : ''}</span>
          </div>
          ${Object.keys(inByType).length ? `<div class="cf-dd-type-pills">${makeTypePills(inByType, true)}</div>` : ''}
          ${inflows.length ? `
            <table class="cf-dd-table">
              <thead><tr><th>Type</th><th>Policy</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>${makeRows(inflows, true)}</tbody>
              <tfoot><tr>
                <td colspan="2" style="color:#64748b;font-size:11px;font-weight:700;text-align:right;padding-top:8px;">TOTAL IN</td>
                <td class="cf-dd-amt" style="color:#34d399;padding-top:8px">+${fmtInr(totalIn)}</td>
              </tr></tfoot>
            </table>
          ` : '<div class="cf-dd-empty">No inflows this year</div>'}
        </div>

        <div class="cf-dd-col">
          <div class="cf-dd-col-header" style="color:#f87171">
            ▼ Premiums Out
            <span class="cf-dd-col-count">${outflows.length} polic${outflows.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          ${Object.keys(outByType).length ? `<div class="cf-dd-type-pills">${makeTypePills(outByType, false)}</div>` : ''}
          ${outflows.length ? `
            <table class="cf-dd-table">
              <thead><tr><th>Type</th><th>Policy</th><th style="text-align:right">Premium</th></tr></thead>
              <tbody>${makeRows(outflows, false)}</tbody>
              <tfoot><tr>
                <td colspan="2" style="color:#64748b;font-size:11px;font-weight:700;text-align:right;padding-top:8px;">TOTAL OUT</td>
                <td class="cf-dd-amt" style="color:#f87171;padding-top:8px">−${fmtInr(totalOut)}</td>
              </tr></tfoot>
            </table>
          ` : '<div class="cf-dd-empty">No premiums this year</div>'}
        </div>
      </div>
    </div>
  `;

  panel.style.display = 'block';
  requestAnimationFrame(() => { panel.classList.add('cf-dd-visible'); });

  panel.querySelector('#cf-dd-close-btn').addEventListener('click', () => {
    panel.classList.remove('cf-dd-visible');
    setTimeout(() => {
      panel.style.display = 'none';
      panel.innerHTML = '';
      document.querySelectorAll(`#cf-svg .cf-col-bg`).forEach(el => el.setAttribute('fill', 'transparent'));
      cfState._selectedYear = null;
      const hint = document.getElementById('cf-click-hint');
      if (hint) hint.classList.remove('faded');
    }, 300);
  });
}

/* ─────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────── */
function injectCFStyles() {
  if (document.getElementById('cf-styles')) return;
  const s = document.createElement('style');
  s.id = 'cf-styles';
  s.textContent = `
    /* ── Section shell ── */
    #cf-section {
      position: relative; background: #0a0f1e; border-radius: 32px;
      overflow: hidden; padding: 32px; margin-top: 24px; min-height: 520px;
    }
    #cf-section .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px);
      background-size: 48px 48px; animation: cfGridDrift 20s linear infinite;
      pointer-events: none; z-index: 0;
    }
    @keyframes cfGridDrift { 0% { background-position:0 0; } 100% { background-position:48px 48px; } }
    #cf-section .orb {
      position: absolute; border-radius: 50%; filter: blur(80px);
      pointer-events: none; z-index: 0; animation: cfOrbFloat 12s ease-in-out infinite alternate;
    }
    #cf-section .orb-1 { width:340px;height:340px;background:rgba(99,102,241,0.25);top:-80px;left:-60px;animation-delay:0s; }
    #cf-section .orb-2 { width:260px;height:260px;background:rgba(236,72,153,0.18);bottom:-60px;right:10%;animation-delay:-4s; }
    #cf-section .orb-3 { width:200px;height:200px;background:rgba(52,211,153,0.15);top:40%;left:55%;animation-delay:-8s; }
    @keyframes cfOrbFloat { 0% { transform:translate(0,0) scale(1); } 100% { transform:translate(30px,25px) scale(1.08); } }
    #cf-section .cf-content { position: relative; z-index: 1; }

    /* ── ULIP Drawdown toggle ── */
    .cf-drawdown-toggle {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 16px; border-radius: 999px;
      border: 1.5px solid rgba(96,165,250,0.25);
      background: rgba(96,165,250,0.07);
      cursor: pointer; transition: all 0.25s; user-select: none;
    }
    .cf-drawdown-toggle:hover { border-color: rgba(96,165,250,0.5); background: rgba(96,165,250,0.13); }
    .cf-drawdown-toggle.active {
      border-color: #60a5fa; background: rgba(96,165,250,0.18);
      box-shadow: 0 0 16px rgba(96,165,250,0.25);
    }
    .cf-drawdown-toggle-label {
      font-size: 11px; font-weight: 700; color: #60a5fa;
      text-transform: uppercase; letter-spacing: 0.07em;
    }
    /* The actual toggle switch */
    .cf-toggle-track {
      width: 36px; height: 20px; border-radius: 10px;
      background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.15);
      position: relative; transition: background 0.2s, border-color 0.2s; flex-shrink: 0;
    }
    .cf-toggle-track.on { background: #3b82f6; border-color: #60a5fa; }
    .cf-toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 14px; height: 14px; border-radius: 50%;
      background: rgba(255,255,255,0.4); transition: transform 0.2s, background 0.2s;
    }
    .cf-toggle-track.on .cf-toggle-thumb { transform: translateX(16px); background: #fff; }
    .cf-drawdown-info {
      font-size: 10px; color: #334155; text-transform: uppercase; letter-spacing: 0.06em;
    }
    /* Drawdown mode: shade the chart's drawdown bars with a dashed outline overlay */
    .cf-drawdown-bar-hint {
      fill: none; stroke: #60a5fa; stroke-width: 1.5;
      stroke-dasharray: 3 2; opacity: 0.6; pointer-events: none;
    }

    /* ── Filter pills ── */
    .cf-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: #cbd5e1; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      cursor: pointer; transition: all 0.2s; user-select: none;
    }
    .cf-pill:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }
    .cf-pill.active { color:#fff; border-color:var(--pill-color,#6366f1); background:rgba(99,102,241,0.22); box-shadow:0 0 12px var(--pill-color,#6366f1); }
    .cf-pill .dot { width:8px;height:8px;border-radius:50%;background:var(--pill-color,#6366f1); }
    .cf-range-pill {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04);
      color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .cf-range-pill.active, .cf-range-pill:hover { background: rgba(99,102,241,0.25); border-color: #6366f1; color: #fff; }

    /* ── Chart ── */
    #cf-chart-wrap { position: relative; width: 100%; overflow-x: auto; margin-bottom: 4px; }
    #cf-svg { display: block; }
    #cf-click-hint {
      text-align: center; color: #334155; font-size: 10px; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;
      opacity: 1; transition: opacity 0.4s;
    }
    #cf-click-hint.faded { opacity: 0; }

    /* ── Drilldown panel ── */
    #cf-drilldown {
      display: none; margin-top: 16px; border-radius: 20px; overflow: hidden;
      border: 1px solid rgba(99,102,241,0.3); background: rgba(15,20,40,0.95);
      backdrop-filter: blur(16px); opacity: 0; transform: translateY(12px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #cf-drilldown.cf-dd-visible { opacity: 1; transform: translateY(0); }
    .cf-dd-inner { padding: 24px; }

    .cf-dd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .cf-dd-title { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .cf-dd-year-badge {
      font-size: 28px; font-weight: 900;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .cf-dd-subtitle { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
    .cf-dd-mode-chip {
      font-size: 10px; font-weight: 800; color: #60a5fa;
      background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.3);
      border-radius: 999px; padding: 2px 10px; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .cf-dd-close {
      padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06); color: #94a3b8; font-size: 11px; font-weight: 700;
      cursor: pointer; transition: all 0.2s; flex-shrink: 0;
    }
    .cf-dd-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

    .cf-dd-net-strip {
      display: flex; align-items: center; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      padding: 16px 24px; margin-bottom: 24px; flex-wrap: wrap; gap: 8px;
    }
    .cf-dd-net-cell { flex: 1; text-align: center; min-width: 100px; }
    .cf-dd-net-label { display: block; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .cf-dd-net-val { display: block; font-size: 1.25rem; font-weight: 900; }
    .cf-dd-net-sep { font-size: 20px; font-weight: 900; color: #334155; padding: 0 8px; }
    .cf-dd-net-result .cf-dd-net-val { font-size: 1.5rem !important; }

    .cf-dd-type-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .cf-dd-type-pill {
      display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
      background: color-mix(in srgb, var(--c) 12%, transparent);
      color: var(--c); font-size: 10px; font-weight: 700;
    }
    .cf-dd-type-dot { width:6px;height:6px;border-radius:50%;background:var(--c);flex-shrink:0; }

    .cf-dd-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 700px) { .cf-dd-cols { grid-template-columns: 1fr; } }
    .cf-dd-col { min-width: 0; }
    .cf-dd-col-header {
      font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
    }
    .cf-dd-col-count {
      font-size: 10px; font-weight: 600; color: #475569;
      background: rgba(255,255,255,0.06); border-radius: 999px;
      padding: 1px 8px; border: 1px solid rgba(255,255,255,0.08);
    }

    .cf-dd-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .cf-dd-table thead th {
      text-align: left; color: #334155; font-size: 9px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.1em;
      padding: 0 8px 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .cf-dd-table thead th:last-child { text-align: right; }
    .cf-dd-row td { padding: 7px 8px 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .cf-dd-row:last-child td { border-bottom: none; }
    .cf-dd-row:hover { background: rgba(255,255,255,0.03); }
    .cf-dd-table tfoot td { border-top: 1px solid rgba(255,255,255,0.1); }

    .cf-dd-badge {
      display: inline-block; padding: 2px 7px; border-radius: 5px;
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.04em; border: 1px solid; white-space: nowrap;
    }
    .cf-dd-name { color: #cbd5e1; padding-left: 4px; }
    .cf-dd-name-inner { display: inline-flex; align-items: center; gap: 6px; }
    .cf-dd-logo {
      width: 20px; height: 20px; border-radius: 4px; object-fit: contain;
      background: rgba(255,255,255,0.08); flex-shrink: 0;
      vertical-align: middle; padding: 1px;
    }
    .cf-dd-logo-initials {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
      font-size: 7px; font-weight: 900; color: #94a3b8; letter-spacing: -0.5px;
    }
    .cf-dd-star {
      display: inline-block; margin-left: 5px;
      background: rgba(251,191,36,0.15); color: #fbbf24;
      border: 1px solid rgba(251,191,36,0.3);
      border-radius: 4px; padding: 1px 5px; font-size: 9px; font-weight: 800;
    }
    .cf-dd-drawdown-badge {
      display: inline-block; margin-left: 5px;
      background: rgba(96,165,250,0.12); color: #60a5fa;
      border: 1px solid rgba(96,165,250,0.3);
      border-radius: 4px; padding: 1px 5px; font-size: 9px; font-weight: 800;
    }
    .cf-dd-amt { text-align: right; font-weight: 800; white-space: nowrap; }
    .cf-dd-empty { color: #334155; font-size: 12px; font-style: italic; padding: 16px 0; }

    /* ── Tooltip ── */
    #cf-tooltip {
      position: fixed; z-index: 9999; pointer-events: none;
      background: rgba(10,15,30,0.96); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px; padding: 12px 16px; font-size: 12px; color: #e2e8f0;
      min-width: 190px; box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      backdrop-filter: blur(12px); display: none;
    }
    #cf-tooltip .tt-year { font-size:13px;font-weight:900;color:#fff;margin-bottom:6px; }
    #cf-tooltip .tt-hint { font-size:9px;color:#334155;margin-bottom:8px;font-style:italic; }
    #cf-tooltip .tt-row { display:flex;align-items:center;gap:6px;margin:3px 0; }
    #cf-tooltip .tt-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    #cf-tooltip .tt-name { flex:1;color:#94a3b8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px; }
    #cf-tooltip .tt-amt { font-weight:700;font-size:12px;white-space:nowrap; }

    /* ── Labels ── */
    .cf-y-label { fill:#475569;font-size:10px;font-family:'Inter',sans-serif; }
    .cf-x-label { fill:#64748b;font-size:11px;font-family:'Inter',sans-serif; }
    .cf-baseline-label { fill:#334155;font-size:9px;font-family:'Inter',sans-serif; }
    #cf-legend { display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px; }
    .cf-legend-item { display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;font-weight:600; }
    .cf-legend-dot { width:10px;height:10px;border-radius:3px; }
    .cf-drawdown-legend-item {
      display:inline-flex; align-items:center; gap:6px;
      font-size:11px; color:#60a5fa; font-weight:700;
      background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2);
      border-radius: 999px; padding: 2px 10px;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
   CHART DRAW
───────────────────────────────────────────────────────────── */
function drawChart(container, resolved, cfState) {
  const rangeStart = TODAY_YEAR;
  const rangeEnd   = cfState.rangeEnd;
  const activeResolved = resolved.filter(r => cfState.activeTypes.has(r.type));
  const yearMap = buildYearMap(activeResolved, rangeStart, rangeEnd);
  cfState._yearMap = yearMap;

  const years = [];
  for (let y = rangeStart; y <= rangeEnd; y++) years.push(y);
  const allTypes = [...cfState.activeTypes];

  const stackedIn = years.map(y => {
    const row = {}; allTypes.forEach(t => { row[t] = 0; });
    (yearMap[y].inflows || []).forEach(f => { row[f.type] = (row[f.type] || 0) + f.amt; });
    return row;
  });
  const stackedOut = years.map(y => {
    const row = {}; allTypes.forEach(t => { row[t] = 0; });
    (yearMap[y].outflows || []).forEach(f => { row[f.type] = (row[f.type] || 0) + f.amt; });
    return row;
  });

  const maxIn  = Math.max(...stackedIn.map(r  => allTypes.reduce((s, t) => s + (r[t]  || 0), 0)), 1);
  const maxOut = Math.max(...stackedOut.map(r => allTypes.reduce((s, t) => s + (r[t] || 0), 0)), 1);
  const maxVal = Math.max(maxIn, maxOut);

  const BAR_W = 22, BAR_GAP = 8, SLOT_W = BAR_W + BAR_GAP;
  const PAD_L = 68, PAD_R = 20, PAD_TOP = 20, PAD_BOT = 36;
  const CHART_H = 260;
  const SVG_H   = CHART_H * 2 + PAD_TOP + PAD_BOT + 20;
  const SVG_W   = PAD_L + years.length * SLOT_W + PAD_R;
  const BASELINE_Y = PAD_TOP + CHART_H;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'cf-svg';
  svg.setAttribute('width', SVG_W); svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  const tooltip    = document.getElementById('cf-tooltip');
  const drillPanel = document.getElementById('cf-drilldown');
  const hint       = document.getElementById('cf-click-hint');

  /* Grid lines */
  [0.25, 0.5, 0.75, 1.0].forEach(frac => {
    [BASELINE_Y - frac * CHART_H, BASELINE_Y + frac * CHART_H].forEach((yPos, i) => {
      const gl = document.createElementNS(ns, 'line');
      gl.setAttribute('x1', PAD_L); gl.setAttribute('x2', SVG_W - PAD_R);
      gl.setAttribute('y1', yPos);  gl.setAttribute('y2', yPos);
      gl.setAttribute('stroke', i === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)');
      gl.setAttribute('stroke-width', '1');
      svg.appendChild(gl);
      const lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', PAD_L - 6); lbl.setAttribute('y', yPos + 3);
      lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 'cf-y-label');
      lbl.textContent = fmtInr(maxVal * frac);
      svg.appendChild(lbl);
    });
  });

  /* Baseline */
  const bl = document.createElementNS(ns, 'line');
  bl.setAttribute('x1', PAD_L); bl.setAttribute('x2', SVG_W - PAD_R);
  bl.setAttribute('y1', BASELINE_Y); bl.setAttribute('y2', BASELINE_Y);
  bl.setAttribute('stroke', 'rgba(255,255,255,0.18)'); bl.setAttribute('stroke-width', '1.5');
  svg.appendChild(bl);

  [['▲ INFLOWS', '#34d399', BASELINE_Y - 6], ['▼ PREMIUMS', '#f87171', BASELINE_Y + 14]].forEach(([txt, col, y]) => {
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', PAD_L - 6); lbl.setAttribute('y', y);
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 'cf-baseline-label');
    lbl.setAttribute('fill', col); lbl.textContent = txt;
    svg.appendChild(lbl);
  });

  /* Bars per year */
  years.forEach((y, i) => {
    const x      = PAD_L + i * SLOT_W;
    const inRow  = stackedIn[i];
    const outRow = stackedOut[i];

    /* Column background */
    const colBg = document.createElementNS(ns, 'rect');
    colBg.setAttribute('x', x - 4); colBg.setAttribute('y', PAD_TOP);
    colBg.setAttribute('width', BAR_W + 8); colBg.setAttribute('height', CHART_H * 2);
    colBg.setAttribute('fill', cfState._selectedYear === y ? 'rgba(99,102,241,0.18)' : 'transparent');
    colBg.setAttribute('rx', '4'); colBg.setAttribute('class', 'cf-col-bg');
    svg.appendChild(colBg);

    /* Inflow bars */
    let yInCursor = BASELINE_Y;
    allTypes.forEach(t => {
      const amt = inRow[t] || 0; if (!amt) return;
      const h = Math.max(1, Math.round((amt / maxVal) * CHART_H));
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', yInCursor - h);
      rect.setAttribute('width', BAR_W); rect.setAttribute('height', h);
      rect.setAttribute('fill', typeColor(t)); rect.setAttribute('rx', '3');
      rect.setAttribute('opacity', '0.88');
      svg.appendChild(rect);

      // If drawdown mode: add a dashed outline on ULIP inflow bars to indicate drawdown
      if (cfState.drawdownMode && t === 'ULIP') {
        const hint2 = document.createElementNS(ns, 'rect');
        hint2.setAttribute('x', x); hint2.setAttribute('y', yInCursor - h);
        hint2.setAttribute('width', BAR_W); hint2.setAttribute('height', h);
        hint2.setAttribute('rx', '3'); hint2.setAttribute('class', 'cf-drawdown-bar-hint');
        svg.appendChild(hint2);
      }
      yInCursor -= h + 1;
    });

    /* Outflow bars */
    let yOutCursor = BASELINE_Y;
    allTypes.forEach(t => {
      const amt = outRow[t] || 0; if (!amt) return;
      const h = Math.max(1, Math.round((amt / maxVal) * CHART_H));
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', yOutCursor);
      rect.setAttribute('width', BAR_W); rect.setAttribute('height', h);
      rect.setAttribute('fill', typeColor(t)); rect.setAttribute('rx', '3');
      rect.setAttribute('opacity', '0.5');
      svg.appendChild(rect);
      yOutCursor += h + 1;
    });

    /* Hit area */
    const hitRect = document.createElementNS(ns, 'rect');
    hitRect.setAttribute('x', x - 4); hitRect.setAttribute('y', PAD_TOP);
    hitRect.setAttribute('width', BAR_W + 8); hitRect.setAttribute('height', CHART_H * 2);
    hitRect.setAttribute('fill', 'transparent');
    hitRect.style.cursor = 'pointer';

    hitRect.addEventListener('mouseenter', () => {
      if (cfState._selectedYear !== y) colBg.setAttribute('fill', 'rgba(255,255,255,0.04)');
      const inflows  = (yearMap[y].inflows  || []).filter(f => cfState.activeTypes.has(f.type));
      const outflows = (yearMap[y].outflows || []).filter(f => cfState.activeTypes.has(f.type));
      const totalIn  = inflows.reduce((s, f) => s + f.amt, 0);
      const totalOut = outflows.reduce((s, f) => s + f.amt, 0);
      const net      = totalIn - totalOut;

      let html = `<div class="tt-year">${y}</div>`;
      html += `<div class="tt-hint">click to open full breakdown ↓</div>`;
      if (inflows.length) {
        html += `<div style="font-size:10px;color:#34d399;font-weight:700;margin-bottom:4px;">▲ INFLOWS</div>`;
        inflows.slice(0, 4).forEach(f => {
          const tag = f.isDrawdown ? ` <span style="color:#60a5fa;font-size:9px;">(${fmtInr(f.monthlyAmt)}/mo)</span>` : (f.isSurrender ? ' ⚡' : f.isMat ? ' ★' : '');
          const logoHtml = f.logo ? `<img src="${f.logo}" style="width:14px;height:14px;border-radius:3px;object-fit:contain;background:rgba(255,255,255,0.08);flex-shrink:0;padding:1px;" onerror="this.style.display='none'">` : '';
          html += `<div class="tt-row">${logoHtml}<span class="tt-dot" style="background:${typeColor(f.type)}"></span><span class="tt-name">${f.name}${tag}</span><span class="tt-amt" style="color:${typeColor(f.type)}">${fmtInr(f.amt)}</span></div>`;
        });
        if (inflows.length > 4) html += `<div style="font-size:10px;color:#475569;margin:2px 0 4px">+${inflows.length - 4} more</div>`;
        html += `<div class="tt-row" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:4px;padding-top:4px;"><span style="flex:1;font-size:10px;color:#94a3b8">Total in</span><span class="tt-amt" style="color:#34d399">${fmtInr(totalIn)}</span></div>`;
      }
      if (outflows.length) {
        html += `<div style="font-size:10px;color:#f87171;font-weight:700;margin:6px 0 4px;">▼ PREMIUMS</div>`;
        outflows.slice(0, 3).forEach(f => {
          const logoHtml = f.logo ? `<img src="${f.logo}" style="width:14px;height:14px;border-radius:3px;object-fit:contain;background:rgba(255,255,255,0.08);flex-shrink:0;padding:1px;" onerror="this.style.display='none'">` : '';
          html += `<div class="tt-row">${logoHtml}<span class="tt-dot" style="background:${typeColor(f.type)};opacity:0.55"></span><span class="tt-name">${f.name}</span><span class="tt-amt" style="color:#f87171">${fmtInr(f.amt)}</span></div>`;
        });
        if (outflows.length > 3) html += `<div style="font-size:10px;color:#475569;margin-top:2px;">+${outflows.length - 3} more</div>`;
        html += `<div class="tt-row" style="border-top:1px solid rgba(255,255,255,0.08);margin-top:4px;padding-top:4px;"><span style="flex:1;font-size:10px;color:#94a3b8">Total out</span><span class="tt-amt" style="color:#f87171">${fmtInr(totalOut)}</span></div>`;
      }
      if (totalIn || totalOut)
        html += `<div class="tt-row" style="margin-top:6px;"><span style="flex:1;font-size:11px;font-weight:700;color:#fff">Net</span><span class="tt-amt" style="color:${net >= 0 ? '#34d399' : '#f87171'}">${net >= 0 ? '+' : ''}${fmtInr(net)}</span></div>`;
      if (!inflows.length && !outflows.length)
        html += '<div style="color:#475569;font-size:11px;">No cashflows</div>';

      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
    });

    hitRect.addEventListener('mousemove', e => {
      const tx = Math.min(e.clientX + 14, window.innerWidth - 220);
      const ty = Math.min(e.clientY - 30, window.innerHeight - tooltip.offsetHeight - 10);
      tooltip.style.left = tx + 'px'; tooltip.style.top = ty + 'px';
    });

    hitRect.addEventListener('mouseleave', () => {
      if (cfState._selectedYear !== y) colBg.setAttribute('fill', 'transparent');
      tooltip.style.display = 'none';
    });

    hitRect.addEventListener('click', () => {
      tooltip.style.display = 'none';
      svg.querySelectorAll('.cf-col-bg').forEach(el => el.setAttribute('fill', 'transparent'));

      if (cfState._selectedYear === y) {
        cfState._selectedYear = null;
        if (drillPanel) {
          drillPanel.classList.remove('cf-dd-visible');
          setTimeout(() => { drillPanel.style.display = 'none'; drillPanel.innerHTML = ''; }, 300);
        }
        if (hint) hint.classList.remove('faded');
        return;
      }
      cfState._selectedYear = y;
      colBg.setAttribute('fill', 'rgba(99,102,241,0.18)');
      if (hint) hint.classList.add('faded');
      if (drillPanel) {
        renderDrilldown(drillPanel, y, yearMap, cfState);
        setTimeout(() => { drillPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
      }
    });

    svg.appendChild(hitRect);

    if (i % 2 === 0 || y === rangeEnd) {
      const xl = document.createElementNS(ns, 'text');
      xl.setAttribute('x', x + BAR_W / 2);
      xl.setAttribute('y', BASELINE_Y + CHART_H + PAD_BOT - 6);
      xl.setAttribute('text-anchor', 'middle'); xl.setAttribute('class', 'cf-x-label');
      xl.textContent = y;
      svg.appendChild(xl);
    }
  });

  const wrap = container.querySelector('#cf-chart-wrap');
  wrap.innerHTML = '';
  wrap.appendChild(svg);

  if (cfState._selectedYear && drillPanel) {
    renderDrilldown(drillPanel, cfState._selectedYear, yearMap, cfState);
    drillPanel.style.display = 'block';
    drillPanel.classList.add('cf-dd-visible');
  }
}

/* ─────────────────────────────────────────────────────────────
   SUMMARY NUMBERS
───────────────────────────────────────────────────────────── */
function computeSummary(resolved) {
  let totalPremiums = 0, totalInflows = 0;
  resolved.forEach(r => {
    const yrs = Math.max(0, r.premEndY - TODAY_YEAR + 1);
    totalPremiums += r.premium * yrs;
    totalInflows  += r.payouts.reduce((s, p) => s + p.amt, 0)
                   + r.drawdowns.reduce((s, d) => s + d.annualAmt, 0)
                   + (r.matAmt || 0);
  });
  const net    = totalInflows - totalPremiums;
  const future = resolved.filter(r => r.matY >= TODAY_YEAR && r.matAmt > 0).sort((a, b) => a.matY - b.matY);
  const next   = future[0] || null;
  return { totalPremiums, totalInflows, net, next };
}

/* ─────────────────────────────────────────────────────────────
   EXPORTED: updateCashflowSummary
───────────────────────────────────────────────────────────── */
export function updateCashflowSummary(bar, indiaList) {
  const resolved = (indiaList || []).map(p => resolvePolicy(p, false));
  const { totalPremiums, totalInflows, net, next } = computeSummary(resolved);

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
   EXPORTED: renderCashflow
───────────────────────────────────────────────────────────── */
export function renderCashflow(container, indiaList) {
  injectCFStyles();

  if (!document.getElementById('cf-tooltip')) {
    const tt = document.createElement('div');
    tt.id = 'cf-tooltip';
    document.body.appendChild(tt);
  }

  const RANGES = [
    { label: '2026–2035', end: 2035 },
    { label: '2026–2045', end: 2045 },
    { label: '2026–2060', end: 2060 },
  ];

  const cfState = {
    activeTypes:   null, // set after first resolve
    rangeEnd:      2045,
    drawdownMode:  false,
    _selectedYear: null,
    _yearMap:      null,
  };

  function buildResolved() {
    return (indiaList || []).map(p => resolvePolicy(p, cfState.drawdownMode));
  }

  let resolved = buildResolved();
  const existingTypes = [...new Set(resolved.map(r => r.type))];
  cfState.activeTypes = new Set(existingTypes);

  // Count eligible ULIP policies for drawdown info text
  const drawdownEligible = resolved.filter(r => r.isULIP && !r.isAssigned);

  container.innerHTML = `
    <div class="bg-grid"></div>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="cf-content">

      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-tight">📊 India Insurance Cashflow</h2>
          <p class="text-xs text-slate-500 mt-0.5">Premiums out (↓) · Maturities &amp; payouts in (↑) · ★ = maturity · ⚡ = surrender</p>
        </div>
        <div class="flex gap-2 flex-wrap items-center">
          <!-- ULIP Drawdown Toggle -->
          <div class="cf-drawdown-toggle" id="cf-drawdown-toggle" title="Spread standard ULIP corpus as monthly drawdown after premium term ends">
            <div class="cf-toggle-track" id="cf-toggle-track">
              <div class="cf-toggle-thumb"></div>
            </div>
            <span class="cf-drawdown-toggle-label">📉 ULIP Drawdown</span>
            <span class="cf-drawdown-info" id="cf-drawdown-info">${drawdownEligible.length} polic${drawdownEligible.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <!-- Range pills -->
          <div class="flex gap-2 flex-wrap" id="cf-range-pills">
            ${RANGES.map(r => `<span class="cf-range-pill${r.end === cfState.rangeEnd ? ' active' : ''}" data-end="${r.end}">${r.label}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="flex gap-2 flex-wrap mb-2 items-center" id="cf-type-pills">
        ${existingTypes.map(t => `
          <span class="cf-pill active" data-type="${t}" style="--pill-color:${typeColor(t)}">
            <span class="dot" style="background:${typeColor(t)}"></span>${t}
          </span>`).join('')}
      </div>

      <!-- Drawdown mode explainer (shown only when ON) -->
      <div id="cf-drawdown-explainer" style="display:none;margin-bottom:10px;">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);">
          <span style="font-size:10px;color:#60a5fa;font-weight:700;">📉 DRAWDOWN MODE</span>
          <span style="font-size:10px;color:#475569;">Standard ULIP corpus spread as level monthly withdrawals from PPT end → maturity. Assigned ULIPs unaffected.</span>
        </div>
      </div>

      <div id="cf-legend">
        ${existingTypes.map(t => `
          <div class="cf-legend-item">
            <span class="cf-legend-dot" style="background:${typeColor(t)}"></span>
            <span>${t}</span>
          </div>`).join('')}
        <div class="cf-legend-item">
          <span class="cf-legend-dot" style="background:rgba(255,255,255,0.35)"></span>
          <span style="color:#64748b">Darker = inflows · Lighter = premiums</span>
        </div>
        <div class="cf-drawdown-legend-item" id="cf-drawdown-legend" style="display:none;">
          <span style="width:14px;height:8px;border:1.5px dashed #60a5fa;border-radius:2px;display:inline-block;"></span>
          Dashed outline = ULIP drawdown
        </div>
      </div>

      <div id="cf-chart-wrap"></div>
      <div id="cf-click-hint">👆 Click any year bar to open a full cashflow breakdown below</div>
      <div id="cf-drilldown"></div>

    </div>
  `;

  drawChart(container, resolved, cfState);

  /* ── Drawdown toggle ── */
  const toggleBtn   = container.querySelector('#cf-drawdown-toggle');
  const toggleTrack = container.querySelector('#cf-toggle-track');
  const ddExplainer = container.querySelector('#cf-drawdown-explainer');
  const ddLegend    = container.querySelector('#cf-drawdown-legend');

  toggleBtn.addEventListener('click', () => {
    cfState.drawdownMode = !cfState.drawdownMode;
    toggleTrack.classList.toggle('on', cfState.drawdownMode);
    toggleBtn.classList.toggle('active', cfState.drawdownMode);
    ddExplainer.style.display = cfState.drawdownMode ? 'block' : 'none';
    ddLegend.style.display    = cfState.drawdownMode ? 'inline-flex' : 'none';

    // Re-resolve policies with new drawdown mode
    resolved = buildResolved();
    drawChart(container, resolved, cfState);
  });

  /* ── Type filter pills ── */
  container.querySelectorAll('.cf-pill[data-type]').forEach(pill => {
    pill.addEventListener('click', () => {
      const t = pill.dataset.type;
      if (cfState.activeTypes.has(t)) {
        if (cfState.activeTypes.size > 1) cfState.activeTypes.delete(t);
      } else {
        cfState.activeTypes.add(t);
      }
      pill.classList.toggle('active', cfState.activeTypes.has(t));
      drawChart(container, resolved, cfState);
    });
  });

  /* ── Range pills ── */
  container.querySelectorAll('.cf-range-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      cfState.rangeEnd = parseInt(pill.dataset.end);
      container.querySelectorAll('.cf-range-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      drawChart(container, resolved, cfState);
    });
  });
}
