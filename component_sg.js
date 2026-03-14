/* component_sg.js - Baseline v3.8.4 (Fixed Hover & Label Placement) */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    
    // --- CALCULATION (60% Penalty / Year 5 Logic) ---
    let chargeYear = TODAY.getFullYear() - startY;
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    if (TODAY >= anniversaryThisYear) chargeYear++;
    
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const currentSCharge = p.surrenderCharges[chargeYear] || 0; 
    const surrenderValue = Math.round(accountValue * (1 - (currentSCharge / 100)));
    const lockedValue = accountValue - surrenderValue;
    const displayYear = (TODAY.getFullYear() - startY) + 1; 

    // --- TIMELINE GENERATION ---
    let timelineHtml = '';
    const totalSegments = 15;
    for(let polY = 1; polY <= totalSegments; polY++) {
        const yr = startY + polY - 1;
        const isCurrent = (polY === displayYear);
        const isPast = (polY < displayYear);
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        
        let color = isCurrent ? "bg-blue-500 ring-2 ring-blue-300 z-10" : 
                    (isPast ? "bg-emerald-900" : 
                    (chargeAtYear > 0 ? "bg-red-600" : "bg-emerald-500/20 border border-emerald-300"));

        timelineHtml += `
            <div class="segment ${color} relative group h-8 flex-1 border-r border-white/5 first:rounded-l-lg">
                <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[9px] z-50 whitespace-nowrap shadow-xl">
                    YR ${polY} (${yr})
                </div>
            </div>`;
    }

    // --- STAR LOGIC (Mirrored from India with Tooltip Fix) ---
    const starHtml = `
        <div class="mat-star relative group flex items-center justify-center px-4 h-8 border-l border-slate-300 ml-1">
            <span class="text-amber-500 text-lg">★</span>
            <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full right-0 mb-3 bg-slate-900 text-white p-3 rounded-xl z-50 shadow-2xl border border-white/10 pointer-events-none transition-opacity">
                <b class="text-orange-400 uppercase tracking-widest block mb-1">Maturity</b>
                <span class="text-lg font-black text-white">Unit Value</span>
            </div>
        </div>`;

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8 border-red-600 overflow-hidden" id="card-${p.id}">
        <div class="card-header p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
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

        <div class="content-area px-8 pb-10 pt-4 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-10">
                <div class="bg-slate-900 p-5 rounded-[24px] text-center"><p class="text-[9px] text-slate-500 uppercase">Policy Number</p><p class="text-sm font-black text-lime-400 font-mono">${p.id}</p></div>
                <div class="bg-emerald-600 p-5 rounded-[24px] text-center shadow-lg"><p class="text-[9px] text-emerald-100 uppercase">Surrender Value</p><p class="text-2xl font-black text-white">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="bg-white p-5 rounded-[24px] border border-red-100 text-center"><p class="text-[9px] text-red-400 uppercase">Locked Value</p><p class="text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p></div>
            </div>

            <div class="flex justify-between items-end mb-2 px-1 text-[11px] font-black text-slate-400 uppercase">
                <span>${p.commenced}</span>
                <div class="flex flex-col items-end transform -skew-x-12 leading-none">
                    <span class="text-slate-600 block text-[10px]">⭐ MATURITY</span>
                    <span class="text-[8px] font-bold">Unit Value</span>
                </div>
                <span>${p.maturity}</span>
            </div>

            <div class="timeline-track relative flex items-center h-12 bg-slate-200 rounded-xl px-1 shadow-inner">
                <div class="flex-1 flex h-8 items-center overflow-hidden">
                    ${timelineHtml}
                    <div class="flex-[0.3] h-8"></div>
                </div>
                ${starHtml}
            </div>

            <div class="flex gap-4 text-[9px] font-bold text-slate-400 uppercase mt-4 px-1">
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-900"></span> Paid</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-600"></span> Locked</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-500"></span> Bonus</span>
            </div>
        </div>
    </div>`;
}
