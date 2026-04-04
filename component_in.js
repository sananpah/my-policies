/* component_in.js - v4.1.03 - Visual & Safety Restoration */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA SHIELD: Ensure we never split "undefined"
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
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // PREM REMAINING
    let premRemainingStr = "00y00m";
    if (!isPaidUp) {
        const end = safeParseDate(premEndStr);
        let y = end.getFullYear() - TODAY.getFullYear();
        let m = end.getMonth() - TODAY.getMonth();
        if (m < 0) { y--; m += 12; }
        premRemainingStr = `${String(Math.max(0, y)).padStart(2, '0')}y${String(Math.max(0, m)).padStart(2, '0')}m`;
    }

    // TIMELINE
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                color = "bg-hybrid"; phase = "Premium + Bonus";
                detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
            } else {
                color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else {
            color = isPast ? "bg-history-brown" : "bg-future-light-brown";
            phase = isPast ? "Historical" : "Growth Phase";
            detail = "Wealth Accumulation";
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b>${phase}</b><br>${detail}</div></div>`;
    }

    // THE CARD HTML
    return `
    <div class="policy-card mb-6" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg}; padding: 16px; display: flex; align-items: center;" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border: 1.5px solid ${brandColor}; color: ${brandColor}; background: ${brandBg}; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                        ${p.type}
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
                ${isPaidUp ? `<img src="paid.jpg" class="h-12 mx-auto">` : `
                    <div class="bg-white/60 p-2 rounded-xl border border-white/50">
                        <p class="text-[9px] font-bold text-indigo-500">Left: ${premRemainingStr}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Next Due</p>
                        <div class="font-black text-[11px]">${finalDueDate}</div>
                    </div>
                `}
            </div>
        </div>
        <div class="content-area p-6" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="timeline-track mt-10">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400">${commStr}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400">${matStr}</div>
            </div>
        </div>
    </div>`;
}
