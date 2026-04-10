/* component_in.js - v1.3.1 - Full Restore of Layout & Logic */
import { autoFmt, toNum, getTimeRemaining } from './utils.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // --- 1. CORE DATE CALCULATIONS ---
    const commDate = new Date(p.commenced);
    const matDate = new Date(p.maturity);
    const startY = commDate.getFullYear();
    const endY = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    const ppt = (p.ppt !== undefined) ? p.ppt : 0;
    const isPaidUp = (p.dueDate === "PAID UP");

    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    let yearsPassed = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    // --- 2. VALUATION & LOCKED LOGIC ---
    const accountValue = Math.round(toNum(p.unitValueNumeric || 0));
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    const netInvested = totalPremiumsPaid; // Can subtract withdrawals here if applicable

    // Surrender Logic (Assuming surrenderCharges array exists on p)
    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));
    const lockedAmount = accountValue - surrenderValue;

    // --- 3. STATUS BADGE & DUE LOGIC ---
    const nextDueDate = new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay);
    const nextDueDisplay = isPaidUp ? "PAID UP" : nextDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isDueSoon = !isPaidUp && Math.ceil((nextDueDate - TODAY) / (1000 * 60 * 60 * 24)) <= 30;

    const premiumEndDate = new Date(startY + ppt, commMonth, commDay);
    const isPremiumOver = TODAY >= premiumEndDate;
    const timeLeft = isPremiumOver ? "VESTED" : `LEFT: ${getTimeRemaining(premiumEndDate, TODAY)}`;

    // --- 4. FUNKY SA & NOMINEE LOGIC ---
    const saValue = toNum(p.sumAssured);
    const saDisplay = (saValue === 0 || p.nomineeStatus === "NA") 
        ? `<div class="flex items-center gap-1.5 opacity-50"><span class="text-xl">💸</span><span class="text-[9px] font-black text-slate-400 uppercase leading-none">Wealth</span></div>` 
        : `<span class="text-[17px] font-bold text-slate-800 tracking-widest" style="font-family: 'Orbitron';">${autoFmt(saValue, sym)}</span>`;

    let nomineeHtml = "";
    if (p.nomineeStatus === "NA") nomineeHtml = `<span class="text-xl">🛡️</span>`;
    else if (p.nomineeStatus === "EMPTY") nomineeHtml = `<div class="flex items-center gap-1 animate-pulse"><span class="text-xl">⚠️</span><span class="text-[9px] font-black text-rose-500 uppercase">Missing</span></div>`;
    else {
        nomineeHtml = `<div class="flex -space-x-2.5">${(p.nominees || []).map(n => `<img src="${n.img}" class="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-125 hover:z-20" title="${n.name}">`).join('')}</div>`;
    }

    // --- 5. TIMELINE BUILDER (The Green Bars) ---
    const yearsToMat = endY - startY;
    let maxYears = (yearsToMat <= 25) ? yearsToMat : Math.min(Math.max(15, policyYearIdx + 5), yearsToMat);
    let timelineHtml = '';
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        const colorClass = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear) ? "bg-emerald-900" : (yr === CURRENT_YEAR ? "bg-black ring-2 ring-white z-20 scale-110 shadow-xl" : (polY <= ppt ? "bg-indigo-500" : "bg-red-600"));
        timelineHtml += `<div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg relative group/segment"></div>`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    return `
    <div class="policy-card mb-6 overflow-hidden bg-white shadow-sm border-2 transition-all rounded-[20px]" id="card-${p.id}" style="border-color: ${brandColor}; border-left-width: 16px;">
        <div class="card-header p-4 flex items-center justify-between cursor-pointer relative transition-colors" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-6 min-w-[340px]">
                <div class="w-16 h-12 flex-shrink-0 flex items-center justify-center bg-white p-1 rounded-md border border-slate-100 shadow-sm"><img src="${p.logo}" class="max-h-full object-contain"></div>
                <div class="flex items-center gap-3">
                    <div>
                        <h3 class="font-black text-xl text-slate-800 tracking-tighter leading-none mb-1">${p.name}</h3>
                        <img src="${p.avatarPath || 'avatar_self.png'}" class="w-6 h-6 rounded-full border border-white shadow-sm object-cover">
                    </div>
                </div>
            </div>
            
            <div class="flex-1 flex justify-center">
                <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: #fff; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; padding: 2px 10px; border-radius: 6px; border: 1.5px solid; text-transform: uppercase;">
                    ${p.type || 'POLICY'}
                </div>
            </div>
            
            <div class="flex items-center gap-12 px-6">
                <div class="text-center min-w-[140px]">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Annual Premium</p>
                    <p class="text-lg font-black text-[#059669] leading-none">${autoFmt(annualPremium, sym)}</p>
                </div>
            </div>

            <div class="w-40 flex flex-col justify-center">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm text-center">
                    <p class="text-[10px] font-black ${isPremiumOver ? 'text-emerald-500' : 'text-indigo-500'} uppercase leading-none mb-1 text-center">${timeLeft}</p>
                    <div class="h-[1px] bg-slate-200/50 w-full mb-1"></div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1 text-center tracking-widest">Next Due</p>
                    <p class="text-[11px] font-black text-center ${isDueSoon ? 'text-red-500 animate-pulse' : 'text-slate-900'} leading-none">${nextDueDisplay}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-8 pt-6 relative" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sum Assured</p>
                    <div class="h-6 flex items-center">${saDisplay}</div>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nominee(s)</p>
                    <div class="flex items-center h-8">${nomineeHtml}</div>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Valuation</p>
                    <p class="text-[19px] font-black text-slate-900" style="font-family: 'Orbitron';">${autoFmt(accountValue, sym)}</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Invested (Net)</p>
                    <p class="text-[17px] font-black text-slate-800" style="font-family: 'Orbitron';">${autoFmt(netInvested, sym)}</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center shadow-sm">
                    <p class="text-[9px] font-bold text-emerald-600 uppercase mb-1.5">Surrender</p>
                    <p class="text-[20px] font-black text-emerald-700" style="font-family: 'Orbitron';">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="p-4 rounded-xl bg-red-50/50 border border-red-100 text-center shadow-sm flex flex-col justify-center items-center">
                    <p class="text-[9px] font-bold text-red-400 uppercase mb-1.5">Locked</p>
                    <p class="text-[20px] font-black text-red-600" style="font-family: 'Orbitron';">${lockedAmount <= 0 ? 'FULLY VESTED' : '-' + autoFmt(lockedAmount, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.commenced}</p>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.maturity}</p>
            </div>
            <div class="relative flex items-center h-16 bg-slate-100 rounded-xl px-2 border border-slate-200/50 shadow-inner">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
            </div>
        </div>
    </div>`;
}
