/* component_in.js - v4.1.06 - Layout Restoration */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

window.toggleCard = function(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) card.classList.toggle('active');
};

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA SAFETY
    const commStr = p.commenced || "01 Jan 2024";
    const matStr = p.maturity || "01 Jan 2050";
    const premEndStr = p.premiumEnds || "01 Jan 2030";

    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]);
    const annMonth = startParts[1]; 
    const annMonthNum = monthMap[annMonth] || 0;
    
    const startY = parseInt(startParts[2]);
    const matY = safeGetYear(matStr);
    const premEndYear = safeGetYear(premEndStr);
    
    const isPaidUp = p.status === "PAID UP" || (CURRENT_YEAR > premEndYear);
    const finalDueDate = isPaidUp ? "PAID UP" : `${annDay} ${annMonth} ${CURRENT_YEAR}`;

    const brandColor = p.color || "#6366f1";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // 2. TIMELINE GENERATOR (Fixes empty bar)
    let timelineHtml = '';
    const totalYears = matY - startY;
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = yr <= premEndYear ? (isPast ? "bg-prem-past" : "bg-prem-future") : "bg-future-light-brown";
        if (isCurrent && !isPaidUp) color = "bg-current";
        
        // inline-block with width percentage for visual filling
        const width = (100 / totalYears).toFixed(2);
        timelineHtml += `<div class="segment ${color}" style="width: ${width}%; height: 16px; position: relative;">
            <div class="tooltip"><b>Year ${polY}</b><br>${yr}</div>
        </div>`;
    }

    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header flex items-center p-4 cursor-pointer" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div style="border: 1.5px solid ${brandColor}; color: ${brandColor}; background: ${brandBg}; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                        ${p.type || 'Savings'}
                    </div>
                    <div class="ml-6">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-lg font-black text-emerald-600">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>

            <div class="w-40 text-center">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Next Due</p>
                    <div class="font-black text-[11px]">${finalDueDate}</div>
                </div>
            </div>
        </div>

        <div class="content-area overflow-hidden">
            <div class="p-6">
                <div class="timeline-track relative flex w-full bg-slate-100 rounded-full h-4 mt-8">
                    <div class="absolute -top-6 left-0 text-[10px] font-bold text-slate-400">${commStr}</div>
                    ${timelineHtml}
                    <div class="absolute -top-6 right-0 text-[10px] font-bold text-slate-400">${matStr}</div>
                </div>
            </div>
        </div>
    </div>`;
}
