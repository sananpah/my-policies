/* component_in.js - v4.2.0 - IRR Badge Added */
import { checkIsDueSoon, autoFmt, toNum, safeParseDate, safeGetYear, monthMap, getTimeRemaining } from './utils.js';

/**
 * IRR via Newton-Raphson. cashflows[t] = net cash at year t.
 * Returns IRR as a percentage (e.g. 8.34) or null if no solution.
 */
function calcIRR(cashflows, guess = 0.08, maxIter = 200, tol = 1e-8) {
    if (!cashflows || cashflows.length < 2) return null;
    if (!cashflows.some(c => c < 0) || !cashflows.some(c => c > 0)) return null;
    let rate = guess;
    for (let i = 0; i < maxIter; i++) {
        let npv = 0, dnpv = 0;
        for (let t = 0; t < cashflows.length; t++) {
            const d = Math.pow(1 + rate, t);
            npv  += cashflows[t] / d;
            dnpv -= t * cashflows[t] / (d * (1 + rate));
        }
        if (Math.abs(dnpv) < 1e-14) break;
        const nr = rate - npv / dnpv;
        if (Math.abs(nr - rate) < tol) { rate = nr; break; }
        rate = Math.max(-0.99, Math.min(10, nr));
    }
    const pct = Math.round(rate * 10000) / 100;
    return (pct > -50 && pct < 200) ? pct : null;
}

/** India ULIP cashflows: -premium each paying year, +payouts received, +currentValue at end */
function buildIndiaULIPCashflows(p, yearsCompleted) {
    const premium   = toNum(p.premium);
    const exitValue = toNum(p.unitValueNumeric || 0);
    if (premium <= 0 || exitValue <= 0 || yearsCompleted < 1) return null;
    const pptYears  = toNum(p.ppt || 99);
    const flows = [];
    for (let y = 0; y <= yearsCompleted; y++) {
        let cf = 0;
        if (y < yearsCompleted && y < pptYears) cf -= premium;
        if (p.payoutSchedule && p.payoutSchedule[y]) cf += toNum(p.payoutSchedule[y]);
        if (y === yearsCompleted) cf += exitValue;
        flows.push(cf);
    }
    return flows;
}

/** Funky skewed IRR pill badge */
function irrBadgeHtml(irr, label = 'IRR p.a.') {
    if (irr === null || irr === undefined) return '';
    const isGood   = irr >= 10;
    const isMid    = irr >= 5 && irr < 10;
    const color    = isGood ? '#059669' : isMid ? '#d97706' : '#e11d48';
    const bgClr    = isGood ? '#ecfdf5' : isMid ? '#fffbeb' : '#fff1f2';
    const border   = isGood ? '#6ee7b7' : isMid ? '#fcd34d' : '#fecaca';
    const arrow    = isGood ? '▲' : isMid ? '◆' : '▼';
    const sign     = irr > 0 ? '+' : '';
    return `<div class="irr-badge" style="display:inline-flex;align-items:center;gap:5px;background:${bgClr};border:1.5px solid ${border};color:${color};border-radius:8px;padding:3px 10px;transform:skewX(-8deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;box-shadow:2px 2px 0 ${border};white-space:nowrap;cursor:default;" title="Annualised Internal Rate of Return on premiums paid to date"><span style="transform:skewX(8deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:0.65;">${label}</span><span style="font-size:13px;letter-spacing:-0.02em;">${arrow} ${sign}${irr.toFixed(1)}%</span></span></div>`;
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
    
    const badgeText = isIncomePhase ? "Income Phase" : (p.type || "Savings");

    // --- IRR CALCULATION (ULIP only) ---
    let irrHtml = '';
    if (isULIP) {
        const flows = buildIndiaULIPCashflows(p, yearsCompleted);
        const irr   = calcIRR(flows);
        irrHtml = irrBadgeHtml(irr, 'IRR p.a.');
    }
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
                    <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-start;">
                        <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${badgeText}</div>
                        ${irrHtml}
                    </div>
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
            
            <div class="mt-4 p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-3">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee</p>
                <div class="flex items-center h-10">${nomineeBoxContent}</div>
            </div>

            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
