/* component_sg.js - v7.3.0 - Layout Synced: Match India Height & Attribute Placement */
import { autoFmt, toNum, getTimeRemaining, checkIsDueSoon } from './utils.js';

/* ── IRR ENGINE (SG) ──────────────────────────────────────────────────────
 * Uses policyYearIdx (payments actually made) not calendar years elapsed.
 * Three patterns: regular, top-up/irregular, no single-lump-sum in portfolio.
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

function _buildSGFlows(p, policyYearIdx, accountValue, annualPremium) {
    if (annualPremium <= 0 || accountValue <= 0 || policyYearIdx < 1) return null;
    const pptYears   = toNum(p.ppt || policyYearIdx);
    const totalPaid  = toNum(p.totalPremiumPaid || 0);
    const withdrawals = p.withdrawals || [];
    const payYrs     = Math.min(pptYears, policyYearIdx);
    const regular    = annualPremium * payYrs;
    const residual   = totalPaid > 0 ? Math.max(0, totalPaid - regular) : 0;
    const isIrreg    = residual > Math.max(totalPaid, regular) * 0.05;
    const lastPayY   = Math.max(0, payYrs - 1);

    const flows = [];
    for (let y = 0; y <= policyYearIdx; y++) {
        let cf = 0;
        if (y < payYrs)                              cf -= annualPremium;
        if (isIrreg && y === lastPayY)               cf -= residual;
        if (y > 0 && withdrawals[y - 1])             cf += toNum(withdrawals[y - 1]);
        if (y === policyYearIdx)                     cf += accountValue;
        flows.push(cf);
    }
    flows._isIrreg  = isIrreg;
    flows._residual = residual;
    return flows;
}

function _sgIrrBadge(irr, flows, sym) {
    if (irr === null || irr === undefined) return '';
    const isGood = irr >= 10, isMid = irr >= 5 && irr < 10;
    const bg  = isGood ? '#ecfdf5' : isMid ? '#fffbeb' : '#fff1f2';
    const fg  = isGood ? '#059669' : isMid ? '#d97706' : '#e11d48';
    const bd  = isGood ? '#6ee7b7' : isMid ? '#fcd34d' : '#fecaca';
    const ar  = isGood ? '▲'       : isMid ? '◆'       : '▼';
    const sgn = irr > 0 ? '+' : '';
    let lbl   = 'IRR p.a.';
    let tip   = 'Annualised IRR: total premiums paid (minus withdrawals) vs current portfolio value';
    if (flows && flows._isIrreg) {
        lbl = 'IRR (Top-up)';
        tip = 'IRR includes ' + sym + Math.round(flows._residual).toLocaleString() + ' top-up beyond regular premiums.';
    }
    return `<div title="${tip}" style="display:inline-flex;align-items:center;gap:4px;background:${bg};border:1.5px solid ${bd};color:${fg};border-radius:8px;padding:4px 11px;transform:skewX(-7deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;box-shadow:2px 2px 0 ${bd};white-space:nowrap;cursor:default;"><span style="transform:skewX(7deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:0.65;">${lbl}</span><span style="font-size:13px;letter-spacing:-0.02em;">${ar} ${sgn}${irr.toFixed(1)}%</span></span></div>`;
}

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const matDate = new Date(p.maturity);
    const startY = commDate.getFullYear();
    const endY = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    const mip = (p.mip !== undefined) ? p.mip : 0;
    const ppt = (p.ppt !== undefined) ? p.ppt : 0;
    const isPaidUp = (p.dueDate === "PAID UP");
    
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    let yearsPassed = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    // --- COUNTDOWN ---
    let premRemainingStr = "";
    if (isPaidUp) { premRemainingStr = "PAID UP"; }
    else if (mip === 0) { premRemainingStr = "VESTED"; }
    else {
        let targetDate = new Date(startY + mip, commMonth, commDay);
        if (targetDate <= TODAY) { premRemainingStr = "VESTED"; }
        else {
            let y = targetDate.getFullYear() - TODAY.getFullYear();
            let m = targetDate.getMonth() - TODAY.getMonth();
            let d = targetDate.getDate() - TODAY.getDate();
            if (d < 0) { m--; }
            if (m < 0) { y--; m += 12; }
            premRemainingStr = `${String(Math.max(0, y)).padStart(2, '0')}Y ${String(Math.max(0, m)).padStart(2, '0')}M`;
        }
    }
    
    // --- DUE DATE & BLINKING LOGIC ---
    const nextDueDateStr = new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isFinishedPaying = isPaidUp || premRemainingStr === "VESTED";
    const finalDueDate = isFinishedPaying ? (isPaidUp ? "PAID UP" : "VESTED") : nextDueDateStr;
    const dueBlinkClass = (!isFinishedPaying && checkIsDueSoon(finalDueDate)) ? 'text-red-500 animate-pulse' : 'text-slate-900';

    // --- MATH ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const actualTotalPaid = p.totalPremiumPaid > 0 ? p.totalPremiumPaid : (annualPremium * policyYearIdx);
    const totalWithdrawn = (p.withdrawals || []).reduce((sum, val) => sum + val, 0);
    const netInvested = Math.round(actualTotalPaid - totalWithdrawn);

    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    let surrenderValue = (p.surrenderBase === "PREMIUM") 
        ? Math.round(Math.max(0, accountValue - (chargePct / 100 * actualTotalPaid)))
        : Math.round(Math.max(0, accountValue * (1 - (chargePct / 100))));

    const lockedDisplay = (accountValue - surrenderValue) <= 0 
        ? `<span class="text-slate-400 text-sm font-bold uppercase tracking-widest">Fully Vested</span>` 
        : `-${autoFmt(accountValue - surrenderValue, sym)}`;

    // ── IRR CALCULATION ──────────────────────────────────────────────────
    const _sgFlows   = _buildSGFlows(p, policyYearIdx, accountValue, annualPremium);
    const _sgIrr     = _calcIRR(_sgFlows);
    const _irrBadge  = _sgIrrBadge(_sgIrr, _sgFlows, sym);

    // --- UI ELEMENTS ---
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    const targetExitYear = Math.min(endY, startY + ppt + 2);
    const calcProj = (rate) => Math.round((accountValue * Math.pow(1 + rate, Math.max(0, targetExitYear - CURRENT_YEAR))) + (isPaidUp ? 0 : (annualPremium * ((Math.pow(1 + rate, Math.max(0, Math.min(startY + ppt, targetExitYear) - (hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR))) - 1) / rate) * (1 + rate))));
    const starHtml = `<div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help"><span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span><div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-4 rounded-2xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px]"><b class="text-orange-400 uppercase tracking-widest text-[9px] block mb-2 font-black">Projected Maturity*</b><div class="space-y-1"><div class="flex justify-between text-[10px] font-black leading-tight text-white"><span>Est. @4%:</span><span>${autoFmt(calcProj(0.04), sym)}</span></div><div class="flex justify-between text-[10px] font-black leading-tight text-white"><span>Est. @8%:</span><span>${autoFmt(calcProj(0.08), sym)}</span></div></div><div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div></div></div>`;

    let timelineHtml = '';
    const yearsToMat = endY - startY;
    let maxYears = (yearsToMat <= 25) ? yearsToMat : Math.min(Math.max(15, policyYearIdx + 5), yearsToMat);
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        const isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear);
        const colorClass = isPast ? "bg-emerald-900" : (yr === CURRENT_YEAR ? "bg-black ring-2 ring-white z-20 scale-110 shadow-xl" : (polY <= mip ? "bg-indigo-500" : (polY <= ppt ? "bg-pink-400" : "bg-red-600")));
        const statusLabel = isPast ? "Completed" : (yr === CURRENT_YEAR ? "Premium Due" : (polY <= mip ? "Strict Lock" : (polY <= ppt ? "Flexi Phase" : "Vested")));
        timelineHtml += `
            <div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment">
                <div class="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b><span class="text-white font-bold tracking-tight">${statusLabel}</span>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            </div>`;
    }

    const nomineeHtml = (p.nomineeStatus === "NA") ? `<span class="text-[11px] font-black text-slate-400 uppercase italic">N/A</span>` :
                      (!p.nominees || p.nominees.length === 0 || p.nomineeStatus === "EMPTY") ? `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase">Unassigned</span>` :
                      `<div class="flex -space-x-3 items-center">${p.nominees.map(n => `<img src="${n.img}" class="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-20">`).join('')}</div>`;

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
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${p.type || 'Savings'}</div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Annual Premium</p>
                            <p class="text-lg text-[#059669] font-black leading-none">${autoFmt(p.premium, sym)}</p>
                        </div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sum Assured</p>
                        <p class="text-lg font-black text-slate-800 leading-none">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p>
                    </div>
                </div>
            </div>
            
            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                    <p class="text-[9px] font-black ${premRemainingStr === 'VESTED' ? 'text-emerald-500' : 'text-indigo-500'} uppercase leading-none mb-1">${premRemainingStr === 'VESTED' || isPaidUp ? premRemainingStr : 'Left: ' + premRemainingStr}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                    <div class="font-black text-[11px] ${dueBlinkClass}">${finalDueDate}</div>
                </div>
            </div>
        </div>

        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm"><p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Policy Number</p><p class="text-[17px] font-bold text-slate-800 tracking-widest" style="font-family:'Orbitron'">${p.id}</p></div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm"><p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Valuation</p><p class="text-[19px] font-black text-slate-900 tracking-tighter" style="font-family:'Orbitron'">${autoFmt(accountValue, sym)}</p></div>
            </div>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Invested (Net)</p>
                    <p class="text-[17px] font-black text-slate-800 tracking-tight" style="font-family:'Orbitron'">${autoFmt(netInvested, sym)}</p>
                    <p class="text-[8px] font-bold text-slate-400 mt-2 italic">* Withdrawals & Holidays Factored</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center shadow-sm"><p class="text-[9px] font-bold text-emerald-600 uppercase mb-1.5">Surrender</p><p class="text-[20px] font-black text-emerald-700" style="font-family:'Orbitron'">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-4 rounded-xl bg-red-50/50 border border-red-100 text-center shadow-sm flex flex-col justify-center items-center"><p class="text-[9px] font-bold text-red-400 uppercase mb-1.5">Locked</p><p class="text-[20px] font-black text-red-600 leading-none" style="font-family:'Orbitron'">${lockedDisplay}</p></div>
            </div>

            <div class="mb-6 p-4 bg-white/50 border border-slate-100 rounded-[24px] shadow-sm">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex flex-col gap-2 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee(s)</p>
                        <div class="flex items-center h-10">${nomineeHtml}</div>
                    </div>
                    ${_irrBadge ? `<div class="flex flex-col items-end gap-2 flex-shrink-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Returns</p>
                        <div class="flex items-center gap-2">${_irrBadge}</div>
                    </div>` : ''}
                </div>
            </div>
            <div class="flex justify-between items-end mb-4 px-2">
                <div><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p><p class="text-sm font-bold text-slate-700 underline decoration-sky-300 underline-offset-4">${p.commenced}</p></div>
                <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Maturity</p><p class="text-sm font-bold text-slate-700 underline decoration-amber-300 underline-offset-4">${p.maturity}</p></div>
            </div>
            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 border border-slate-200/50 shadow-inner">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
