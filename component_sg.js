/* component_sg.js - v6.5.3 - Full Card Blink for Due Soon */
import { autoFmt, toNum, checkIsDueSoon } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR, isMobile = false) {
    const commDate = new Date(p.commenced);
    const matDate = new Date(p.maturity);
    
    const startY = commDate.getFullYear();
    const endY = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    // 1. PREMIUM REMAINING CALCULATION
    let premRemainingStr = "";
    const isPaidUp = p.dueDate === "PAID UP";
    const mip = (p.mip !== undefined) ? p.mip : -1;

    if (isPaidUp) {
        premRemainingStr = "PAID UP";
    } else if (mip === 0) {
        premRemainingStr = "Vested";
    } else {
        let targetDate = (mip === -1) ? matDate : new Date(startY + mip, commMonth, commDay);
        if (targetDate <= TODAY) {
            premRemainingStr = "Vested";
        } else {
            let years = targetDate.getFullYear() - TODAY.getFullYear();
            let months = targetDate.getMonth() - TODAY.getMonth();
            if (months < 0) { years--; months += 12; }
            const yStr = String(Math.max(0, years)).padStart(2, '0');
            const mStr = String(Math.max(0, months)).padStart(2, '0');
            premRemainingStr = `${yStr}y${mStr}m`;
        }
    }

    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const displaySumAssured = (toNum(p.sumAssured) === 0) ? accountValue : toNum(p.sumAssured);

    const company = p.company.toUpperCase();
    const isSinglife = company.includes("SINGLIFE");
    const isFlexiBrand = company.includes("MANULIFE") || company.includes("HSBC");

    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;

    let yearsPassedForCharges = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassedForCharges--;
    const policyYearIdx = Math.max(1, yearsPassedForCharges + 1);

    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    const netInvestmentBase = totalPremiumsPaid - totalWithdrawn;

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    // --- DUE SOON LOGIC ---
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueDisplay = new Date(nextDueYear, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const isDueSoon = !isPaidUp && (premRemainingStr !== "Vested") && checkIsDueSoon(nextDueDisplay);
    const blinkClass = isDueSoon ? "animate-card-pulse" : "";

    // --- TIMELINE GENERATION ---
    let timelineHtml = '';
    const maxYears = (endY - startY + 1 > 0 && endY - startY + 1 < 50) ? (endY - startY + 1) : 15;
  
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
            const lockLimit = isSinglife ? 3 : 5;
            colorClass = (polY <= lockLimit) ? "bg-indigo-500" : (polY <= 10 ? "bg-pink-400" : "bg-red-600");
            statusLabel = (polY <= lockLimit) ? "Locked" : "Vested";
        }

        timelineHtml += `
            <div class="segment ${colorClass} h-8 ${isMobile ? 'flex-1' : 'w-full'} border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment">
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
            <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-3 rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px] transition-all duration-200">
                <b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-1">Maturity</b>
                <span class="text-xs font-black block">Unit Value : ${autoFmt(accountValue, sym)}</span>
                <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
            </div>
        </div>`;

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-2 relative transition-all duration-500 ${blinkClass}" 
         id="card-${p.id}" 
         style="border-left: 16px solid ${brandColor}; border-color: ${isDueSoon ? '#f87171' : brandColor};">
        
        <div class="${isMobile ? 'p-5' : 'p-8'} flex ${isMobile ? 'flex-col' : 'items-center justify-between'} cursor-pointer relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 ${isMobile ? 'mb-4' : 'pl-6 pr-4'}">
                <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded-[24px] shadow-sm p-3 relative z-20">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div class="relative z-20">
                    <h3 class="font-black text-3xl text-slate-900 mb-2 tracking-tight">${p.name}</h3>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase" style="background: ${brandColor}">${p.company}</span>
                        <span class="font-mono text-xs font-bold text-slate-400">#${p.id}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center ${isMobile ? 'justify-between w-full' : 'gap-10 text-right px-4'} relative z-20">
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Premium</p><p class="text-2xl font-black text-slate-800">${autoFmt(p.premium, sym)}</p></div>
                <div><p class="text-[10px] font-black text-slate-300 uppercase mb-1">Valuation</p><p class="text-2xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p></div>
                
                <div class="bg-white/60 px-6 py-3 rounded-[20px] border border-white/50 flex flex-col justify-center min-w-[125px] h-[64px]">
                    ${isPaidUp ? `
                        <p class="text-[10px] font-black text-emerald-500 uppercase text-center">Status</p>
                        <p class="text-sm font-black text-emerald-700 text-center uppercase tracking-tighter">FULLY PAID</p>
                    ` : `
                        <p class="text-[9px] font-black text-indigo-500 uppercase text-center">Left: <span class="text-slate-700">${premRemainingStr}</span></p>
                        <div class="h-[1px] bg-slate-200/40 w-full my-1"></div>
                        <p class="text-[9px] font-black ${isDueSoon ? 'text-red-500' : 'text-sky-500'} uppercase text-center">Next Due</p>
                        <p class="text-sm font-black ${isDueSoon ? 'text-red-700' : 'text-slate-700'} text-center tracking-tight">${nextDueDisplay}</p>
                    `}
                </div>
            </div>
        </div>

        <div class="content-area px-10 pb-10 pt-2 relative z-20" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-6 mb-8">
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Sum Assured</p><p class="text-2xl font-black text-slate-800">${autoFmt(displaySumAssured, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm"><p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Invested</p><p class="text-2xl font-black text-slate-800">${autoFmt(netInvestmentBase, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm"><p class="text-[10px] font-black text-emerald-600 mb-2 uppercase text-center">Surrender</p><p class="text-3xl font-black text-emerald-700 text-center">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm"><p class="text-[10px] font-black text-red-400 mb-2 uppercase text-center">Locked</p><p class="text-3xl font-black text-red-600 text-center">-${autoFmt(lockedValue, sym)}</p></div>
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
