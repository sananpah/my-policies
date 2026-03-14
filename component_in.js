/* component_in.js - Baseline v3.5.85 (Policy/UIN/UnitValue) */
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

    // Timeline Generation
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            color = (isCurrent && !isPaidUp) ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : (isPast || isPaidUp ? "bg-emerald-800" : "bg-slate-300");
            phase = (isPast || isPaidUp) ? "Premium Paid" : "Future Premium";
            detail = `Amt: ${autoFmt(p.premium, sym)}`;
        } else {
            const payout = (p.payoutSchedule && p.payoutSchedule[polY]) || p.annualPayout;
            color = isPast ? "bg-orange-800 opacity-60" : "bg-orange-200";
            phase = payout ? "Income Phase" : "Growth Phase";
            detail = payout ? `Payout: ${autoFmt(payout, sym)}` : "Accumulating";
        }
        timelineHtml += `<div class="segment ${color} relative group h-10 flex-1 border-r border-white/10">
            <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap shadow-xl">
                YR ${polY}: ${phase}<br>${detail}
            </div>
        </div>`;
    }

    // Maturity Star with inward-facing tooltip to prevent edge cutoff
    timelineHtml += `<div class="mat-star relative flex items-center justify-center w-10 text-orange-500 group">★
        <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full right-0 bg-slate-900 text-white p-2 rounded text-[10px] z-50 whitespace-nowrap shadow-xl">
            <b>MATURITY</b><br>${raw(p.maturityAmt || p.sumAssured)}
        </div>
    </div>`;

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center w-1/3">
                <img src="${p.logo}" class="h-10 w-16 object-contain mr-6">
                <div>
                    <h3 class="font-black text-xl text-slate-800 tracking-tighter">${p.name}</h3>
                    <div class="text-[9px] font-black uppercase text-slate-400 mt-1">${p.company} • ${p.type}</div>
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
                <div class="inline-block px-4 py-2 rounded-xl font-black text-xs ${isPaidUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : (checkIsDueSoon(p.dueDate) ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white')}">
                    ${p.dueDate}
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-4 rounded-2xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Policy Number</p>
                    <p class="text-sm font-black text-slate-800">${p.id || 'N/A'}</p>
                </div>
                
                <div class="bg-white p-4 rounded-2xl border border-slate-200">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">UIN Number</p>
                    <p class="text-sm font-black text-slate-800">${p.uin || 'N/A'}</p>
                </div>

                <div class="${isULIP ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-500'} p-4 rounded-2xl shadow-lg transition-all">
                    <p class="text-[9px] font-bold ${isULIP ? 'text-indigo-300' : 'text-slate-500'} uppercase mb-1">Portfolio Value</p>
                    <p class="text-sm font-black">${isULIP ? autoFmt(unitValue, sym) : 'N/A (Traditional)'}</p>
                </div>
            </div>

            <div class="relative mt-12 px-2">
                <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2 px-1">
                    <span>Commenced: ${p.commenced}</span>
                    <span>Maturity: ${p.maturity}</span>
                </div>
                <div class="timeline-track flex h-10 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner">
                    ${timelineHtml}
                </div>
            </div>
        </div>
    </div>`;
}
