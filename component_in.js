/* component_in.js - v4.1.3 - Fixed 10-Year Boundary Logic */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA SHIELD
    const commStr = p.commenced || "01 Jan 2000";
    const matStr = p.maturity || "01 Jan 2050";
    const premEndStr = p.premiumEnds || "01 Jan 2030";

    const startParts = commStr.split(' ');
    const anniversaryDay = parseInt(startParts[0]);
    const anniversaryMonth = startParts[1]; 
    const annMonthNum = monthMap[anniversaryMonth] || 0;
    
    const startY = parseInt(startParts[2]);
    const matY = safeGetYear(matStr);
    const premEndYear = safeGetYear(premEndStr);
    
    // 2. DYNAMIC DUE DATE LOGIC
    const todayMonth = TODAY.getMonth();
    const todayDay = TODAY.getDate();
    
    const hasPassedThisYear = (todayMonth > annMonthNum) || (todayMonth === annMonthNum && todayDay >= anniversaryDay);
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueStr = `${anniversaryDay} ${anniversaryMonth} ${nextDueYear}`; 
    
    // FIX: Term is over once we pass the anniversary of the LAST payment year (premEndYear - 1)
    const lastPaymentYear = premEndYear - 1;
    const isTermOver = CURRENT_YEAR > lastPaymentYear || (CURRENT_YEAR === lastPaymentYear && hasPassedThisYear);
    
    const finalDueDate = (p.status === "PAID UP" || isTermOver) ? "PAID UP" : nextDueStr;
    const isPaidUp = finalDueDate === "PAID UP";
   
    // 3. FINANCIAL VALUES
    const isULIP = p.type === "ULIP";
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const prem = Math.round(toNum(p.premium || 0));
       
    // 4. PREMIUM REMAINING
    let premRemainingStr = "";
    if (!isPaidUp) {
        const premEndDate = safeParseDate(premEndStr);
        let years = premEndDate.getFullYear() - TODAY.getFullYear();
        let months = premEndDate.getMonth() - TODAY.getMonth();
        if (months < 0) { years--; months += 12; }
        const yStr = String(Math.max(0, years)).padStart(2, '0');
        const mStr = String(Math.max(0, months)).padStart(2, '0');
        premRemainingStr = `${yStr}y${mStr}m`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- 5. TIMELINE LOGIC ---
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "", phase = "", detail = "";

        // FIX: Change <= to < to show exactly PPT number of years
        if (yr < premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                color = "bg-hybrid"; phase = "Premium + Bonus";
                detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
            } else {
                color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else if (p.name.includes("Nishchit Pension") && polY === 7) {
            color = isPast ? "bg-history-brown" : "bg-future-light-brown";
            phase = "Deferment Year"; detail = "Wealth Locked";
        } else {
            const payout = (p.payoutSchedule && p.payoutSchedule[polY]) || p.annualPayout;
            if (payout) {
                color = isPast ? "bg-payout-past" : "bg-payout-future";
                phase = isPast ? "Payout Received" : "Income Phase";
                detail = `Payout: ${autoFmt(payout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = isPast ? "Growth (Historical)" : "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${polY} (${yr})</span></div></div>`;
    }

    timelineHtml += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span class="${String(p.maturityAmt || p.sumAssured).length > 15 ? 'text-[10px]' : 'text-lg'} font-black">${raw(p.maturityAmt || p.sumAssured)}</span></div></div>`;

    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `
                        <div class="flex items-center ml-2">
                            <img src="${p.avatarPath}" 
                                 alt="${p.holderType || 'Insured'}" 
                                 title="${p.holderType || 'Insured'}"
                                 class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">
                        </div>
                    ` : ''}
                </h3>
             </div>
            
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: ${brandBg}; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; padding: 2px 8px; border-radius: 6px; border: 1.5px solid; text-transform: uppercase;">
                        ${p.type}
                    </div>
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

            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                ${isPaidUp ? 
                    `<img src="paid.jpg" class="paid-logo mx-auto h-12 object-contain">` : 
                    `
                    <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-bold text-indigo-500 uppercase leading-none mb-1">Left: <span class="text-slate-700">${premRemainingStr}</span></p>
                        <div class="h-[1px] bg-slate-200/50 w-full mb-1"></div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>
                    `
                }
            </div>
        </div>

        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="detail-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px;">
                <div class="detail-item"><p>Policy Number</p><p>${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                ${isULIP ? `
                    <div class="detail-item" style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; justify-content: center;">
                        <p style="color: #4338ca; font-weight: 800; font-size: 10px; margin: 0; text-transform: uppercase;">Portfolio Value</p>
                        <p style="font-weight: 900; color: #1e1b4b; font-size: 18px; margin: 0;">${autoFmt(unitValue, sym)}</p>
                    </div>
                ` : `
                    <div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>
                `}
            </div>

            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
