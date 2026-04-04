/* component_in.js - v6.5.0 - Final UI Sync */
import { autoFmt, safeGetYear } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const commStr = p.commenced || "01 Jan 2024";
    const matStr = p.maturity || "01 Jan 2050";
    const startY = safeGetYear(commStr);
    const matY = safeGetYear(matStr);
    const brandColor = p.color || "#6366f1";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const color = yr < CURRENT_YEAR ? "bg-prem-past" : (yr === CURRENT_YEAR ? "bg-current" : "bg-prem-future");
        timelineHtml += `<div class="segment ${color}"><div class="tooltip">Year ${yr}</div></div>`;
    }

    return `
    <div class="policy-card" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg};" 
             onclick="const c = this.parentElement.querySelector('.content-area'); c.style.display = (c.style.display === 'none' ? 'block' : 'none'); c.style.opacity = '1';">
            <div class="w-24 flex justify-center"><img src="${p.logo}" class="max-h-10 object-contain"></div>
            <div class="flex-1 ml-10 text-left"><h3 class="font-black text-slate-800 text-xl">${p.name}</h3></div>
            <div class="flex gap-12 items-center mr-6">
                <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor};">${p.type || 'Savings'}</div>
                <div class="text-left"><p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p></div>
            </div>
        </div>
        <div class="content-area">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p>${p.id}</p></div>
                <div class="detail-item"><p>Commencement</p><p>${commStr}</p></div>
                <div class="detail-item"><p>Maturity</p><p>${matStr}</p></div>
            </div>
            <div class="timeline-track">
                <div class="absolute -top-10 left-0 text-[11px] font-black text-slate-400 uppercase">${commStr}</div>
                ${timelineHtml}
                <div class="absolute -top-10 right-0 text-[11px] font-black text-slate-400 uppercase">${matStr}</div>
            </div>
        </div>
    </div>`;
}
