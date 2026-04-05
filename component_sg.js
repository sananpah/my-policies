/* component_sg.js - v6.6.7 - Fixed Countdown + 15yr Horizon + Exit Logic */
import { autoFmt, toNum } from './india.js';

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
    
    // Anniversary & Progress
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    let yearsPassed = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    // --- 1. CORE FINANCIALS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    
    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));

    // --- 2. PRECISE COUNTDOWN LOGIC ---
    let vestingStr = "";
    if (mip === 0) {
        vestingStr = "Vested";
    } else {
        const targetDate = new Date(startY + mip, commMonth, commDay);
        if (targetDate <= TODAY) {
            vestingStr = "Vested";
        } else {
            let years = targetDate.getFullYear() - TODAY.getFullYear();
            let months = targetDate.getMonth() - TODAY.getMonth();
            let days = targetDate.getDate() - TODAY.getDate();
            if (days < 0) months--;
            if (months < 0) { years--; months += 12; }
            vestingStr = `Left: ${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;
        }
    }

    // --- 3. SMART HORIZON (15yr Min for New, Maturity for Old) ---
    const yearsToMat = endY - startY;
    let maxYears;
    if (yearsToMat <= 25) {
        maxYears = yearsToMat; 
    } else {
        // Newest policies show 15 years; older ones scale with age
        maxYears = Math.max(15, policyYearIdx + 5); 
        maxYears = Math.min(maxYears, yearsToMat);
    }

    // --- 4. EXIT STRATEGY PROJECTION (PPT + 2 YEARS @ 4%) ---
    const exitYearOffset = 2;
    const targetExitYear = startY + ppt + exitYearOffset;
    const projectionYears = Math.max(0, targetExitYear - CURRENT_YEAR);
    const r = 0.04;
    const lastPayYear = startY + ppt;
    const yearsToPay = isPaidUp ? 0 : Math.max(0, lastPayYear - (hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR));

    const fvUnits = accountValue * Math.pow(1 + r, projectionYears);
    let fvPremiums = 0;
    if (yearsToPay > 0) {
        fvPremiums = annualPremium * ((Math.pow(1 + r, yearsToPay) - 1) / r) * (1 + r);
        const gapToExit = projectionYears - yearsToPay;
        if (gapToExit > 0) fvPremiums = fvPremiums * Math.pow(1 + r, gapToExit);
    }
    const totalProjected = Math.round(fvUnits + fvPremiums);

    // --- 5. TIMELINE GENERATION ---
    let timelineHtml = '';
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        let colorClass = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear) ? "bg-emerald-900" : (yr === CURRENT_YEAR ? "bg-black ring-2 ring-white z-20 scale-110 shadow-xl" : (polY <= mip ? "bg-indigo-500" : (polY <= ppt ? "bg-pink-400" : "bg-red-600")));
        let statusLabel = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear) ? "Completed" : (yr === CURRENT_YEAR ? "Premium Due" : (polY <= mip ? "Strict Lock" : (polY <= ppt ? "Flexi Phase" : "Vested")));

        timelineHtml += `
            <div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment">
                <div class="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b>
                    <span class="text-white font-bold tracking-tight">${statusLabel}</span>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            </div>`;
    }

    const starHtml = `
        <div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help">
            <span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span>
            <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-4 rounded-2xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[250px]">
                <b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-2 font-black">Exit Strategy Projection (4%)</b>
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px] text-slate-400"><span>Target Exit:</span><span class="text-white font-bold">${targetExitYear}</span></div>
                    <div class="flex justify-between text-[10px] text-slate-400"><span>Future Premiums:</span><span class="text-white font-bold">${autoFmt(yearsToPay * annualPremium, sym)}</span></div>
                    <div class="h-[1px] bg-white/10 my-1"></div>
                    <div class="flex justify-between text-[13px] text-emerald-400 font-black"><span>Est. Surrender:</span><span>${autoFmt(totalProjected, sym)}*</span></div>
                </div>
                <div class="mt-2 pt-2 border-t border-white/10 text-[8px] text-slate-400 italic font-medium leading-tight">*Compounded @ 4% until exit in ${targetExitYear}.</div>
                <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
            </div>
        </div>`;

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    const nextDueDisplay = new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-2 relative" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="p-8 flex items-center justify-between cursor-pointer relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 pl-6 pr-4">
                <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded-[24px] shadow-sm p-3 relative z-20">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div class="relative z-20">
                    <h3 class="font-black text-3xl text-slate-900 mb-2 tracking-tight">${p.name}</h3>
                </div>
            </div>
            <div class="flex items-center gap-10 text-right px-4 relative z-20">
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Premium</p><p class="text-2xl font-black text-slate-800">${autoFmt(p.premium, sym)}</p></div>
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Valuation</p><p class="text-2xl font-black text-slate-900">${p.currentUnitValue}</p></div>
                <div class="bg-white/60 px-6 py-3 rounded-[20px] border border-white/50 flex flex-col justify-center min-w-[125px] h-[64px]">
                    <p class="text-[9px] font-black ${vestingStr === "Vested" ? 'text-emerald-500' : 'text-indigo-500'} uppercase text-center">${vestingStr}</p>
                    <div class="h-[1px] bg-slate-200/40 w-full my-1"></div>
                    <p class="text-sm font-black text-slate-700 text-center tracking-tight">${nextDueDisplay}</p>
                </div>
            </div>
        </div>
        <div class="content-area px-10 pb-10 pt-2 relative z-20" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-5 gap-4 mb-8">
                <div class="p-6 rounded-[32px] bg-slate-50 border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Policy No.</p><p class="text-lg font-mono font-bold text-slate-700">#${p.id}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Sum Assured</p><p class="text-xl font-black text-slate-800">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Invested</p><p class="text-xl font-black text-slate-800">${autoFmt(totalPremiumsPaid - (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0), sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm"><p class="text-[10px] font-black text-emerald-600 mb-2 uppercase text-center">Surrender</p><p class="text-2xl font-black text-emerald-700 text-center">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm"><p class="text-[10px] font-black text-red-400 mb-2 uppercase text-center">Locked</p><p class="text-2xl font-black text-red-600 text-center">-${autoFmt(accountValue - surrenderValue, sym)}</p></div>
            </div>
            <div class="flex justify-between items-end mb-4 px-2">
                <div><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p><p class="text-sm font-bold text-slate-700 underline decoration-sky-300 decoration-2 underline-offset-4">${p.commenced}</p></div>
                <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Maturity</p><p class="text-sm font-bold text-slate-700 underline decoration-amber-300 decoration-2 underline-offset-4">${p.maturity}</p></div>
            </div>
            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 border border-slate-200/50">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
