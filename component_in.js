/* component_in.js - v1.3.0 - Funky SA & Nominee Clusters */
import { autoFmt, toNum, getTimeRemaining } from './utils.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- FUNKY SUM ASSURED LOGIC ---
    const saValue = toNum(p.sumAssured);
    const saDisplay = (saValue === 0 || p.nomineeStatus === "NA") 
        ? `<div class="flex items-center gap-1.5 opacity-50"><span class="text-xl">💸</span><span class="text-[9px] font-black text-slate-400 uppercase leading-none">Wealth Growth</span></div>` 
        : `<span class="text-[17px] font-bold text-slate-800 tracking-widest" style="font-family: 'Orbitron', sans-serif;">${autoFmt(saValue, sym)}</span>`;

    // --- NOMINEE UI BUILDER ---
    let nomineeHtml = "";
    if (p.nomineeStatus === "NA") {
        nomineeHtml = `<span class="text-xl" title="Not Applicable">🛡️</span>`;
    } else if (p.nomineeStatus === "EMPTY") {
        nomineeHtml = `<div class="flex items-center gap-1 animate-pulse"><span class="text-xl">⚠️</span><span class="text-[9px] font-black text-rose-500 uppercase">Missing</span></div>`;
    } else {
        nomineeHtml = `<div class="flex -space-x-2.5">
            ${p.nominees.map(n => `<img src="${n.img}" class="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-125 hover:z-20" title="${n.name}">`).join('')}
        </div>`;
    }

    return `
    <div class="policy-card mb-6 overflow-hidden bg-white shadow-sm border-2 transition-all rounded-[20px]" id="card-${p.id}" style="border-color: ${brandColor}; border-left-width: 16px;">
        <div class="card-header p-4 flex items-center justify-between cursor-pointer" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-6 min-w-[340px]">
                <div class="w-16 h-12 flex items-center justify-center bg-white p-1 rounded border border-slate-100 shadow-sm"><img src="${p.logo}" class="max-h-full object-contain"></div>
                <div>
                    <h3 class="font-black text-xl text-slate-800 leading-none mb-1 tracking-tighter">${p.name}</h3>
                    <img src="${p.avatarPath}" class="w-6 h-6 rounded-full border border-white shadow-sm object-cover">
                </div>
            </div>
            <div class="flex-1 flex justify-center"><div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 10px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${p.type}</div></div>
            <div class="flex items-center gap-12 pr-4">
                <div class="text-center">
                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Annual Premium</p>
                    <p class="text-lg font-black text-[#059669]">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-8 pb-8 pt-6 relative" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sum Assured</p>
                    <div class="h-6 flex items-center">${saDisplay}</div>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nominee(s)</p>
                    <div class="flex items-center h-8">${nomineeHtml}</div>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Valuation</p>
                    <p class="text-[19px] font-black text-slate-900" style="font-family:'Orbitron';">${autoFmt(p.unitValueNumeric, sym)}</p>
                </div>
            </div>
            </div>
    </div>`;
}
