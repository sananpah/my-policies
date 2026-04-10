/* component_sg.js - v6.8.6 - Height Sync & Value Rounding */
import { autoFmt, toNum, getTimeRemaining } from './utils.js';

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

    // --- 1. CORE CALCULATIONS (ROUNDED VALUATION) ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const netInvested = totalPremiumsPaid - totalWithdrawn;

    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));

    const targetExitYear = Math.min(endY, startY + ppt + 2); 
    const projectionYears = Math.max(0, targetExitYear - CURRENT_YEAR);
    const yearsToPay = isPaidUp ? 0 : Math.max(0, Math.min(startY + ppt, targetExitYear) - (hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR));

    const calcProj = (rate) => {
        return Math.round((accountValue * Math.pow(1 + rate, projectionYears)) + (yearsToPay > 0 ? (annualPremium * ((Math.pow(1 + rate, yearsToPay) - 1) / rate) * (1 + rate)) * Math.pow(1 + rate, Math.max(0, projectionYears - yearsToPay)) : 0));
    };

    const proj4 = calcProj(0.04);
    const proj8 = calcProj(0.08);

    const nextDueDate = new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay);
    const nextDueDisplay = nextDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isDueSoon = Math.ceil((nextDueDate - TODAY) / (1000 * 60 * 60 * 24)) <= 30;

    const mipEndDate = new Date(startY + mip, commMonth, commDay);
    const isVested = mip === 0 || TODAY >= mipEndDate;
    const timeLeft = isVested ? "VESTED" : `LEFT: ${getTimeRemaining(mipEndDate, TODAY)}`;

    const yearsToMat = endY - startY;
    let maxYears = (yearsToMat <= 25) ? yearsToMat : Math.min(Math.max(15, policyYearIdx + 5), yearsToMat);
    let timelineHtml = '';
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        let colorClass = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear) ? "bg-emerald-900" : (yr === CURRENT_YEAR ? "bg-black ring-2 ring-white z-20 scale-110 shadow-xl" : (polY <= mip ? "bg-indigo-500" : (polY <= ppt ? "bg-pink-400" : "bg-red-600")));
        let statusLabel = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear) ? "Completed" : (yr === CURRENT_YEAR ? "Premium Due" : (polY <= mip ? "Strict Lock" : (polY <= ppt ? "Flexi Phase" : "Vested")));
        timelineHtml += `<div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment"><div class="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200"><b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b><span class="text-white font-bold tracking-tight">${statusLabel}</span><div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div></div></div>`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    const starHtml = `
    <div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help">
        <span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span>
        <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-4 rounded-2xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px]">
            <b class="text-orange-400 uppercase tracking-widest text-[9px] block mb-2 font-black">Projected Maturity*</b>
            <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-black leading-tight text-white">
                    <span>Est. @4%:</span>
                    <span>${autoFmt(proj4, sym)}</span>
                </div>
                <div class="flex justify-between text-[10px] font-black leading-tight text-white">
                    <span>Est. @8%:</span>
                    <span>${autoFmt(proj8, sym)}</span>
                </div>
            </div>
            <div class="mt-2 pt-2 border-t border-white/10 text-[8px] text-slate-400 italic font-medium leading-tight">
                *Projected until Year ${targetExitYear}.
            </div>
            <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
        </div>
    </div>`;

    return `
    <div class="policy-card mb-6 rounded-none bg-white overflow-hidden shadow-sm border relative" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="card-header p-4 flex items-center justify-between cursor-pointer relative transition-colors" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-6 min-w-[340px]">
                <div class="w-16 h-12 flex-shrink-0 flex items-center justify-center bg-white p-1"><img src="${p.logo}" class="max-h-full object-contain"></div>
                <div class="flex items-center gap-3">
                    <h3 class="font-black text-xl text-slate-800 tracking-tight leading-none">${p.name}</h3>
                    <img src="${p.avatarPath || 'avatar_self.png'}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover">
                </div>
            </div>
            <div class="flex-1 flex justify-center"><span class="px-3 py-1 rounded-md border border-slate-200 bg-white/50 text-[10px] font-black text-slate-600 tracking-widest uppercase shadow-sm">${p.type || 'INVESTMENTS'}</span></div>
            
            <div class="flex items-center gap-12 px-6">
                <div class="text-center min-w-[140px]">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Annual Premium</p>
                    <p class="text-lg font-black text-[#059669] leading-none">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="pl-10 border-l-2 border-slate-100 text-center min-w-[140px]">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sum Assured</p>
                    <p class="text-lg font-black text-slate-800 leading-none">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p>
                </div>
            </div>

            <div class="w-40 flex flex-col justify-center">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm text-center">
                    <p class="text-[10px] font-black ${isVested ? 'text-emerald-500' : 'text-indigo-500'} uppercase leading-none mb-1">${timeLeft}</p>
                    <div class="h-[1px] bg-slate-200/50 w-full mb-1"></div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                    <p class="text-[11px] font-black ${isDueSoon ? 'text-red-500 animate-pulse' : 'text-slate-900'} leading-none">${nextDueDisplay}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-8 pt-6 relative" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Policy No.</p>
                    <p class="text-lg font-bold text-slate-700">#${p.id}</p>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Valuation</p>
                    <p class="text-xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="p-4 rounded-xl bg-white border border-slate-100">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Invested (Net)</p>
                    <p class="text-xl font-black text-slate-800">${autoFmt(netInvested, sym)}</p>
                    <p class="text-[8px] font-bold text-slate-400 mt-1 italic">* Withdrawals Factored</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <p class="text-[9px] font-bold text-emerald-600 uppercase mb-1">Surrender</p>
                    <p class="text-2xl font-black text-emerald-700">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                    <p class="text-[9px] font-bold text-red-400 uppercase mb-1">Locked</p>
                    <p class="text-2xl font-black text-red-600">-${autoFmt(accountValue - surrenderValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <p class="text-[10px] font-black text-slate-400 uppercase">${p.commenced}</p>
                <p class="text-[10px] font-black text-slate-400 uppercase">${p.maturity}</p>
            </div>
            <div class="relative flex items-center h-16 bg-slate-100 rounded-xl px-2 border border-slate-200/50 shadow-inner">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
