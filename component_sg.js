/* component_sg.js - Singapore Specialist */
import { checkIsDueSoon, autoFmt } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const startY = parseInt(p.commenced.split(' ')[2]);
    let timelineHtml = '';
    
    // Focus on the first 15 years for Singapore ILP specifics
    for(let yr = startY; yr < (startY + 15); yr++) {
        const polY = yr - startY + 1;
        const isCurrent = yr === CURRENT_YEAR;
        const sCharge = p.surrenderCharges?.[polY] ?? 0;
        const wBonus = p.welcomeBonus?.[polY];

        let color = "bg-rose-100"; // Free/Vested
        if (sCharge > 0) color = "bg-red-600"; // Locked (Red)
        if (wBonus) color = "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.5)]"; // Bonus (Pink)
        
        timelineHtml += `
            <div class="segment ${color} ${isCurrent ? 'ring-2 ring-white scale-110 z-10' : ''} relative group h-10 flex-1 border-r border-white/10 transition-all">
                <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded text-[10px] z-50 whitespace-nowrap pointer-events-none shadow-xl border border-pink-500/30">
                    YR ${polY}: ${sCharge > 0 ? `Locked (${sCharge}%)` : 'Vested'} ${wBonus ? `+${wBonus}% Bonus` : ''}
                </div>
            </div>`;
    }

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8">
                <div class="w-20 p-2 bg-white rounded-lg border border-slate-100"><img src="${p.logo}" class="max-h-10 w-full object-contain"></div>
                <div>
                    <h3 class="font-black text-2xl text-slate-800">${p.name}</h3>
                    <p class="text-[10px] text-red-600 font-bold uppercase tracking-widest">${p.company} • ${p.type}</p>
                </div>
            </div>
            <div class="flex gap-10 items-center">
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-2xl font-black">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="w-40 py-3 bg-slate-900 text-white rounded-2xl text-center">
                    <p class="text-[8px] font-bold text-slate-500 uppercase">Status</p>
                    <p class="text-xs font-black ${checkIsDueSoon(p.dueDate) ? 'text-red-400 animate-pulse' : ''}">${p.dueDate}</p>
                </div>
            </div>
        </div>
        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t border-slate-100">
            <div class="flex justify-between items-center mb-6">
                <div class="flex gap-6 text-[10px] font-bold text-slate-500">
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-red-600 rounded-sm"></span> LOCKED</span>
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-pink-500 rounded-sm shadow-[0_0_5px_rgba(236,72,153,0.5)]"></span> BONUS</span>
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-rose-100 border border-slate-200 rounded-sm"></span> VESTED</span>
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: ${p.id}</div>
            </div>
            <div class="timeline-track flex h-10 bg-slate-200 rounded-xl overflow-visible p-1">
                ${timelineHtml}
            </div>
            <div class="flex justify-between text-[9px] font-black text-slate-400 uppercase mt-2 px-1">
                <span>START ${startY}</span>
                <span class="text-pink-500">INITIAL 15-YEAR INVESTMENT PHASE</span>
                <span>MATURITY ${p.maturity.split(' ')[2]}</span>
            </div>
        </div>
    </div>`;
}
