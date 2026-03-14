/* component_in.js - Unified Baseline v3.5.85 */
import { checkIsDueSoon, getTimeLeft, autoFmt, toNum, raw } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const startParts = p.commenced.split(' ');
    const startY = parseInt(startParts[2]);
    const anniversaryDay = parseInt(startParts[0]);
    const anniversaryMonth = startParts[1];
    
    const matY = parseInt(p.maturity.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    const isPaidUp = p.dueDate === "PAID UP";
    const timeLeft = getTimeLeft(p.premiumEnds);
    
    const currentAnniversary = new Date(`${anniversaryMonth} ${anniversaryDay}, ${CURRENT_YEAR}`);
    const hasPassedThisYear = TODAY > currentAnniversary;

    const isULIP = p.isULIP === true;
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const prem = Math.round(toNum(p.premium));

    // Build Timeline Logic (Preserved exactly from your original)
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                color = "bg-hybrid"; phase = "Premium + Bonus";
                detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
            } else {
                color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else if (p.name.includes("Nishchit Pension") && polY === 7) {
            color = isPast ? "bg-history-brown" : "bg-future-light-brown";
            phase = "Deferment Year"; detail = "Wealth Locked";
        } else {
            const payout = (p.payoutSchedule && p.payoutSchedule[polY]) || p.annualPayout;
            if (payout) {
                color = isPast ? "bg-payout-past" : "bg-payout-future";
                phase = isPast ? "Payout Received" : "Income Phase";
                detail = `Payout: ${autoFmt(payout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = isPast ? "Growth (Historical)" : "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${polY} (${yr})</span></div></div>`;
    }

    timelineHtml += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span class="${String(p.maturityAmt || p.sumAssured).length > 15 ? 'text-[10px]' : 'text-lg'} font-black">${raw(p.maturityAmt || p.sumAssured)}</span></div></div>`;

    // --- COMBINED UI TEMPLATE ---
    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8 overflow-hidden" id="card-${p.id}" style="border-color: ${p.color}">
        
        <div class="card-header p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="w-24 flex justify-center"><img src="${p.logo}" class="max-h-12 object-contain"></div>
            
            <div class="flex-1 ml-8">
                <h3 class="font-black text-slate-800 text-2xl tracking-tighter flex items-center">
                    ${p.name}
                    ${p.isWife ? `<span class="ml-3 text-pink-500" title="Wife's Policy"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.94 14c-.46-4.17-3.97-7.41-8.19-7.41s-7.73 3.24-8.19 7.41c-.02.21.11.41.32.41H20.62c.21 0 .34-.2.32-.41z"/></svg></span>` : ''}
                    ${p.isDaughter ? `<span class="ml-3 text-indigo-500" title="Daughter's Policy"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg></span>` : ''}
                </h3>
                <div class="flex items-center gap-4 mt-1">
                    <div class="funky-badge text-[8px] px-2 py-0.5 border rounded-full font-bold uppercase" style="border-color: ${p.color}; color: ${p.color}">${p.type}</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SA: ${autoFmt(p.sumAssured, sym)}</div>
                </div>
            </div>

            <div class="flex gap-10 items-center mr-8 text-right">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Premium</p>
                    <p class="text-2xl font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(prem, sym)}</p>
                    ${timeLeft ? `<p class="text-[10px] font-bold text-slate-400 mt-[-2px]">${timeLeft}</p>` : ''}
                </div>
                <div class="w-40 text-center">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Next Due Date</p>
                    ${isPaidUp ? `<span class="text-xs font-black text-emerald-500 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 uppercase">Paid Up</span>` : 
                    `<div class="px-4 py-2 rounded-xl font-black text-xs ${checkIsDueSoon(p.dueDate) ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}">${p.dueDate}</div>`}
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            
            ${(isULIP && unitValue > 0) ? `
                <div class="bg-indigo-900 p-6 rounded-[24px] mb-8 shadow-xl relative overflow-hidden">
                    <p class="text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-widest">Current Portfolio Value</p>
                    <p class="text-4xl font-black text-white">${autoFmt(unitValue, sym)}</p>
                    <div class="absolute right-6 top-6 opacity-10">
                        <svg width="60" height="60" fill="white" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 17.08z"/></svg>
                    </div>
                </div>
            ` : ''}

            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-4 rounded-xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Policy Number</p>
                    <p class="text-xs font-black text-slate-700">${p.id || 'N/A'}</p>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Client ID</p>
                    <p class="text-xs font-black text-slate-700">${p.clientId || 'N/A'}</p>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">UIN</p>
                    <p class="text-xs font-black text-slate-700">${p.uin || 'N/A'}</p>
                </div>
            </div>

            <div class="relative mt-12 pb-4">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                <div class="timeline-track flex h-10 bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                    ${timelineHtml}
                </div>
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
