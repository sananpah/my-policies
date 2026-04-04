/* component_in.js - v4.1.08 - Final CSS Synchronization */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

// Global Toggle Function synchronized with CSS .active class
window.toggleCard = function(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
        // Toggle 'active' class to match india_styles.css v5.8.1
        card.classList.toggle('active');
    }
};

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA SHIELD (Sync Gap Protection)
    const commStr = p.commenced || "01 Jan 2000";
    const matStr = p.maturity || "01 Jan 2050";
    const premEndStr = p.premiumEnds || "01 Jan 2030";

    const startParts = commStr.split(' ');
    const anniversaryDay = parseInt(startParts[0]) || 1;
    const anniversaryMonth = startParts[1] || "Jan"; 
    const annMonthNum = monthMap[anniversaryMonth] || 0;
    
    const startY = parseInt(startParts[2]) || 2000;
    const matY = safeGetYear(matStr);
    const premEndYear = safeGetYear(premEndStr);
    
    const todayMonth = TODAY.getMonth();
    const todayDay = TODAY.getDate();
    const hasPassedThisYear = (todayMonth > annMonthNum) || (todayMonth === annMonthNum && todayDay >= anniversaryDay);
    
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueStr = `${anniversaryDay} ${anniversaryMonth} ${nextDueYear}`; 
    const isPaidUp = p.status === "PAID UP" || (CURRENT_YEAR > premEndYear || (CURRENT_YEAR === premEndYear && hasPassedThisYear));
    const finalDueDate = isPaidUp ? "PAID UP" : nextDueStr;

    const brandColor = p.color || "#6366f1";
    // brandBg is used for the header tint
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // 2. PREMIUM REMAINING (00y00m)
    let premRemainingStr = "00y00m";
    if (!isPaidUp) {
        const end = safeParseDate(premEndStr);
        let y = end.getFullYear() - TODAY.getFullYear();
        let m = end.getMonth() - TODAY.getMonth();
        if (m < 0) { y--; m += 12; }
        premRemainingStr = `${String(Math.max(0, y)).padStart(2, '0')}y${String(Math.max(0, m)).padStart(2, '0')}m`;
    }

    // 3. TIMELINE GENERATOR (Using CSS classes: bg-prem-past, bg-prem-future, etc.)
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let colorClass = ""; 
        let phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                colorClass = "bg-hybrid"; phase = "Premium + Bonus";
                detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
            } else {
                colorClass = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else {
            colorClass = isPast ? "bg-history-brown" : "bg-future-light-brown";
            phase = isPast ? "Historical" : "Growth Phase";
            detail = "Wealth Accumulation";
        }
        // These classes (.segment, .tooltip) match the india_styles.css
        timelineHtml += `<div class="segment ${colorClass}"><div class="tooltip"><b>${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${polY} (${yr})</span></div></div>`;
    }

    // Maturity Star
    timelineHtml += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span>${raw(p.maturityAmt || p.sumAssured)}</span></div></div>`;

    // 4. FINAL HTML STRUCTURE
    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12 object-contain"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: white;">
                        ${p.type || 'Insurance'}
                    </div>
                    <div class="ml-6">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>

            <div class="w-40 text-center">
                ${isPaidUp ? `<img src="paid.jpg" class="paid-logo mx-auto">` : `
                    <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-bold text-indigo-500 uppercase leading-none mb-1">Left: <span class="text-slate-700">${premRemainingStr}</span></p>
                        <div class="h-[1px] bg-slate-200/50 w-full mb-1"></div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] text-slate-900">${finalDueDate}</div>
                    </div>
                `}
            </div>
        </div>

        <div class="content-area">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p>${p.id}</p></div>
                <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                <div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>
            </div>

            <div class="timeline-track">
                <div class="absolute -top-10 left-0 text-[11px] font-black text-slate-400 uppercase">${commStr}</div>
                ${timelineHtml}
                <div class="absolute -top-10 right-0 text-[11px] font-black text-slate-400 uppercase">${matStr}</div>
            </div>
        </div>
    </div>`;
}
