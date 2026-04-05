/* component_sg.js - v6.5.8 - Strict Lock Label + Hard Stop Maturity */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const matDate = new Date(p.maturity);
    const startY = commDate.getFullYear();
    const endY = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    // 1. DYNAMIC DATA FROM EXCEL (PPT:MAT:MIP)
    const mip = (p.mip !== undefined) ? p.mip : 0;
    const ppt = (p.ppt !== undefined) ? p.ppt : 0;
    const isPaidUp = (p.dueDate === "PAID UP");
    
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
            if (months < 0) { years--; months += 12; }
            vestingStr = `${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;
        }
    }

    // 2. PAYMENT DATES
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueDisplay = new Date(nextDueYear, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // 3. POLICY PROGRESS
    let yearsPassed = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    // --- SCALE: HARD STOP AT MATURITY (Fixes the 22nd bar issue) ---
    const yearsToMat = endY - startY; 
    let maxYears = Math.max(mip, 15, policyYearIdx + 5);
    if (yearsToMat > 0) {
        maxYears = Math.min(maxYears, yearsToMat);
    }
    maxYears = Math.min(40, maxYears); 

    let timelineHtml = '';
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        let colorClass = "";
        let statusLabel = "";

        if (yr < CURRENT_YEAR) {
            colorClass = "bg-emerald-900"; statusLabel = "Completed";
        } else if (yr === CURRENT_YEAR) {
            colorClass = hasPassedThisYear ? "bg-emerald-900" : "bg-black ring-2 ring-white z-20 scale-110 shadow-xl";
            statusLabel = hasPassedThisYear ? "Completed" : "Premium Due";
        } else {
            // --- UPDATED LABELS ---
            if (polY <= mip && mip > 0) {
                colorClass = "bg-indigo-500"; statusLabel = "Strict Lock";
            } else if (polY <= ppt) {
                colorClass = "bg-pink-400"; statusLabel = "Flexi Phase";
            } else {
                colorClass = "bg-red-600"; statusLabel = "Vested";
            }
        }

        timelineHtml += `
            <div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment">
                <div class="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b>
                    <span class="text-white font-bold tracking-tight">${statusLabel}</span>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            </div>`;
    }

    // 4. UI COMPONENTS
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const starHtml = `<div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help"><span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span><div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-3 rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px]"><b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-1">Maturity</b><span class="text-xs font-black block">Unit Value : ${p.currentUnitValue}</span><div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div></div></div>`;
    
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    const netInvestmentBase = totalPremiumsPaid - totalWithdrawn;
    
    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));
    const lockedValue = accountValue - surrenderValue;

    const capHtml = (p.totalPremiumPaid || totalWithdrawn > 0) ? `<div class="mb-8 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm"><div class="flex justify-between items-center mb-4"><h4 class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capital Analysis</h4><span class="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[9px] font-bold">Withdrawals Tracked</span></div><div class="grid grid-cols-3 gap-4"><div class="p-3 rounded-2xl bg-slate-50"><p class="text-[9px] font-bold text-slate-400 uppercase">Paid</p><p class="font-black text-slate-700">${autoFmt(totalPremiumsPaid, sym)}</p></div><div class="p-3 rounded-2xl bg-slate-50"><p class="text-[9px] font-bold text-slate-400 uppercase">Withdrawn</p><p class="font-black text-red-500">-${autoFmt(totalWithdrawn, sym)}</p></div><div class="p-3 rounded-2xl bg-indigo-50 border border-indigo-100"><p class="text-[9px] font-bold text-indigo-400 uppercase">Net Base</p><p class="font-black text-indigo-900">${autoFmt(netInvestmentBase, sym)}</p></div></div></div>` : '';
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

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
                    <p class="text-[9px] font-black ${vestingStr === "Vested" ? 'text-emerald-500' : 'text-indigo-500'} uppercase text-center">
                        ${vestingStr === "Vested" ? 'Vested' : 'Left: ' + vestingStr}
                    </p>
                    <div class="h-[1px] bg-slate-200/40 w-full my-1"></div>
                    ${isPaidUp ? `
                        <p class="text-[9px] font-black text-emerald-600 uppercase text-center">Fully Paid</p>
                    ` : `
                        <p class="text-[9px] font-black text-sky-500 uppercase text-center">Due: <span class="text-slate-700">${nextDueDisplay}</span></p>
                    `}
                </div>
            </div>
        </div>
        <div class="content-area px-10 pb-10 pt-2 relative z-20" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-5 gap-4 mb-8">
                <div class="p-6 rounded-[32px] bg-slate-50 border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Policy No.</p><p class="text-lg font-mono font-bold text-slate-700">#${p.id}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Sum Assured</p><p class="text-xl font-black text-slate-800">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Invested</p><p class="text-xl font-black text-slate-800">${autoFmt(netInvestmentBase, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm"><p class="text-[10px] font-black text-emerald-600 mb-2 uppercase text-center">Surrender</p><p class="text-2xl font-black text-emerald-700 text-center">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm"><p class="text-[10px] font-black text-red-400 mb-2 uppercase text-center">Locked</p><p class="text-2xl font-black text-red-600 text-center">-${autoFmt(lockedValue, sym)}</p></div>
            </div>
            ${capHtml}
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
