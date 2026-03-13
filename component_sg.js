/* component_sg.js - Singapore Specialist (Red/Pink Palette) */
import { checkIsDueSoon, autoFmt } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const startY = parseInt(p.commenced.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    
    let timelineHtml = '';
    // Focused 15-year window for bonuses and lock-ins
    for(let yr = startY; yr < (startY + 15); yr++) {
        const polY = yr - startY + 1;
        const isCurrent = yr === CURRENT_YEAR;
        const sCharge = p.surrenderCharges?.[polY] ?? 0;
        const wBonus = p.welcomeBonus?.[polY];
        const sBonus = p.specialBonus?.[polY];

        let color = "bg-rose-100"; 
        if (sCharge > 0) color = "bg-red-600"; 
        if (wBonus || sBonus) color = "bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]";
        
        const currentStyle = isCurrent ? "ring-4 ring-white z-10 scale-110 shadow-lg" : "";

        timelineHtml += `
            <div class="segment ${color} ${currentStyle} relative group cursor-help h-10 flex-1 transition-all border-r border-white/10">
                <div class="tooltip opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-3 rounded-xl text-[10px] whitespace-nowrap z-50 shadow-2xl pointer-events-none border border-pink-500/30">
                    <b class="text-pink-400 uppercase">YEAR ${polY} (${yr})</b><br>
                    <div class="mt-1 ${sCharge > 0 ? 'text-red-300' : 'text-emerald-400'} font-bold">
                        ${sCharge > 0 ? `🛑 Locked (${sCharge}%)` : '🔓 Fully Vested'}
                    </div>
                    ${wBonus ? `<div class="text-pink-300 font-bold mt-1">🎁 +${wBonus}% Bonus</div>` : ''}
                    ${sBonus ? `<div class="text-pink-300 font-bold mt-1">💎 Special Bonus</div>` : ''}
                </div>
            </div>`;
    }

    return `
    <div class="policy-card mb-8 overflow-hidden rounded-[32px] bg-white shadow-xl border-t-8" id="card-${p.id}" style="border-color: ${p.color}">
        <div class="card-header p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8">
                <div class="w-20"><img src="${p.logo}" class="max-h-12 w-full object-contain"></div>
                <div>
                    <h3 class="font-black text-2xl text-slate-800">${p.name}</h3>
                    <p class="text-[10px] font-black text-red-600 uppercase tracking-widest">${p.company} • ${p.type}</p>
                </div>
            </div>
            <div class="flex gap-10">
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Premium</p>
                    <p class="text-2xl font-black">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="w-40 bg-slate-900 text-white rounded-2xl flex flex-col justify-center items-center px-4">
                    <p class="text-[8px] font-bold text-slate-400 uppercase">Next Due</p>
                    <p class="text-xs font-black ${checkIsDueSoon(p.dueDate) ? 'text-red-400 animate-pulse' : ''}">${p.dueDate}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-6 bg-slate-50 border-t border-slate-100">
            <div class="flex justify-between items-center mb-8">
                <div class="flex gap-8 text-[10px] font-bold">
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-red-600 rounded-sm"></span> LOCKED</span>
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-pink-500 rounded-sm"></span> BONUS</span>
                    <span class="flex items-center gap-2"><span class="w-3 h-3 bg-rose-100 border border-slate-200 rounded-sm"></span> VESTED</span>
                </div>
                <div class="text-[11px] font-black text-slate-400">ID: ${p.id} | START: ${p.commenced}</div>
            </div>
            <div class="timeline-track flex h-10 bg-slate-200 rounded-xl overflow-visible p-1 mb-2">
                ${timelineHtml}
            </div>
            <div class="flex justify-between text-[9px] font-black text-slate-400 uppercase px-1">
                <span>Inception</span>
                <span class="text-pink-500 italic">Focused Initial Contribution Period View</span>
                <span>Term End</span>
            </div>
        </div>
    </div>`;
}
