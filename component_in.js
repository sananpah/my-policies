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

    // --- FULL COLOR LOGIC RESTORED ---
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

    // Maturity Star with tooltip safety
    timelineHtml += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span class="${String(p.maturityAmt || p.sumAssured).length > 15 ? 'text-[10px]' : 'text-lg'} font-black">${raw(p.maturityAmt || p.sumAssured)}</span></div></div>`;

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center w-1/3">
                <div class="w-16 flex justify-center mr-6"><img src="${p.logo}" class="max-h-10"></div>
                <div>
                    <h3 class="font-black text-xl text-slate-800 tracking-tighter flex items-center">
                        ${p.name}
                        ${p.isWife ? `<span class="ml-2 text-pink-500">👩‍💼</span>` : ''}
                    </h3>
                    <div class="funky-badge inline-block mt-1" style="border-color: ${p.color}; color: ${p.color}">${p.type}</div>
                </div>
            </div>

            <div class="flex flex-1 justify-around border-x border-slate-100 px-6">
                <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                    <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(prem, sym)}</p>
                    ${timeLeft && !isPaidUp ? `<p class="text-[10px] font-bold text-slate-400 tracking-tighter mt-[-2px]">${timeLeft}</p>` : ''}
                </div>
            </div>

            <div class="w-44 text-center">
                <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Next Due Date</p>
                ${isPaidUp ? `<img src="paid.jpg" class="paid-logo mx-auto">` : 
                `<div class="px-6 py-3 rounded-xl font-black text-xs ${checkIsDueSoon(p.dueDate) ? 'due-blink' : 'bg-slate-900 text-white'}">${p.dueDate}</div>`}
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-8 text-center">
                <div class="bg-white p-4 rounded-xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Policy Number</p>
                    <p class="text-xs font-black text-slate-700">${p.id || 'N/A'}</p>
                </div>
                <div class="bg-white p-4 rounded-xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">UIN Number</p>
                    <p class="text-xs font-black text-slate-700">${p.uin || 'N/A'}</p>
                </div>
                <div class="${isULIP ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-500'} p-4 rounded-xl shadow-md transition-all">
                    <p class="text-[9px] font-bold ${isULIP ? 'text-indigo-300' : 'text-slate-500'} uppercase mb-1">Portfolio Value</p>
                    <p class="text-sm font-black">${isULIP ? autoFmt(unitValue, sym) : 'N/A'}</p>
                </div>
            </div>

            <div class="timeline-track relative">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                <div class="flex h-10 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner">
                    ${timelineHtml}
                </div>
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
