/* component_sg.js - Singapore Specialist (Final Baseline v3.5.91) */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const startY = p.commenced ? parseInt(p.commenced.split(' ')[2]) : CURRENT_YEAR;
    
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const polYearToday = CURRENT_YEAR - startY + 1;
    const sCharges = p.surrenderCharges || {};
    const currentSCharge = sCharges[polYearToday] || 0;
    const surrenderValue = Math.round(unitValue * (1 - (currentSCharge / 100)));

    let timelineHtml = '';
    for(let yr = startY; yr < (startY + 15); yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        const sCharge = sCharges[polY] || 0;
        const wBonus = p.welcomeBonus ? p.welcomeBonus[polY] : null;

        let color = "bg-slate-200"; 
        let label = sCharge > 0 ? "Vesting..." : "Fully Vested";

        if (isPast) {
            color = "bg-emerald-800"; 
            label = "Premium Paid";
        } else if (isCurrent) {
            color = "bg-blue-600 ring-2 ring-offset-2 ring-blue-400 z-10 scale-110";
            label = "Current Position";
        } else {
            if (sCharge > 0) {
                color = "bg-red-600"; 
                label = `Locked (${sCharge}%)`;
            } else {
                color = "bg-pink-300 border border-pink-400";
                label = "Vested";
            }
            if (wBonus) {
                color = "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.7)]";
                label += ` + Bonus`;
            }
        }

        timelineHtml += `
            <div class="segment ${color} relative group h-12 flex-1 border-r border-white/10 transition-all">
                <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none shadow-2xl">
                    <b class="text-sky-400 uppercase">YR ${polY} (${yr})</b><br>${label}
                </div>
            </div>`;
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
            <div class="flex gap-10 items-center">
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Premium</p>
                    <p class="text-2xl font-black">${autoFmt(Math.round(toNum(p.premium)), sym)}</p>
                </div>
                <div class="w-48 py-3 bg-slate-900 text-white rounded-2xl text-center shadow-lg">
                    <p class="text-[8px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Next Due Date</p>
                    <p class="text-xs font-black ${checkIsDueSoon(p.dueDate) ? 'text-red-400 animate-pulse' : ''}">${p.dueDate}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="bg-slate-900 p-5 rounded-[24px] border-b-4 border-lime-500 shadow-lg flex flex-col justify-center">
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Policy Number</p>
                    <p class="text-sm font-black text-lime-400 tracking-widest font-mono">${p.id || 'N/A'}</p>
                </div>

                <div class="bg-indigo-900 p-5 rounded-[24px] shadow-lg border border-indigo-700 flex flex-col justify-center">
                    <p class="text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-wider">Account Value</p>
                    <p class="text-2xl font-black text-white">${autoFmt(unitValue, sym)}</p>
                </div>

                <div class="bg-emerald-100 p-5 rounded-[24px] border-2 border-emerald-200 shadow-sm flex flex-col justify-center">
                    <p class="text-[10px] font-bold text-emerald-700 uppercase mb-1 tracking-wider">Surrender Value</p>
                    <p class="text-2xl font-black text-emerald-900">${autoFmt(surrenderValue, sym)}</p>
                </div>
            </div>

            <div class="flex gap-4 text-[9px] font-bold text-slate-400 mb-4 uppercase tracking-tighter">
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-800 rounded-sm"></span> PAID</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-600 rounded-sm"></span> LOCKED</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-300 rounded-sm"></span> VESTED</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-500 rounded-sm shadow-[0_0_5px_rgba(236,72,153,0.5)]"></span> BONUS</span>
            </div>
            
            <div class="timeline-track flex h-12 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner">
                ${timelineHtml}
            </div>
        </div>
    </div>`;
}
