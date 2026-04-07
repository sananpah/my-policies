/* component_in.js - v4.1.24 - UI Restoration */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const roundFmt = (v, s) => s + Math.round(v).toLocaleString('en-IN');
    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
    const commStr = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]), annMonthNum = monthMap[startParts[1]] || 0, startY = parseInt(startParts[2]);
    const annThisYear = new Date(CURRENT_YEAR, annMonthNum, annDay);
    let yearsComp = CURRENT_YEAR - startY;
    if (TODAY < annThisYear) yearsComp--;
    const currentPolYear = yearsComp + 1; 

    const premEndYear = safeGetYear(p.premiumEnds || "01 Jan 2030"), matY = safeGetYear(p.maturity || "01 Jan 2050");
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    const isStillPaying = (CURRENT_YEAR < premEndYear) || (CURRENT_YEAR === premEndYear && TODAY < annThisYear);
    const scheduledPayout = (p.payoutSchedule && p.payoutSchedule[currentPolYear]);
    const isIncomePhase = !isStillPaying && !!scheduledPayout;

    let middleLabel = "Sum Assured", middleValue = roundFmt(p.sumAssured, sym), middleColor = "text-slate-700";
    if (isStillPaying) {
        middleLabel = "Annual Premium"; middleValue = roundFmt(p.premium, sym); middleColor = "text-emerald-600";
    } else if (isIncomePhase) {
        middleLabel = "Annual Payout"; middleValue = roundFmt(scheduledPayout, sym); middleColor = "text-[#854d0e]"; 
    }

    const isPaidUp = (p.status === "PAID UP") || (CURRENT_YEAR > (premEndYear - 1)) || (CURRENT_YEAR === (premEndYear - 1) && TODAY >= annThisYear);
    const finalDueDate = isPaidUp ? "PAID UP" : `${annDay} ${startParts[1]} ${TODAY >= annThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`;

    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const lpPolY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isLoopCur = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        if (yr < premEndYear) {
            const isEffPaid = isPast || isPaidUp || (isLoopCur && TODAY >= annThisYear);
            color = (isLoopCur && TODAY < annThisYear && !isPaidUp) ? "bg-current" : (isEffPaid ? "bg-prem-past" : "bg-prem-future");
            phase = isEffPaid ? "Premium Completed" : "Premium Payment";
            detail = `Amt: ${roundFmt(p.premium, sym)}`;
        } else {
            const lpPayout = (p.payoutSchedule && p.payoutSchedule[lpPolY]);
            if (lpPayout) {
                color = isPast ? "bg-payout-past" : "bg-payout-future";
                phase = isPast ? "Payout Received" : "Income Phase";
                detail = `Payout: ${roundFmt(lpPayout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b>${phase}</b><br>${detail}</div></div>`;
    }

    return `
    <div class="policy-card mb-6" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg}; cursor:pointer;" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12" onerror="this.src='logo_default.png'"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px]">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor};">${isIncomePhase ? "Income Phase" : p.type}</div>
                    <div class="ml-6">
                        <p class="text-[9px] uppercase">${middleLabel}</p>
                        <p class="text-lg font-black ${middleColor}">${middleValue}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 pl-10">
                    <p class="text-[9px] uppercase">Sum Assured</p>
                    <p class="text-lg font-black text-slate-800">${roundFmt(p.sumAssured, sym)}</p>
                </div>
            </div>
            <div class="w-40 text-center">
                <p class="text-[9px] uppercase">Next Due</p>
                <div class="font-black ${checkIsDueSoon(finalDueDate) ? 'text-red-500' : 'text-slate-900'}">${finalDueDate}</div>
            </div>
        </div>
        <div class="content-area hidden" id="content-${p.id}">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p>${p.id}</p></div>
                <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                ${isULIP ? `
                <div class="detail-item" style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; padding: 10px;">
                    <p style="color: #4338ca; font-weight: 800; font-size: 10px; text-transform: uppercase;">Portfolio Value</p>
                    <p style="font-weight: 900; color: #1e1b4b; font-size: 18px;">${p.currentUnitValue}</p>
                </div>` : `
                <div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>`
                }
            </div>
            <div class="timeline-track p-10">${timelineHtml}</div>
        </div>
    </div>`;
}
