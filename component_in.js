/* component_in.js - v4.1.38 - Standard Grid with Extreme Right Nominees */
import { checkIsDueSoon, autoFmt, toNum, safeParseDate, safeGetYear, monthMap, getTimeRemaining } from './utils.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
    const commStr = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]);
    const annMonthNum = monthMap[startParts[1]] || 0;
    const startY = parseInt(startParts[2]);

    const anniversaryThisYear = new Date(CURRENT_YEAR, annMonthNum, annDay);
    let yearsCompleted = CURRENT_YEAR - startY;
    if (TODAY < anniversaryThisYear) yearsCompleted--;
    const currentPolYear = yearsCompleted + 1; 

    const premEndStr = p.premiumEnds || "01 Jan 2030";
    const premEndYear = safeGetYear(premEndStr);
    const matStr = p.maturity || "01 Jan 2050";
    const matY = safeGetYear(matStr);

    const timeLeft = getTimeRemaining(p.premiumEnds, TODAY);
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    const finalPremiumDate = safeParseDate(p.premiumEnds);
    const isStillPaying = TODAY <= finalPremiumDate;
    const scheduledPayout = (p.payoutSchedule && p.payoutSchedule[currentPolYear]);
    const isIncomePhase = !isStillPaying && !!scheduledPayout;
    const isPaidUp = (p.status === "PAID UP") || (TODAY > finalPremiumDate);

    // --- NOMINEE UI (For Extreme Right) ---
    let nomineeHtml = "";
    if (p.nomineeStatus === "NA") {
        nomineeHtml = `<span class="text-xl" title="Not Applicable">🛡️</span>`;
    } else if (p.nomineeStatus === "EMPTY") {
        nomineeHtml = `<div class="flex items-center gap-1 animate-pulse"><span class="text-xl">⚠️</span><span class="text-[9px] font-black text-rose-500 uppercase">Missing</span></div>`;
    } else {
        nomineeHtml = `<div class="flex -space-x-2.5 justify-end">
            ${(p.nominees || []).map(n => `<img src="${n.img}" class="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-125 hover:z-20" title="${n.name}">`).join('')}
        </div>`;
    }

    // --- HEADER LABELS ---
    let middleLabel = "Annual Premium", middleValue = autoFmt(p.premium, sym), middleColor = isStillPaying ? "text-emerald-600 font-black" : "text-slate-700";
    if (isPaidUp) middleColor = "text-slate-400 line-through font-bold";
    else if (isIncomePhase) { middleLabel = "Annual Payout"; middleValue = autoFmt(scheduledPayout, sym); middleColor = "text-[#854d0e] font-black"; }

    const badgeText = isIncomePhase ? "Income Phase" : (p.type || "Savings");
    const hasPassedThisYear = TODAY >= anniversaryThisYear;
    const nextDueStr = `${annDay} ${startParts[1]} ${hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`; 
    const finalDueDate = isPaidUp ? "PAID UP" : nextDueStr;

    // --- TIMELINE ENGINE (Untouched) ---
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const loopPolY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isLoopCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";
        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || (isPaidUp && yr === premEndYear) || (isLoopCurrent && hasPassedThisYear);
            color = (isLoopCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
            phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
            detail = `Amt: ${autoFmt(p.premium, sym)}`;
        } else {
            const loopPayout = (p.payoutSchedule && p.payoutSchedule[loopPolY]);
            color = loopPayout ? (isPast ? "bg-payout-past" : "bg-payout-future") : (isPast ? "bg-history-brown" : "bg-future-light-brown");
            phase = loopPayout ? (isPast ? "Payout Received" : "Income Phase") : (isPast ? "Growth (Historical)" : "Growth Phase");
            detail = loopPayout ? `Payout: ${autoFmt(loopPayout, sym)}` : "Accumulating Value";
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${loopPolY} (${yr})</span></div></div>`;
    }
    timelineHtml += `<div class="mat-star">★<div class="tooltip" style="min-width: 140px;"><b class="text-orange-400 uppercase tracking-widest text-[9px]">${isULIP ? 'Projected Maturity*' : 'Maturity'}</b><br><span class="text-[10px] font-black leading-tight text-white">${p.maturityAmt || autoFmt(p.sumAssured, sym)}</span></div></div>`;

    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:${brandBg}; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${badgeText}</div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div><p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">${middleLabel}</p><p class="text-lg ${middleColor} leading-none">${middleValue}</p></div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                    <p class="text-lg font-black text-slate-800">${autoFmt(p.sumAssured, sym)}</p>
                </div>
            </div>
            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                ${isPaidUp ? `<img src="paid.jpg" class="paid-logo mx-auto h-12 object-contain">` : 
                    `<div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">${timeLeft ? 'Left: ' + timeLeft : ''}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>`}
            </div>
        </div>

        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-3 gap-4 mb-4 px-2">
                <div class="p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Benefit Cover</p>
                    <p class="text-[17px] font-bold text-slate-800 tracking-widest" style="font-family:'Orbitron';">${autoFmt(p.sumAssured, sym)}</p>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Valuation</p>
                    <p class="text-[19px] font-black text-slate-900" style="font-family:'Orbitron';">${p.currentUnitValue || 'No Value'}</p>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center text-right">
                    <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Policy Nominee(s)</p>
                    <div class="flex items-center h-8 justify-end">${nomineeHtml}</div>
                </div>
            </div>

            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p style="font-family: 'Orbitron'; font-size: 14px;">${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                <div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>
            </div>

            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
