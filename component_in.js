/* component_in.js - v4.0.98 - Safety Refactor */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA SHIELD: Fallbacks for missing/syncing data
    const commStr = p.commenced || "01 Jan 2000";
    const matStr = p.maturity || "01 Jan 2000";
    const premEndStr = p.premiumEnds || "01 Jan 2000";

    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]);
    const annMonth = startParts[1]; 
    const annMonthNum = monthMap[annMonth] || 0;
    
    const startY = parseInt(startParts[2]);
    const matY = safeGetYear(matStr);
    const premEndYear = safeGetYear(premEndStr);
    
    // 2. DYNAMIC DUE DATE LOGIC
    const todayMonth = TODAY.getMonth();
    const todayDay = TODAY.getDate();
    
    const hasPassedThisYear = (todayMonth > annMonthNum) || (todayMonth === annMonthNum && todayDay >= annDay);
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueStr = `${annDay} ${annMonth} ${nextDueYear}`; 
    
    const isTermOver = CURRENT_YEAR > premEndYear || (CURRENT_YEAR === premEndYear && hasPassedThisYear);
    const finalDueDate = (p.status === "PAID UP" || isTermOver) ? "PAID UP" : nextDueStr;
    const isPaidUp = finalDueDate === "PAID UP";

    // 3. FINANCIAL VALUES
    const prem = Math.round(toNum(p.premium || 0));
    const isULIP = p.type === "ULIP";
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));

    // 4. PREMIUM REMAINING (Using safe utility)
    let premRemainingStr = "";
    if (!isPaidUp) {
        const end = safeParseDate(premEndStr);
        let y = end.getFullYear() - TODAY.getFullYear();
        let m = end.getMonth() - TODAY.getMonth();
        if (m < 0) { y--; m += 12; }
        premRemainingStr = `${String(Math.max(0, y)).padStart(2, '0')}y${String(Math.max(0, m)).padStart(2, '0')}m`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- TIMELINE GENERATOR (Using shared matY/startY) ---
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
            phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
            detail = `Amt: ${autoFmt(p.premium, sym)}`;
        } else {
            color = isPast ? "bg-history-brown" : "bg-future-light-brown";
            phase = isPast ? "Growth (Historical)" : "Growth Phase";
            detail = "Accumulating Value";
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${polY} (${yr})</span></div></div>`;
    }

    // --- TEMPLATE RETURN ---
    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px]">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: ${brandBg};">${p.type}</div>
                    <div class="ml-6">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(prem, sym)}</p>
                </div>
            </div>
            <div class="w-40 text-center">
                ${isPaidUp ? `<img src="paid.jpg" class="h-12 mx-auto">` : `
                    <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-bold text-indigo-500">Left: ${premRemainingStr}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>
                `}
            </div>
        </div>
        <div class="content-area p-6">
            <div class="timeline-track mt-10">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
