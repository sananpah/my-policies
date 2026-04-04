/* component_in.js - v4.1.20 - High-Fidelity Logic */
import { autoFmt, raw, toNum, safeGetYear, monthMap } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const commStr = p.commenced || "01 Jan 2024";
    const matStr = p.maturity || "01 Jan 2050";
    const premEndStr = p.premiumEnds || "01 Jan 2030";
    
    const startY = safeGetYear(commStr);
    const matY = safeGetYear(matStr);
    const premEndYear = safeGetYear(premEndStr);
    
    const brandColor = p.color || "#6366f1";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // 1. TIMELINE GENERATOR (Restored Colors & Logic)
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "";

        if (yr <= premEndYear) {
            color = isPast ? "bg-prem-past" : (isCurrent ? "bg-current" : "bg-prem-future");
        } else {
            color = isPast ? "bg-history-brown" : "bg-future-light-brown";
        }
        
        timelineHtml += `<div class="segment ${color}"><div class="tooltip">Year ${polY} (${yr})</div></div>`;
    }

    // 2. MATURITY STAR
    timelineHtml += `<div class="mat-star" style="color: #f59e0b; font-size: 24px; margin-left: 10px; cursor: help;">★<div class="tooltip">Maturity: ${raw(p.sumAssured)}</div></div>`;

    return `
    <div class="policy-card" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg};" 
             onclick="const c = this.parentElement.querySelector('.content-area'); this.parentElement.classList.toggle('active'); c.style.display = (c.style.display === 'none' ? 'block' : 'none'); c.style.opacity = '1';">
            <div class="w-24 flex justify-center"><img src="${p.logo}" class="max-h-10 object-contain"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[250px]">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: white;">
                        ${p.type || 'Savings'}
                    </div>
                    <div class="ml-6">
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none">Premium</p>
                    <p class="text-lg font-black text-emerald-600">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>
        </div>

        <div class="content-area">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p>${p.id}</p></div>
                <div class="detail-item"><p>UIN / Client ID</p><p>${p.uin || p.clientId || 'N/A'}</p></div>
                <div class="detail-item"><p>Next Due</p><p>${p.commenced.split(' ')[0]} ${p.commenced.split(' ')[1]} ${CURRENT_YEAR}</p></div>
            </div>
            <div class="timeline-track">
                <div class="absolute -top-10 left-0 text-[11px] font-black text-slate-400 uppercase">${commStr}</div>
                ${timelineHtml}
                <div class="absolute -top-10 right-0 text-[11px] font-black text-slate-400 uppercase">${matStr}</div>
            </div>
        </div>
    </div>`;
}
