/* component_sg.js - Baseline v3.7.0 (Exact India Layout Clone) */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced); // 30 Dec 2021
    const startY = commDate.getFullYear();
    
    // --- CALCULATION (Locked at 60% Penalty for Year 5) ---
    let chargeYear = TODAY.getFullYear() - startY;
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    if (TODAY >= anniversaryThisYear) chargeYear++;
    
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const currentSCharge = p.surrenderCharges[chargeYear] || 0; 
    const surrenderValue = Math.round(accountValue * (1 - (currentSCharge / 100)));
    const lockedValue = accountValue - surrenderValue;

    // Timeline Position (Year 6)
    const displayYear = (TODAY.getFullYear() - startY) + 1; 

    // --- TIMELINE GENERATION ---
    let timelineHtml = '';
    const totalSegments = 15;

    for(let polY = 1; polY <= totalSegments; polY++) {
        const yr = startY + polY - 1;
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        const isCurrent = (polY === displayYear);
        const isPast = (polY < displayYear);
        
        let color = isCurrent ? "bg-blue-500 ring-2 ring-blue-300 z-10" : 
                    (isPast ? "bg-emerald-900" : 
                    (chargeAtYear > 0 ? "bg-red-600" : "bg-emerald-500/20 border border-emerald-300"));

        timelineHtml += `
            <div class="segment ${color} relative group h-8 flex-1 border-r border-white/5 transition-all first:rounded-l-lg">
                <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none">
                    YR ${polY} (${yr})
                </div>
            </div>`;
    }

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between">
            <div class="flex items-center gap-6">
                <img src="${p.logo}" class="h-12 object-contain">
                <div>
                    <h3 class="font-black text-2xl text-slate-800 tracking-tighter">${p.name}</h3>
                    <p class="text-[10px] text-red-600 font-bold uppercase tracking-widest">AIA Singapore</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase">Current Market Value</p>
                <p class="text-3xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
            </div>
        </div>

        <div class="px-8 pb-10 pt-4 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-10">
                <div class="bg-slate-900 p-5 rounded-[24px] text-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase mb-1">Policy Number</p>
                    <p class="text-sm font-black text-lime-400 font-mono">${p.id}</p>
                </div>
                <div class="bg-emerald-600 p-5 rounded-[24px] shadow-lg text-center">
                    <p class="text-[9px] font-bold text-emerald-100 uppercase mb-1">Surrender Value (Liquid)</p>
                    <p class="text-2xl font-black text-white">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="bg-white p-5 rounded-[24px] border border-red-100 text-center">
                    <p class="text-[9px] font-bold text-red-400 uppercase mb-1">Locked Value</p>
                    <p class="text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-1 px-1 text-[10px] font-bold text-slate-400 uppercase">
                <span>${p.commenced}</span>
                <div class="text-center leading-tight transform -skew-x-12">
                    <span class="text-slate-500 block">⭐ MATURITY</span>
                    <span class="text-[8px]">Unit Value</span>
                </div>
                <span>${p.maturity}</span>
            </div>

            <div class="relative h-10 bg-slate-200 rounded-full p-1 flex items-center">
                <div class="flex-1 flex h-8 items-center overflow-hidden">
                    ${timelineHtml}
                    <div class="flex-[0.5] h-8 bg-transparent"></div>
                </div>
                <div class="group relative px-2 cursor-help">
                    <span class="text-amber-500 text-sm transition-transform group-hover:scale-125 block">★</span>
                    <div class="opacity-0 group-hover:opacity-100 absolute bottom-full right-0 mb-3 bg-slate-900 text-white p-2 rounded text-[9px] whitespace-nowrap z-50 shadow-2xl">
                        Maturity: Value based on Unit Value
                    </div>
                </div>
            </div>

            <div class="flex gap-4 text-[9px] font-bold text-slate-400 uppercase mt-4 px-1">
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-900 rounded-sm"></span> Paid</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-600 rounded-sm"></span> Locked</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-500 rounded-sm"></span> Bonus</span>
            </div>
        </div>
    </div>`;
}
