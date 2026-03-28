/* component_sg.js - v6.5.0 - Responsive & Mobile Optimized */
import { autoFmt, toNum } from './india.js';

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
    
    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    let surrenderChargeAmount = (isSinglife || isFlexiBrand) ? totalPremiumsPaid * (chargePct / 100) : accountValue * (chargePct / 100);
    const surrenderValue = Math.round(Math.max(0, accountValue - surrenderChargeAmount));
    const lockedValue = Math.round(accountValue - surrenderValue);

    // Timeline Logic
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
            <div class="segment ${colorClass} h-6 md:h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment">
                <div class="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl">
                    <b class="text-sky-400 block mb-1">Year ${polY} (${yr})</b>
                    <span>${statusLabel}</span>
                </div>
            </div>`;
    }

    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueDisplay = new Date(nextDueYear, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    return `
    <div class="policy-card mb-8 rounded-[30px] md:rounded-[40px] bg-white overflow-hidden shadow-lg border-2 relative" 
         id="card-${p.id}" 
         style="border-left: ${isMobile ? '10px' : '16px'} solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between cursor-pointer relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-4 md:gap-8 mb-4 md:mb-0">
                <div class="w-14 h-14 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl shadow-sm p-2">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div>
                    <h3 class="font-black text-xl md:text-3xl text-slate-900 tracking-tight">${p.name}</h3>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase" style="background: ${brandColor}">${p.company}</span>
                        <span class="font-mono text-[10px] font-bold text-slate-400">#${p.id}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between md:justify-end gap-4 md:gap-10 border-t md:border-0 pt-4 md:pt-0">
                <div class="text-left md:text-right">
                    <p class="text-[9px] font-black text-slate-300 uppercase">Valuation</p>
                    <p class="text-lg md:text-2xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
                </div>
                
                <div class="bg-white/70 px-4 py-2 rounded-2xl border border-white/50 flex flex-col justify-center min-w-[110px]">
                    ${isPaidUp ? `
                        <p class="text-[9px] font-black text-emerald-500 uppercase text-center">PAID UP</p>
                    ` : `
                        <p class="text-[8px] font-black text-indigo-500 uppercase text-center">Due: ${nextDueDisplay}</p>
                        <p class="text-[10px] font-black text-slate-700 text-center tracking-tight">Left: ${premRemainingStr}</p>
                    `}
                </div>
            </div>
        </div>

        <div class="content-area px-5 md:px-10 pb-8 md:pb-10 pt-2" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                <div class="p-4 rounded-2xl md:rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 mb-1 uppercase">Sum Assured</p>
                    <p class="text-sm md:text-xl font-black text-slate-800">${autoFmt(displaySumAssured, sym)}</p>
                </div>
                <div class="p-4 rounded-2xl md:rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 mb-1 uppercase">Net Invested</p>
                    <p class="text-sm md:text-xl font-black text-slate-800">${autoFmt(netInvestmentBase, sym)}</p>
                </div>
                <div class="p-4 rounded-2xl md:rounded-[32px] bg-emerald-50 border border-emerald-100">
                    <p class="text-[9px] font-black text-emerald-600 mb-1 uppercase">Surrender</p>
                    <p class="text-lg md:text-2xl font-black text-emerald-700">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="p-4 rounded-2xl md:rounded-[32px] bg-red-50 border border-red-100">
                    <p class="text-[9px] font-black text-red-400 mb-1 uppercase">Locked</p>
                    <p class="text-lg md:text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-3 px-1">
                <p class="text-[9px] font-black text-slate-400 uppercase">${startY} Start</p>
                <p class="text-[9px] font-black text-slate-400 uppercase">${endY} Maturity</p>
            </div>
            
            <div class="overflow-x-auto pb-2">
                <div class="flex items-center min-w-[500px] h-12 bg-slate-100 rounded-2xl px-2 border border-slate-200/50">
                    <div class="flex-1 flex h-8 items-center gap-1">${timelineHtml}</div>
                    <div class="ml-2 text-amber-500 font-bold text-lg">★</div>
                </div>
            </div>
        </div>
    </div>`;
}
