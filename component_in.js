/* component_in.js - v4.1.46 - Dynamic Maturity & Step Logic Integration */
import { checkIsDueSoon, autoFmt, toNum, safeParseDate, safeGetYear, monthMap, getTimeRemaining } from './utils.js';

/* ── IRR ENGINE ─────────────────────────────────────────────────────────
 * Placed here so it is tree-shaken with this module only.
 * Three payment patterns (no single-lump-sum; not in this portfolio):
 *   Pattern 1 — regular annual premiums
 *   Pattern 2 — regular premiums + top-up  (totalPremiumPaid > premium×years by >5%)
 *   Pattern 3 — assigned policy (sumAssured=0); same flows, different badge label
 * Bug fix: use policyYearIdx (payments actually made) not yearsCompleted (calendar years)
 * ──────────────────────────────────────────────────────────────────────── */
function _calcIRR(flows, guess = 0.08, iter = 200, tol = 1e-10) {
    if (!flows || flows.length < 2) return null;
    if (!flows.some(c => c < 0) || !flows.some(c => c > 0)) return null;
    let r = guess;
    for (let i = 0; i < iter; i++) {
        let npv = 0, d = 0;
        for (let t = 0; t < flows.length; t++) {
            const disc = Math.pow(1 + r, t);
            npv += flows[t] / disc;
            d   -= t * flows[t] / (disc * (1 + r));
        }
        if (Math.abs(d) < 1e-14) break;
        const nr = r - npv / d;
        if (Math.abs(nr - r) < tol) { r = nr; break; }
        r = Math.max(-0.99, Math.min(10, nr));
    }
    const pct = Math.round(r * 10000) / 100;
    return (pct > -50 && pct < 200) ? pct : null;
}

function _buildIndiaFlows(p, policyYearIdx, yearsCompleted) {
    const premium   = toNum(p.premium);
    const totalPaid = toNum(p.totalPremiumPaid || 0);
    const exitVal   = toNum(p.unitValueNumeric || 0);
    const pptYears  = toNum(p.ppt || policyYearIdx);
    const payYrs    = Math.min(pptYears, policyYearIdx);
    if (premium <= 0 || exitVal <= 0 || payYrs < 1) return null;

    const regular   = premium * payYrs;
    const residual  = totalPaid > 0 ? Math.max(0, totalPaid - regular) : 0;
    const isIrreg   = residual > Math.max(totalPaid, regular) * 0.05;
    const lastPayY  = Math.max(0, payYrs - 1);

    const flows = [];
    for (let y = 0; y <= yearsCompleted; y++) {
        let cf = 0;
        if (y < payYrs)                              cf -= premium;
        if (isIrreg && y === lastPayY)               cf -= residual;
        if (p.payoutSchedule && p.payoutSchedule[y]) cf += toNum(p.payoutSchedule[y]);
        if (y === yearsCompleted)                    cf += exitVal;
        flows.push(cf);
    }
    flows._isIrreg  = isIrreg;
    flows._residual = residual;
    flows._isAssign = toNum(p.sumAssured) === 0;
    return flows;
}

/**
 * For policies ≤ 1 year old: Newton-Raphson is unreliable with only 1-2 data points.
 * Use prorated simple annualisation instead:
 *   monthly gain = (exitValue / totalCost) − 1
 *   annualised   = monthly gain × (12 / monthsElapsed)
 * e.g. −1% over 1 month → −12% annualised; +2% over 6 months → +4% annualised.
 * Label changes to "Ann. %" to signal it is a projection, not a full IRR.
 */
function _proratedReturn(costPaid, exitVal, commencedStr, TODAY) {
    if (costPaid <= 0 || exitVal <= 0) return null;
    // Parse commenced date
    const mp = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,
                 "Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };
    const parts = (commencedStr || '').replace(/\./g,' ').split(' ');
    if (parts.length < 3) return null;
    const start = new Date(parseInt(parts[2]), mp[parts[1]]||0, parseInt(parts[0]));
    const msElapsed   = TODAY - start;
    const daysElapsed = msElapsed / 86400000;
    if (daysElapsed < 7) return null;      // too fresh — meaningless
    const monthsElapsed = daysElapsed / 30.44;
    const totalReturn   = (exitVal / costPaid) - 1;       // e.g. −0.01 for −1%
    const annualised    = totalReturn * (12 / monthsElapsed);  // prorated to 1 year
    const pct           = Math.round(annualised * 10000) / 100;
    return (pct > -200 && pct < 500) ? { pct, monthsElapsed: Math.round(monthsElapsed), isProrated: true } : null;
}

function _irrBadgeIndia(irr, flows, isProrated = false, monthsElapsed = null) {
    if (irr === null || irr === undefined) return '';
    const isGood  = irr >= 6;
    const isNeg   = irr < 0;
    const bg   = isGood ? '#ecfdf5' : isNeg ? '#fff1f2' : '#fffbeb';
    const fg   = isGood ? '#059669' : isNeg ? '#dc2626' : '#d97706';
    const bd   = isGood ? '#6ee7b7' : isNeg ? '#fca5a5' : '#fcd34d';
    const ar   = irr >= 8 ? '▲' : isNeg ? '▼' : '◆';
    const pfx  = isNeg ? '−' : '';   // minus sign only for negative; no + ever
    let lbl   = 'IRR p.a.';
    let tip   = 'Annualised IRR on all premiums paid to date vs current portfolio value';
    if (isProrated && monthsElapsed !== null) {
        lbl = 'Ann. %';
        tip = 'Policy < 1 year old (' + monthsElapsed + ' months). Simple annualised return — prorated from actual gain to date. Not a full IRR.';
    } else if (flows && flows._isAssign) {
        lbl = 'IRR (Assigned)';
        tip = 'Policy assigned as collateral. IRR on actual premiums paid.';
    } else if (flows && flows._isIrreg) {
        lbl = 'IRR (Top-up)';
        tip = 'IRR includes ₹' + Math.round(flows._residual).toLocaleString('en-IN') + ' top-up beyond regular premiums.';
    }
    return `<div title="${tip}" style="display:inline-flex;align-items:center;gap:4px;background:${bg};border:1.5px solid ${bd};color:${fg};border-radius:8px;padding:4px 11px;transform:skewX(-7deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;box-shadow:2px 2px 0 ${bd};white-space:nowrap;cursor:default;"><span style="transform:skewX(7deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:0.65;">${lbl}</span><span style="font-size:13px;letter-spacing:-0.02em;">${ar} ${pfx}${Math.abs(irr).toFixed(1)}%</span></span></div>`;
}

function _pvBadge(pv, sym, ratePct, years) {
    if (!pv || pv <= 0) return '';
    const fmt = n => sym + Math.round(n).toLocaleString('en-IN');
    return `<div title="Present Value of remaining pension stream @ ${ratePct}% discount rate over ${years} years — lump-sum equivalent today" style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border:1.5px solid #93c5fd;color:#1d4ed8;border-radius:8px;padding:4px 11px;transform:skewX(-7deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;box-shadow:2px 2px 0 #93c5fd;white-space:nowrap;cursor:default;"><span style="transform:skewX(7deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:0.65;">PV@${ratePct}%</span><span style="font-size:12px;letter-spacing:-0.02em;">≈ ${fmt(pv)}</span></span></div>`;
}

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
    const commStr = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]);
    const annMonthNum = monthMap[startParts[1]] || 0;
    const startY = parseInt(startParts[2]);

    const anniversaryThisYear = new Date(CURRENT_YEAR, annMonthNum, annDay);
    let yearsCompleted = CURRENT_YEAR - startY;
    if (TODAY < anniversaryThisYear) yearsCompleted--;
    // policyYearIdx = number of annual premium payments actually made so far
    // (differs from yearsCompleted when anniversary has already passed this calendar year)
    const policyYearIdx = (TODAY >= anniversaryThisYear) ? yearsCompleted + 1 : yearsCompleted;
    
    const matStr = p.maturity || "01 Jan 2050";
    const matY = safeGetYear(matStr);

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    const finalPremiumDate = safeParseDate(p.premiumEnds);
    const isStillPaying = TODAY <= finalPremiumDate;
    const scheduledPayout = (p.payoutSchedule && p.payoutSchedule[yearsCompleted + 1]);
    const isIncomePhase = !isStillPaying && !!scheduledPayout;
    const isPaidUp = (p.status === "PAID UP") || (TODAY > finalPremiumDate);

    // --- NOMINEE & ASSIGNED LOGIC ---
    const isAssigned = toNum(p.sumAssured) === 0;
    let nomineeBoxContent = "";
    if (isAssigned) {
        nomineeBoxContent = `<div class="flex items-center gap-2"><span class="text-xl">🛡️</span><div class="flex flex-col text-left"><span class="text-[10px] font-black text-emerald-600 uppercase leading-none">Vested Benefit</span><span class="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1 italic">Policy is Assigned</span></div></div>`;
    } else if (p.nomineeStatus === "EMPTY") {
        nomineeBoxContent = `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase tracking-widest">Unassigned</span>`;
    } else if (p.nomineeStatus === "NA") {
        nomineeBoxContent = `<span class="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">N/A</span>`;
    } else {
        nomineeBoxContent = `<div class="flex -space-x-3">${(p.nominees || []).map(n => `<img src="${n.img}" class="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-20">`).join('')}</div>`;
    }

    let middleLabel = "Annual Premium", middleValue = autoFmt(p.premium, sym), middleColor = isStillPaying ? "text-emerald-600 font-black" : "text-slate-700";
    if (isPaidUp && !isIncomePhase) middleColor = "text-slate-400 line-through font-bold";
    else if (isIncomePhase) { middleLabel = "Annual Payout"; middleValue = autoFmt(scheduledPayout, sym); middleColor = "text-[#854d0e] font-black"; }
    
    // ── IRR / PV CALCULATION ──────────────────────────────────────────────
    let _irrBadgeHtml = '';
    const isPension = !isULIP && (
        toNum(p.annualPayout) > 0 ||
        (p.payoutSchedule && Object.keys(p.payoutSchedule).length > 3)
    );

    if (isULIP) {
        const flows = _buildIndiaFlows(p, policyYearIdx, yearsCompleted);

        // Young policy (≤1 full year of data): prorated simple annualisation
        // Newton-Raphson is unreliable with only 1-2 data points
        if (yearsCompleted <= 1) {
            const costBasis = toNum(p.totalPremiumPaid || 0) || toNum(p.premium);
            const exitVal   = toNum(p.unitValueNumeric || 0);
            const prorated  = _proratedReturn(costBasis, exitVal, p.commenced, TODAY);
            if (prorated) {
                _irrBadgeHtml = _irrBadgeIndia(prorated.pct, flows, true, prorated.monthsElapsed);
            }
        } else {
            const irr = _calcIRR(flows);
            _irrBadgeHtml = _irrBadgeIndia(irr, flows, false, null);
        }

    } else if (isPension) {
        const RATE       = 0.06;
        const annPension = toNum(p.annualPayout) ||
            (p.payoutSchedule ? Math.max(...Object.values(p.payoutSchedule).map(toNum)) : 0);
        if (annPension > 0) {
            const futureYrs = Math.max(0, safeGetYear(p.maturity) - CURRENT_YEAR);
            const pvStream  = annPension * (1 - Math.pow(1 + RATE, -futureYrs)) / RATE;
            const pvToday   = pvStream;

            // Full IRR: premiums paid + PV of remaining pension as terminal value
            const premEndY  = safeGetYear(p.premiumEnds);
            const flows = [];
            for (let y = 0; y <= yearsCompleted; y++) {
                let cf = 0;
                if (startY + y <= premEndY && !isPaidUp) cf -= toNum(p.premium);
                if (p.payoutSchedule && p.payoutSchedule[y]) cf += toNum(p.payoutSchedule[y]);
                if (y === yearsCompleted) cf += pvToday;
                flows.push(cf);
            }
            const irr = _calcIRR(flows);
            _irrBadgeHtml = _irrBadgeIndia(irr, null) + ' ' + _pvBadge(pvToday, sym, 6, futureYrs);
        }
    }

    const badgeText = isIncomePhase ? "Income Phase" : (p.type || "Savings");
    const nextDueStr = `${annDay} ${startParts[1]} ${TODAY >= anniversaryThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`; 
    const finalDueDate = isPaidUp ? "PAID UP" : nextDueStr;

    // --- TIMELINE LOGIC ---
    let timelineHtml = '';
    const premEndYear = safeGetYear(p.premiumEnds);

    for(let yr = startY; yr < matY; yr++) {
        const loopPolY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isLoopCurrent = yr === CURRENT_YEAR;
        const loopPayout = (p.payoutSchedule && p.payoutSchedule[loopPolY]);
        
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || (isPaidUp && yr === premEndYear) || (isLoopCurrent && TODAY >= anniversaryThisYear);
            if (loopPayout) {
                color = isPast ? "bg-emerald-600" : "bg-emerald-400";
                phase = "Premium + Payout";
                detail = `Pay: ${autoFmt(p.premium, sym)} | Get: ${autoFmt(loopPayout, sym)}`;
            } else {
                color = (isLoopCurrent && TODAY < anniversaryThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else {
            if (loopPayout) {
                color = isPast ? "bg-amber-600" : "bg-amber-400";
                phase = isPast ? "Payout Received" : "Scheduled Payout";
                detail = `Income: ${autoFmt(loopPayout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = isPast ? "Growth (Historical)" : "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        
        timelineHtml += `
            <div class="segment ${color}">
                <div class="tooltip">
                    <b class="${loopPayout ? 'text-amber-300' : 'text-emerald-400'} uppercase tracking-tighter">${phase}</b><br>
                    ${detail}<br>
                    <span class="opacity-40 text-[9px]">Year ${loopPolY} (${yr})</span>
                </div>
                ${loopPayout ? `<div class="payout-dot"></div>` : ''} 
            </div>`;
    }


    // --- DYNAMIC MATURITY HOVER LOGIC ---
    let matHoverDetail = "";
      if (isULIP) {
          matHoverDetail = `<span class="text-[10px] font-black leading-tight text-white">${p.maturityAmt}</span>`;
      } else if (p.maturityLabel) {
         // Handle "Special Surrender Value" or other text-based benefits
          matHoverDetail = `
              <div class="text-[10px] font-black text-orange-300 uppercase leading-tight">${p.maturityLabel}</div>
              <div class="text-[8px] opacity-60 mt-1 italic leading-tight">Refer Policy Doc for Value</div>
            `;
        } else if (p.calculatedMaturity) {
            matHoverDetail = `
              <div class="text-[10px] font-black text-white">${autoFmt(p.calculatedMaturity, sym)}</div>
              <div class="text-[8px] opacity-60 mt-1 italic leading-tight">${p.maturityFormula}</div>
            `;
        } else {
            matHoverDetail = `<div class="text-[10px] font-black text-white">${autoFmt(p.sumAssured, sym)}</div>`;
        }

    timelineHtml += `
        <div class="mat-star">
            ★
            <div class="tooltip" style="min-width: 150px;">
                <b class="text-orange-400 uppercase tracking-widest text-[9px]">${isULIP ? 'Projected Maturity*' : 'Maturity Benefit'}</b><br>
                ${matHoverDetail}
            </div>
        </div>`;

    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${badgeText}</div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div><p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">${middleLabel}</p><p class="text-lg ${middleColor} leading-none">${middleValue}</p></div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    ${isAssigned ? `<img src="assigned.png" class="h-10 object-contain mx-auto opacity-95 transform -rotate-3">` : 
                        `<div><p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sum Assured</p><p class="text-lg font-black text-slate-800 leading-none">${autoFmt(p.sumAssured, sym)}</p></div>`
                    }
                </div>
            </div>
            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                ${isPaidUp && !isIncomePhase ? `<img src="paid.jpg" class="paid-logo mx-auto h-12 object-contain">` : 
                    `<div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">${getTimeRemaining(p.premiumEnds, TODAY) ? 'Left: ' + getTimeRemaining(p.premiumEnds, TODAY) : ''}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>`}
            </div>
        </div>
        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p style="font-family:'Orbitron'; font-weight:700;">${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>UIN Number</p><p style="font-family:'Orbitron'; font-weight:700;">${p.uin || 'N/A'}</p></div>
                ${isULIP ? `<div class="detail-item" style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; padding: 10px;"><p style="color:#4338ca; font-weight:800; font-size:10px; text-transform:uppercase;">Portfolio Value</p><p style="font-weight:900; color:#1e1b4b; font-size:18px; font-family:'Orbitron';">${p.currentUnitValue || 'No Value'}</p></div>` : 
                `<div class="detail-item"><p>Customer ID</p><p style="font-family:'Orbitron'; font-weight:700;">${p.clientId || 'N/A'}</p></div>`}
            </div>
            
            <div class="mt-4 p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex flex-col gap-2 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee</p>
                        <div class="flex items-center h-10">${nomineeBoxContent}</div>
                    </div>
                    ${_irrBadgeHtml ? `<div class="flex flex-col items-end gap-2 flex-shrink-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Returns</p>
                        <div class="flex items-center gap-2 flex-wrap justify-end">${_irrBadgeHtml}</div>
                    </div>` : ''}
                </div>
            </div>

            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
