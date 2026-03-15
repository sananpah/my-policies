/* component_sg.js - v6.3.7 - Restored Date Headers & Logic Final */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();
    
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const displaySumAssured = (toNum(p.sumAssured) === 0) ? accountValue : toNum(p.sumAssured);

    const company = p.company.toUpperCase();
    const isSinglife = company.includes("SINGLIFE");
    const isFlexiBrand = company.includes("MANULIFE") || company.includes("HSBC");
    const isAIA = company.includes("AIA") || company.includes("PRUDENTIAL");

    // Anniversary check for the CURRENT calendar year only
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;

    // Policy Year Index (for surrender charges and investment base)
    let yearsPassedForCharges = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassedForCharges--;
    const policyYearIdx = yearsPassedForCharges + 1;

    const totalInvestmentBase = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + b, 0);
    const netInvestmentBase = totalInvestmentBase - totalWithdrawn;

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    const chargePct = p.surrenderCharges[policyYearIdx] || 0;
    let surrenderChargeAmount = (isSinglife || isFlexiBrand) ? totalInvestmentBase * (chargePct / 100) : accountValue * (chargePct / 100);
    const surrenderValue = Math.round(Math.max(0, accountValue - surrenderChargeAmount));
    const lockedValue = Math.round(accountValue - surrenderValue);

    let timelineHtml = '';
    const maxYears = isAIA ? 30 : 15;

    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        let colorClass = "";
        let statusLabel = "";

        if (yr < CURRENT_YEAR) {
            colorClass = "bg-emerald-900";
            statusLabel = "Completed";
        } 
        else if (yr === CURRENT_YEAR) {
            if (hasPassedThisYear) {
                colorClass = "bg-emerald-900";
                statusLabel = "Completed";
            } else {
                colorClass = "bg-black ring-2 ring-white z-20 scale-110 shadow-xl";
                statusLabel = "Premium Due";
            }
        } 
        else {
            if (isSinglife) {
                if (polY <= 3) { colorClass = "bg-indigo-500"; statusLabel = "Locked"; }
                else if (polY <= 10) { colorClass = "bg-pink-400"; statusLabel = "Flexi Premium+Locked"; }
                else { colorClass = "bg-red-600"; statusLabel = "Vested"; }
            } else if (isFlexiBrand) {
                if (polY <= 5) { colorClass = "bg-indigo-500"; statusLabel = "Locked"; }
                else if (polY <= 10) { colorClass = "bg-pink-400"; statusLabel = "Flexi Premium+Locked"; }
                else { colorClass = "bg-red-600"; statusLabel = "Vested"; }
            } else {
                const chargeAtYear = p.surrenderCharges[polY] || 0;
                colorClass = chargeAtYear > 0 ? "bg-pink-400" : "bg-red-600";
                statusLabel = chargeAtYear > 0 ? "Locked" : "Vested";
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

    const starHtml = `<div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help"><span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span><div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-3 rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px]"><b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-1">Maturity</b><span class="text-xs font-black block">Unit Value : ${autoFmt(accountValue, sym)}</span><div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div></div></div>`;

    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueDisplay = new Date(nextDueYear, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 relative" id="card-${p.id}">
        <div class="absolute top-0 left-0 w-2 h-full z-30" style="background: ${brandColor}"></div>
        <div class="p-8 flex items-center justify-between cursor-pointer relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 px-4">
                <div class="w-20 h-20 flex items-center justify-center bg-white rounded-[24px] shadow-sm p-3"><img src="${p.logo}" class="max-h-full object-contain"></div>
                <div><h3 class="font-black text-3xl text-slate-900 mb-2">${p.name}</h3><div class="flex items-center gap-3"><span class="px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase" style="background: ${brandColor}">${p.company}</span><span class="font-mono text-xs font-bold text-slate-400">#${p.id}</span></div></div>
            </div>
            <div class="flex items-center gap-10 text-right px-4">
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Premium</p><p class="text-2xl font-black text-slate-800">${autoFmt(p.premium, sym)}</p></div>
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Valuation</p><p class="text-2xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p></div>
                <div class="bg-white/60 px-6 py-3 rounded-[20px] border border-white/50"><p class="text-[9px] font-black text-sky-500 uppercase mb-1 text-center">Next Due</p><p class="text-lg font-black text-slate-700">${nextDueDisplay}</p></div>
            </div>
        </div>
        <div class="content-area px-10 pb-10 pt-2" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-4 gap-6 mb-8">
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Sum Assured</p><p class="text-2xl font-black text-slate-800">${autoFmt(displaySumAssured, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Invested</p><p class="text-2xl font-black text-slate-800">${autoFmt(totalInvestmentBase, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100"><p class="text-[10px] font-black text-emerald-600 mb-2 uppercase text-center">Surrender</p><p class="text-3xl font-black text-emerald-700 text-center">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100"><p class="text-[10px] font-black text-red-400 mb-2 uppercase text-center">Locked</p><p class="text-3xl font-black text-red-600 text-center">-${autoFmt(lockedValue, sym)}</p></div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p>
                    <p class="text-sm font-bold text-slate-700 underline decoration-sky-300 decoration-2 underline-offset-4">${p.commenced}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Maturity</p>
                    <p class="text-sm font-bold text-slate-700 underline decoration-amber-300 decoration-2 underline-offset-4">${p.maturity}</p>
                </div>
            </div>

            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 border border-slate-200/50">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
