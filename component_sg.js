/* component_sg.js - v6.8.2 - Sync Status Badge Logic with India (MIP based) */
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

    // --- 1. CORE CALCULATIONS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const netInvested = totalPremiumsPaid - totalWithdrawn;

    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));

    // --- 3. DUAL PROJECTION (4% & 8% with PPT+2 Rule) ---
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

    // --- UPDATED STATUS LOGIC: MATCHING INDIA STYLE ---
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
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-2 relative" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="p-8 flex items-center justify-between cursor-pointer relative min-h-[100px]" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-6 pl-4 min-w-[340px]">
                <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white rounded-[22px] shadow-sm p-3 border border-slate-50"><img src="${p.logo}" class="max-h-full object-contain"></div>
                <div class="flex items-center gap-3">
                    <h3 class="font-black text-[26px] text-slate-800 tracking-tighter leading-none">${p.name}</h3>
                    <div class="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex-shrink-0"><img src="${p.avatarPath || 'avatar_self.png'}" class="w-full h-full object-cover"></div>
                </div>
            </div>
            <div class="flex-1 flex justify-center"><div class="relative group"><div class="absolute -inset-1 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full blur opacity-25"></div><span class="relative px-5 py-1.5 rounded-full border border-rose-200 bg-white/90 backdrop-blur-sm text-[11px] font-black text-rose-600 italic tracking-widest uppercase shadow-sm">${p.type || 'INVESTMENTS'}</span></div></div>
            <div class="flex items-center gap-14 px-6">
                <div class="text-center">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-[0.15em]">Sum Assured</p>
                    <p class="text-[22px] font-black text-slate-800 tracking-tighter leading-none">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p>
                </div>
                <div class="pl-12 border-l border-slate-100 text-center">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-[0.15em]">Annual Premium</p>
                    <p class="text-[22px] font-black text-[#059669] tracking-tighter leading-none">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>
            <div class="w-48 flex flex-col justify-center ml-4">
                <div class="bg-white/80 px-5 py-3 rounded-[24px] border border-white shadow-sm flex flex-col justify-center min-h-[68px]">
                    <p class="text-[10px] font-black ${isVested ? 'text-emerald-500' : 'text-indigo-500'} uppercase text-center leading-none mb-1.5">${timeLeft}</p>
                    <div class="h-[1px] bg-slate-200/50 w-full mb-1.5"></div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1 text-center tracking-widest">Next Due</p>
                    <p class="text-[14px] font-black text-center tracking-tight leading-none ${isDueSoon ? 'text-red-600 animate-pulse' : 'text-slate-800'}">${nextDueDisplay}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-10 pb-10 pt-6 relative z-20" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="p-6 rounded-[32px] bg-slate-50 border border-slate-100 relative shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Policy No.</p>
                    <p class="text-lg font-mono font-bold text-slate-700 tracking-widest">#${p.id}</p>
                </div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 relative shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Current Valuation</p>
                    <p class="text-[24px] font-black text-slate-900 tracking-tighter leading-none">${p.currentUnitValue}</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Invested (Net)</p>
                    <p class="text-[24px] font-black text-slate-800 tracking-tighter leading-none">${autoFmt(netInvested, sym)}</p>
                    <p class="text-[8px] font-bold text-slate-400 mt-2 italic">* Withdrawals Factored</p>
                </div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm text-center">
                    <p class="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">Surrender</p>
                    <p class="text-[28px] font-black text-emerald-700 tracking-tighter leading-none">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm text-center">
                    <p class="text-[10px] font-black text-red-400 mb-2 uppercase tracking-widest">Locked</p>
                    <p class="text-[28px] font-black text-red-600 tracking-tighter leading-none">-${autoFmt(accountValue - surrenderValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.commenced}</p></div>
                <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.maturity}</p></div>
            </div>
            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 border border-slate-200/50 shadow-inner">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
