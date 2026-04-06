/* component_sg.js - v6.7.0 - Final Visual Sync & Blinking Logic */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    // ... (Keep all your existing math/financial logic at the top) ...
    const commDate = new Date(p.commenced);
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    const mip = (p.mip !== undefined) ? p.mip : 0;
    const ppt = (p.ppt !== undefined) ? p.ppt : 0;
    
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    const nextDueDate = new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay);
    const nextDueDisplay = nextDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- BLINKING LOGIC ---
    const diffTime = nextDueDate - TODAY;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isDueSoon = diffDays <= 30 && diffDays >= 0;

    // --- VESTING STRING ---
    let vestingStr = (mip === 0 || (new Date(startY + mip, commMonth, commDay) <= TODAY)) ? "Vested" : "";
    if (!vestingStr) {
        const targetVesting = new Date(startY + mip, commMonth, commDay);
        let y = targetVesting.getFullYear() - TODAY.getFullYear();
        let m = targetVesting.getMonth() - TODAY.getMonth();
        if (targetVesting.getDate() < TODAY.getDate()) m--;
        if (m < 0) { y--; m += 12; }
        vestingStr = `LEFT: ${String(y).padStart(2,'0')}Y${String(m).padStart(2,'0')}M`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-2 relative" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="p-8 flex items-center justify-between cursor-pointer relative min-h-[100px]" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            
            <div class="flex items-center gap-6 pl-4 min-w-[340px]">
                <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white rounded-[22px] shadow-sm p-3 border border-slate-50">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div class="flex items-center gap-3">
                    <h3 class="font-black text-[26px] text-slate-800 tracking-tighter leading-none">${p.name}</h3>
                    <div class="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src="${p.avatarPath || 'avatar_self.png'}" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>

            <div class="flex-1 flex justify-center">
                <div class="relative group">
                    <div class="absolute -inset-1 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <span class="relative px-5 py-1.5 rounded-full border border-rose-200 bg-white/80 backdrop-blur-sm text-[11px] font-black text-rose-600 italic tracking-widest uppercase shadow-sm">
                        ${p.type || 'INVESTMENTS'}
                    </span>
                </div>
            </div>

            <div class="flex items-center gap-14 px-6">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-[0.15em] text-center">Sum Assured</p>
                    <p class="text-[22px] font-black text-slate-800 tracking-tighter leading-none text-center">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p>
                </div>
                <div class="pl-12 border-l border-slate-100">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-[0.15em] text-center">Annual Premium</p>
                    <p class="text-[22px] font-black text-[#059669] tracking-tighter leading-none text-center">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>

            <div class="w-48 flex flex-col justify-center ml-4">
                <div class="bg-white/80 px-5 py-3 rounded-[24px] border border-white shadow-sm flex flex-col justify-center min-h-[68px]">
                    <p class="text-[10px] font-black ${vestingStr.includes("Vested") ? 'text-emerald-500' : 'text-indigo-500'} uppercase text-center leading-none mb-1.5">${vestingStr}</p>
                    <div class="h-[1px] bg-slate-200/50 w-full mb-1.5"></div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1 text-center tracking-widest">Next Due</p>
                    <p class="text-[14px] font-black text-center tracking-tight leading-none ${isDueSoon ? 'text-red-600 animate-pulse' : 'text-slate-800'}">
                        ${nextDueDisplay}
                    </p>
                </div>
            </div>
        </div>

        <div class="content-area px-10 pb-10 pt-4" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            </div>
    </div>`;
}
