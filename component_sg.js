/* component_sg.js - Final Baseline v3.5.97 */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced); // Dec 30, 2021
    const startY = commDate.getFullYear();
    
    // --- CORRECT POLICY YEAR CALCULATION ---
    // 1. Calculate the difference in calendar years
    let yearsPassed = TODAY.getFullYear() - startY; 
    
    // 2. Determine if the anniversary (Dec 30) has already happened THIS year
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    
    // 3. Current Policy Year logic:
    // If today is March 2026 and anniversary is Dec 2026, we are in Policy Year 5.
    // (2026 - 2021 = 5). Since today < Dec 30, we remain in Year 5.
    let polYearToday = yearsPassed;
    if (TODAY >= anniversaryThisYear) {
        polYearToday = yearsPassed + 1; 
    } else {
        polYearToday = yearsPassed + 1; // Since 2021 is Yr 1, 2026 is Yr 5 before Dec 30
    }
    // ---------------------------------------

    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const hasVestingLogic = p.surrenderCharges && Object.keys(p.surrenderCharges).length > 0;
    
    let surrenderValue = accountValue;
    let lockedValue = 0;
    let currentSCharge = 0;

    if (hasVestingLogic) {
        currentSCharge = p.surrenderCharges[polYearToday] || 0;
        // Apply the 60% penalty for Year 5
        surrenderValue = Math.round(accountValue * (1 - (currentSCharge / 100)));
        lockedValue = accountValue - surrenderValue;
    }

    let timelineHtml = '';
    if (hasVestingLogic) {
        for(let yr = startY; yr < (startY + 15); yr++) {
            const polY = yr - startY + 1;
            const chargeAtYear = p.surrenderCharges[polY] || 0;
            const isCurrent = (polY === polYearToday);
            const isPast = (polY < polYearToday);

            let color = isCurrent ? "bg-blue-600 ring-2 ring-blue-400 z-10 scale-110" : 
                        (isPast ? "bg-emerald-800" : 
                        (chargeAtYear > 0 ? "bg-red-500/10 border border-red-200" : "bg-emerald-500/20 border border-emerald-200"));

            timelineHtml += `
                <div class="segment ${color} relative group h-12 flex-1 border-r border-white/10 transition-all">
                    <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none shadow-2xl">
                        <b class="text-sky-400 uppercase">YR ${polY} (${yr})</b><br>
                        ${chargeAtYear > 0 ? `Penalty: ${chargeAtYear}%` : 'Fully Vested'}
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
                <div class="bg-slate-900 p-5 rounded-[24px] border-b-4 border-sky-500 shadow-lg flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Current Policy Year</p>
                    <p class="text-xl font-black text-sky-400 font-mono">YEAR ${polYearToday}</p>
                </div>

                <div class="bg-emerald-600 p-5 rounded-[24px] shadow-lg flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-emerald-100 uppercase mb-1">Surrender Value (Liquid)</p>
                    <p class="text-2xl font-black text-white">${autoFmt(surrenderValue, sym)}</p>
                </div>

                <div class="bg-white p-5 rounded-[24px] border border-red-100 shadow-sm flex flex-col justify-center text-center">
                    <p class="text-[10px] font-bold text-red-400 uppercase mb-1">Locked Penalty (${currentSCharge}%)</p>
                    <p class="text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <p class="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Vesting Timeline (Anniversary: Dec 30)</p>
            <div class="timeline-track flex h-12 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner mb-4">
                ${timelineHtml}
            </div>
        </div>
    </div>`;
}
