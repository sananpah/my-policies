import { checkIsDueSoon, getTimeLeft, autoFmt, toNum, raw } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const startParts = p.commenced.split(' ');
    const startY = parseInt(startParts[2]);
    const matY = parseInt(p.maturity.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    const isPaidUp = p.dueDate === "PAID UP";
    const timeLeft = getTimeLeft(p.premiumEnds);
    
    const isULIP = p.isULIP === true;
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const prem = Math.round(toNum(p.premium));

    // --- TIMELINE LOGIC PRESERVED ---
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp;
            // Fortune Maximiser Logic
            if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                color = "bg-pink-600"; phase = "Premium + Bonus";
                detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
            } else {
                color = (isCurrent && !isPaidUp) ? "bg-blue-600 animate-pulse" : (isEffectivelyPaid ? "bg-emerald-800" : "bg-slate-300");
                phase = isEffectivelyPaid ? "Premium Paid" : "Premium Due";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else if (p.name.includes("Nishchit Pension") && polY === 7) {
            color = isPast ? "bg-amber-900" : "bg-amber-100 border border-amber-300";
            phase = "Deferment Year"; detail = "Locked";
        } else {
            const payout = (p.payoutSchedule && p.payoutSchedule[polY]) || p.annualPayout;
            if (payout) {
                color = isPast ? "bg-indigo-800" : "bg-indigo-400";
                phase = isPast ? "Payout Received" : "Income Phase";
                detail = `Payout: ${autoFmt(payout, sym)}`;
            } else {
                color = isPast ? "bg-slate-700" : "bg-slate-100 border border-slate-200";
                phase = isPast ? "Historical" : "Growth Phase";
                detail = "Accumulating";
            }
        }
        timelineHtml += `<div class="segment ${color} relative group h-10 flex-1 border-r border-white/5">
            <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap shadow-2xl">
                YR ${polY} (${yr}): ${phase}
            </div>
        </div>`;
    }

    // Maturity Star
    timelineHtml += `<div class="mat-star relative group w-10 flex items-center justify-center text-orange-500">★
        <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full right-0 bg-slate-900 text-white p-2 rounded text-[10px] z-50 whitespace-nowrap">
            <b>MATURITY:</b> ${raw(p.maturityAmt || p.sumAssured)}
        </div>
    </div>`;

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center w-1/3">
                <img src="${p.logo}" class="h-10 w-16 object-contain mr-6">
                <div>
                    <h3 class="font-black text-xl text-slate-800 tracking-tighter">${p.name} ${p.isWife ? '👩‍💼' : ''}</h3>
                    <div class="text-[9px] font-black uppercase text-slate-400 mt-1">${p.type}</div>
                </div>
            </div>
            <div class="flex flex-1 justify-around border-x border-slate-100 px-6">
                <div class="text-center">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                    <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                </div>
                <div class="text-center">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(prem, sym)}</p>
                </div>
            </div>
            <div class="w-1/4 text-right">
                <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Next Due Date</p>
                <div class="inline-block px-4 py-2 rounded-xl font-black text-xs ${isPaidUp ? 'bg-emerald-50 text-emerald-600' : (checkIsDueSoon(p.dueDate) ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white')}">
                    ${p.dueDate}
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-4 rounded-2xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Policy Number</p>
                    <p class="text-sm font-black">${p.id || 'N/A'}</p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">UIN Number</p>
                    <p class="text-sm font-black">${p.uin || 'N/A'}</p>
                </div>
                <div class="${isULIP ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-500'} p-4 rounded-2xl">
                    <p class="text-[9px] font-bold ${isULIP ? 'text-indigo-300' : 'text-slate-400'} uppercase mb-1">Portfolio Value</p>
                    <p class="text-sm font-black">${isULIP ? autoFmt(unitValue, sym) : 'N/A'}</p>
                </div>
            </div>
            <div class="relative mt-12">
                <div class="timeline-track flex h-10 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner">
                    ${timelineHtml}
                </div>
            </div>
        </div>
    </div>`;
}
