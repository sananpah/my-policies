/* component_in.js - v4.1.39 - Surgical Nominee Insertion */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap, getTimeRemaining } from './utils.js';

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

    const isAssigned = toNum(p.sumAssured) === 0;
    const isPaidUp = (p.status === "PAID UP") || (TODAY > finalPremiumDate);

    let middleLabel = "Annual Premium";
    let middleValue = autoFmt(p.premium, sym);
    let middleColor = isStillPaying ? "text-emerald-600 font-black" : "text-slate-700";

    if (isPaidUp) {
        middleColor = "text-slate-400 line-through font-bold";
    } else if (isIncomePhase) {
        middleLabel = "Annual Payout";
        middleValue = autoFmt(scheduledPayout, sym);
        middleColor = "text-[#854d0e] font-black";
    }

    const badgeText = isIncomePhase ? "Income Phase" : (p.type || "Savings");
    const hasPassedThisYear = TODAY >= anniversaryThisYear;
    const nextDueStr = `${annDay} ${startParts[1]} ${hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`; 
    const finalDueDate = isPaidUp ? "PAID UP" : nextDueStr;

    // --- NOMINEE UI BUILDER ---
    let nomineeHtml = "";
    if (p.nomineeStatus === "NA") {
        nomineeHtml = `<span class="text-[11px] font-black text-slate-400 uppercase italic">Not Applicable</span>`;
    } else if (p.nomineeStatus === "EMPTY") {
        nomineeHtml = `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase">Not Assigned</span>`;
    } else {
        nomineeHtml = `<div class="flex items-center gap-3">
            <div class="flex -space-x-2">
                ${(p.nominees || []).map(n => `<img src="${n.img}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-100 transition-transform hover:scale-125 hover:z-20" title="${n.name}">`).join('')}
            </div>
            <span class="text-[13px] font-bold text-slate-600 tracking-tight">${(p.nominees || []).map(n => n.name).join(', ')}</span>
        </div>`;
    }

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
            if (loopPayout) {
                color = isPast ? "bg-payout-past" : "bg-payout-future";
                phase = isPast ? "Payout Received" : "Income Phase";
                detail = `Payout: ${autoFmt(loopPayout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = isPast ? "Growth (Historical)" : "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${loopPolY} (${yr})</span></div></div>`;
    }

    timelineHtml += `<div class="mat-star">★
        <div class="tooltip" style="min-width: 140px;">
            <b class="text-orange-400 uppercase tracking-widest text-[9px]">${isULIP ? 'Projected Maturity*' : 'Maturity'}</b><br>
            <span class="text-[10px] font-black leading-tight text-white">${p.maturityAmt || autoFmt(p.sumAssured, sym)}</span>
        </div>
    </div>`;

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
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: ${brandBg}; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; padding: 2px 8px; border-radius: 6px; border: 1.5px solid; text-transform: uppercase;">
                        ${badgeText}
                    </div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">${middleLabel}</p>
                            <p class="text-lg ${middleColor} leading-none">${middleValue}</p>
                        </div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    ${isAssigned ? `<img src="assigned.png" class="h-10 object-contain mx-auto opacity-95 transform -rotate-3">` : 
                        `<div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                            <p class="text-lg font-black text-slate-800">${autoFmt(p.sumAssured, sym)}</p>
                        </div>`
                    }
                </div>
            </div>
            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                ${isPaidUp ? `<img src="paid.jpg" class="paid-logo mx-auto h-12 object-contain">` : 
                    `<div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        ${timeLeft ? `<p class="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">Left: ${timeLeft}</p>` : ''}
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>`
                }
            </div>
        </div>
        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p>${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                ${isULIP ? `<div class="detail-item" style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; padding: 10px;">
                        <p style="color: #4338ca; font-weight: 800; font-size: 10px; text-transform: uppercase;">Portfolio Value</p>
                        <p style="font-weight: 900; color: #1e1b4b; font-size: 18px;">${p.currentUnitValue || 'No Value'}</p>
                    </div>` : `<div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>`
                }
            </div>
            
            <div class="mt-4 p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-2">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Beneficiary Nominee(s)</p>
                <div class="flex items-center">${nomineeHtml}</div>
            </div>

            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
