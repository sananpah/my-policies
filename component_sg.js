/* component_sg.js - Baseline v3.6.0 (Precise Progress Logic) */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced); // Dec 30, 2021
    const startY = commDate.getFullYear();
    
    // --- CALCULATION LOGIC (Stays at 60% per AIA Document) ---
    // Years passed (2026 - 2021 = 5). Anniversary not reached, so use 5th Year Rate.
    let chargeYear = TODAY.getFullYear() - startY;
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    if (TODAY >= anniversaryThisYear) chargeYear++;
    
    // --- DISPLAY LOGIC (Timeline shows Year 6) ---
    const displayYear = (TODAY.getFullYear() - startY) + 1; 

    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const hasVestingLogic = p.surrenderCharges && Object.keys(p.surrenderCharges).length > 0;
    
    let surrenderValue = accountValue;
    let lockedValue = 0;

    if (hasVestingLogic) {
        const currentSCharge = p.surrenderCharges[chargeYear] || 0;
        surrenderValue = Math.round(accountValue * (1 - (currentSCharge / 100)));
        lockedValue = accountValue - surrenderValue;
    }

    // --- TIMELINE WITH "IN-PROGRESS" STYLE ---
    let timelineHtml = '';
    if (hasVestingLogic) {
        for(let yr = startY; yr < (startY + 15); yr++) {
            const polY = yr - startY + 1;
            const chargeAtYear = p.surrenderCharges[polY] || 0;
            const isCurrent = (polY === displayYear);
            const isPast = (polY < displayYear);
            
            let color = "";
            if (isCurrent) {
                // Special "Not Over Yet" styling: Pulsing blue with a soft border
                color = "bg-blue-600 ring-4 ring-blue-400/30 z-10 scale-105 shadow-[0_0_15px_rgba(37,99,235,0.4)]";
            } else if (isPast) {
                color = "bg-emerald-800";
            } else {
                color = chargeAtYear > 0 ? "bg-red-500/10 border border-red-200" : "bg-emerald-500/20 border border-emerald-200";
            }

            timelineHtml += `
                <div class="segment ${color} relative group h-12 flex-1 border-r border-white/10 transition-all overflow-hidden">
                    ${isCurrent ? '<div class="absolute inset-0 bg-white/10 animate-pulse"></div>' : ''}
                    <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none shadow-2xl">
                        <b class="text-sky-400 uppercase">YR ${polY} (${yr})</b><br>
                        ${isCurrent ? 'Current Year (In Progress)' : (chargeAtYear > 0 ? 'Locked' : 'Vested')}
                    </div>
                </div>`;
        }
    }

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8">
                <div class="w-16 h-16 flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <img src="${p.logo}" class="max-h-10 object-contain">
                </div>
                <div>
                    <h3 class="font-black text-2xl text-slate-800 tracking-tighter">${p.name}</h3>
                    <p class="text-[10px] text-red-600 font-bold uppercase tracking-widest">${p.company}</p>
                </div>
            </div>
            <div class="flex gap-12 items-center">
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Current Market Value</p>
                    <p class="text-3xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
                </div>
                <div class="w-48 py-3 bg-slate-900 text-white rounded-2xl text-center shadow-lg">
                    <p class="text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Next Due Date</p>
                    <p class="text-xs font-black ${checkIsDueSoon(p.dueDate) ? 'text-red-400 animate-pulse' : ''}">${p.dueDate}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="bg-slate-900 p-5 rounded-[24px] border-b-4 border-lime-500 shadow-lg flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Policy Number</p>
                    <p class="text-sm font-black text-lime-400 tracking-widest font-mono">${p.id}</p>
                </div>

                <div class="bg-emerald-600 p-5 rounded-[24px] shadow-lg flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-emerald-100 uppercase mb-1">Surrender Value (Liquid)</p>
                    <p class="text-2xl font-black text-white">${autoFmt(surrenderValue, sym)}</p>
                </div>

                <div class="bg-white p-5 rounded-[24px] border border-red-100 shadow-sm flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-red-400 uppercase mb-1">Locked Value</p>
                    <p class="text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <p class="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Vesting Timeline (Policy Year ${displayYear})</p>
            <div class="timeline-track flex h-12 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner mb-4">
                ${timelineHtml}
            </div>
            <p class="text-[9px] text-slate-400 italic">Penalty rates are based on the last completed policy anniversary (${p.commenced}).</p>
        </div>
    </div>`;
}
