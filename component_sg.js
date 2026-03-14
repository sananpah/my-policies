/* component_sg.js - Baseline v3.6.5 (Exact India Legend & Star) */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    
    // Math Year (Penalty remains at Year 5 rate: 60%)
    let chargeYear = TODAY.getFullYear() - startY;
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    if (TODAY >= anniversaryThisYear) chargeYear++;
    
    // Display Year (Timeline position: Year 6)
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

    // --- TIMELINE LOGIC ---
    let timelineHtml = '';
    const totalSegments = 15;

    for(let polY = 1; polY <= totalSegments; polY++) {
        const yr = startY + polY - 1;
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        const hasBonus = p.welcomeBonus && p.welcomeBonus[polY];
        const isCurrent = (polY === displayYear);
        const isPast = (polY < displayYear);
        
        let color = isCurrent ? "bg-blue-600 ring-4 ring-blue-400/30 z-10 scale-105" : 
                    (isPast ? "bg-emerald-800" : 
                    (hasBonus ? "bg-pink-500" : (chargeAtYear > 0 ? "bg-red-600" : "bg-emerald-500/20 border border-emerald-300")));

        timelineHtml += `
            <div class="segment ${color} relative group h-12 flex-1 border-r border-white/10 transition-all">
                ${isCurrent ? '<div class="absolute inset-0 bg-white/20 animate-pulse"></div>' : ''}
                <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none shadow-2xl">
                    <b class="text-sky-400 uppercase">YR ${polY} (${yr})</b><br>
                    ${isCurrent ? 'Current (In Progress)' : (chargeAtYear > 0 ? 'Locked' : 'Vested')}
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
            <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase">Current Market Value</p>
                <p class="text-3xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t">
            <div class="grid grid-cols-3 gap-4 mb-6">
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

            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Commenced</span>
                    <span class="text-xs font-black text-slate-700">${p.commenced}</span>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Maturity Date</span>
                    <span class="text-xs font-black text-slate-700">${p.maturity}</span>
                </div>
            </div>

            <div class="flex items-end justify-between mb-3 px-1">
                <div class="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter pb-1">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-800 rounded-sm"></span> PAID</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-600 rounded-sm"></span> LOCKED</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-500 rounded-sm"></span> BONUS</span>
                </div>
                <div class="text-right leading-none">
                    <div class="text-[10px] font-black text-slate-500 italic transform -skew-x-12 tracking-widest">
                         ⭐ MATURITY
                    </div>
                    <div class="text-[8px] font-bold text-slate-400 italic transform -skew-x-12 tracking-widest mt-0.5 uppercase">
                         Unit Value
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <div class="timeline-track flex h-12 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner flex-1">
                    ${timelineHtml}
                </div>
                <div class="relative group cursor-help">
                    <div class="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-xl shadow-lg border-b-4 border-amber-400 transition-transform group-hover:scale-110">
                        <span class="text-amber-400 text-lg">⭐</span>
                    </div>
                    <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 right-0 bg-slate-900 text-white p-2 rounded text-[9px] z-50 whitespace-nowrap pointer-events-none shadow-2xl border border-amber-400/30">
                        <b class="text-amber-400 uppercase">Maturity Milestone</b><br>
                        Value: Unit Value at that time
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
