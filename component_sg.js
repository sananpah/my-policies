/* component_sg.js - Singapore Specialist (Historical Clarity + Live Valuation) */
import { checkIsDueSoon, autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const startY = parseInt(p.commenced.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    
    // --- LIVE VALUATION LOGIC ---
    // Assuming 'currentUnitValue' is a field in your data.js
    const unitValue = toNum(p.currentUnitValue || 0);
    const polYearToday = CURRENT_YEAR - startY + 1;
    const currentSCharge = p.surrenderCharges?.[polYearToday] ?? 0;
    const surrenderValue = unitValue * (1 - (currentSCharge / 100));

    let timelineHtml = '';
    for(let yr = startY; yr < (startY + 15); yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        const sCharge = p.surrenderCharges?.[polY] ?? 0;
        const wBonus = p.welcomeBonus?.[polY];

        let color = "bg-slate-200"; 
        let label = sCharge > 0 ? "Vesting..." : "Fully Vested";

        if (isPast) {
            color = "bg-emerald-800"; // Dark Green for History
            label = "Premium Paid";
        } else if (isCurrent) {
            color = "bg-blue-600 ring-4 ring-white z-10 scale-110";
            label = "Current Position";
        } else {
            // Future Years
            if (sCharge > 0) {
                color = "bg-red-600"; // Locked
                label = `Locked (Penalty: ${sCharge}%)`;
            } else {
                color = "bg-emerald-100 border border-emerald-200"; // Vested Future
                label = "Vested (No Penalty)";
            }
            if (wBonus) {
                color = "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]";
                label = `Bonus Year (+${wBonus}%)`;
            }
        }

        timelineHtml += `
            <div class="segment ${color} relative group h-12 flex-1 border-r border-white/20 transition-all">
                <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-3 rounded-xl text-[10px] z-50 whitespace-nowrap pointer-events-none shadow-2xl border border-slate-700">
                    <b class="text-sky-400">YEAR ${polY} (${yr})</b><br>
                    <span class="font-bold uppercase">${label}</span>
                </div>
            </div>`;
    }

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8">
                <div class="w-20 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <img src="${p.logo}" class="max-h-10 w-full object-contain">
                </div>
                <div>
                    <h3 class="font-black text-2xl text-slate-800 tracking-tighter">${p.name}</h3>
                    <p class="text-[10px] text-red-600 font-bold uppercase tracking-widest">${p.company} • ILP Portfolio</p>
                </div>
            </div>
            <div class="flex gap-10 items-center">
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-2xl font-black">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="w-40 py-3 bg-slate-900 text-white rounded-2xl text-center shadow-lg">
                    <p class="text-[8px] font-bold text-slate-500 uppercase mb-1">Status</p>
                    <p class="text-xs font-black ${checkIsDueSoon(p.dueDate) ? 'text-red-400 animate-pulse' : ''}">${p.dueDate}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t border-slate-100">
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Unit Value (Account Value)</p>
                    <p class="text-3xl font-black text-slate-800">${autoFmt(unitValue, sym)}</p>
                </div>
                <div class="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 shadow-sm relative overflow-hidden">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1 text-right">Approx. Surrender Value</p>
                    <p class="text-3xl font-black text-emerald-700 text-right">${autoFmt(surrenderValue, sym)}</p>
                    ${currentSCharge > 0 ? `<span class="absolute top-2 left-4 text-[9px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200">Penalty: ${currentSCharge}% Applied</span>` : ''}
                </div>
            </div>

            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-4 text-[9px] font-bold text-slate-500">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-800 rounded-full"></span> PAID</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-600 rounded-full"></span> LOCKED</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-100 border border-emerald-300 rounded-full"></span> VESTED</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-pink-500 rounded-full"></span> BONUS</span>
                </div>
            </div>
            
            <div class="timeline-track flex h-12 bg-slate-200 rounded-xl overflow-visible p-1 shadow-inner">
                ${timelineHtml}
            </div>
            
            <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase mt-4 px-1">
                <span>Inception (${startY})</span>
                <span class="text-pink-500">Singapore Initial Phase</span>
                <span>Term End (${p.maturity.split(' ')[2]})</span>
            </div>
        </div>
    </div>`;
}
