/* component_in.js - Updated for Auto-Responsive Layout */
import { checkIsDueSoon, getTimeLeft, autoFmt, toNum, raw } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR, isMobile = false) {
    // 1. SHARED CONFIG & HELPERS
    const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };
    
    const parseDate = (str) => {
        if (!str || str === "PAID UP") return new Date(9999, 0, 1);
        const pParts = str.split(' ');
        return new Date(parseInt(pParts[2]), monthMap[pParts[1]], parseInt(pParts[0]));
    };

    // 2. DYNAMIC DUE DATE LOGIC
    const todayMonth = TODAY.getMonth();
    const todayDay = TODAY.getDate();

    const startParts = p.commenced.split(' ');
    const anniversaryDay = parseInt(startParts[0]);
    const anniversaryMonth = startParts[1]; 
    const annMonthNum = monthMap[anniversaryMonth];
    
    const startY = parseInt(startParts[2]);
    const matY = parseInt(p.maturity.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    
    const hasPassedThisYear = (todayMonth > annMonthNum) || (todayMonth === annMonthNum && todayDay >= anniversaryDay);
    const nextDueYear = hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR;
    const nextDueStr = `${anniversaryDay} ${anniversaryMonth} ${nextDueYear}`; 
    
    const isTermOver = CURRENT_YEAR > premEndYear || (CURRENT_YEAR === premEndYear && hasPassedThisYear);
    const finalDueDate = (p.status === "PAID UP" || isTermOver) ? "PAID UP" : nextDueStr;
    const isPaidUp = finalDueDate === "PAID UP";
   
    // FINANCIAL VALUES
    const isULIP = p.type === "ULIP";
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const prem = Math.round(toNum(p.premium || 0));
        
    // PREMIUM REMAINING CALCULATION
    let premRemainingStr = "";
    if (!isPaidUp) {
        const premEndDate = parseDate(p.premiumEnds);
        let years = premEndDate.getFullYear() - TODAY.getFullYear();
        let months = premEndDate.getMonth() - TODAY.getMonth();
        if (months < 0) { years--; months += 12; }
        const yStr = String(Math.max(0, years)).padStart(2, '0');
        const mStr = String(Math.max(0, months)).padStart(2, '0');
        premRemainingStr = `${yStr}y${mStr}m`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- TIMELINE LOGIC ---
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

    // --- RESPONSIVE CLASS LOGIC ---
    const headerClasses = isMobile ? "flex flex-col items-start gap-4 p-5" : "card-header flex items-center";
    const logoContainerClasses = isMobile ? "w-full flex justify-between items-center" : "w-32 flex justify-center";
    const statsContainerClasses = isMobile ? "flex flex-col gap-3 w-full mt-2" : "flex gap-12 items-center mr-6";
    const textMargin = isMobile ? "ml-0" : "ml-10";

    return `
    <div class="policy-card mb-6 overflow-hidden" id="card-${p.id}" style="border-left: ${isMobile ? '8px' : '16px'} solid ${brandColor};">
        <div class="${headerClasses} transition-colors cursor-pointer" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            
            <div class="${logoContainerClasses}">
                <img src="${p.logo}" class="max-h-8 md:max-h-12 object-contain">
                ${isMobile ? `<div class="funky-badge text-[10px]" style="border-color: ${brandColor};">${p.type}</div>` : ''}
            </div>

            <div class="flex-1 ${textMargin}">
                <h3 class="font-black text-slate-800 ${isMobile ? 'text-lg' : 'text-xl'} tracking-tight flex items-center gap-2">
                    ${p.name}
                    <div class="flex gap-1">
                        ${p.isWife ? `<span class="material-symbols-outlined text-pink-500 text-lg">woman</span>` : ''}
                        ${p.isDaughter ? `<span class="material-symbols-outlined text-indigo-500 text-lg">child_care</span>` : ''}
                    </div>
                </h3>
            </div>
            
            <div class="${statsContainerClasses}">
                <div class="flex items-center ${isMobile ? 'w-full justify-between' : 'w-[240px] -ml-4'}">
                    ${!isMobile ? `<div class="funky-badge" style="border-color: ${brandColor};">${p.type}</div>` : ''}
                    <div class="${isMobile ? '' : 'ml-6'}">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                        <p class="${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="${isMobile ? 'flex justify-between items-center w-full border-t border-slate-100 pt-2' : 'text-center border-l-2 border-slate-100 pl-10'}">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                    <p class="${isMobile ? 'text-base' : 'text-lg'} font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(prem, sym)}</p>
                </div>
            </div>

            <div class="${isMobile ? 'w-full mt-2' : 'w-40'} text-center flex flex-col justify-center min-h-[50px]">
                ${isPaidUp ? 
                    `<div class="flex ${isMobile ? 'justify-start' : 'justify-center'}"><img src="paid.jpg" class="h-10 md:h-12 object-contain brightness-110 drop-shadow-md"></div>` : 
                    `
                    <div class="bg-white/80 p-2 rounded-xl border border-white/50 shadow-sm flex ${isMobile ? 'justify-between items-center px-4' : 'flex-col'}">
                        <div>
                            <p class="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Next Due</p>
                            <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                        </div>
                        ${isMobile ? '<div class="w-[1px] h-6 bg-slate-200 mx-2"></div>' : '<div class="h-[1px] bg-slate-200/50 w-full my-1"></div>'}
                        <div>
                            <p class="text-[8px] font-bold text-indigo-500 uppercase">Left: <span class="text-slate-700">${premRemainingStr}</span></p>
                        </div>
                    </div>
                    `
                }
            </div>
        </div>

        <div class="content-area overflow-hidden">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-5">
                <div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Policy / UIN</p>
                    <p class="text-sm font-bold text-slate-700">${p.id || 'N/A'} <span class="text-slate-300 mx-1">|</span> ${p.uin || 'N/A'}</p>
                </div>
                
                ${isULIP ? `
                    <div class="bg-indigo-50 p-3 rounded-xl border-2 border-indigo-200 flex flex-col justify-center">
                        <p class="text-[9px] font-bold text-indigo-500 uppercase">Current Portfolio Value</p>
                        <p class="text-xl font-black text-indigo-900">${autoFmt(unitValue, sym)}</p>
                    </div>
                ` : `
                    <div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Client ID</p>
                        <p class="text-sm font-bold text-slate-700">${p.clientId || 'N/A'}</p>
                    </div>
                `}

                <div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Policy Term</p>
                    <p class="text-sm font-bold text-slate-700">${p.commenced.split(' ')[2]} <span class="text-slate-300 mx-2">→</span> ${p.maturity.split(' ')[2]}</p>
                </div>
            </div>

            <div class="px-5 pb-8 overflow-x-auto">
                <div class="timeline-track relative pt-10 min-w-[600px] md:min-w-full">
                    <div class="absolute top-0 left-0 text-[10px] font-black text-slate-400 uppercase">${p.commenced}</div>
                    ${timelineHtml}
                    <div class="absolute top-0 right-0 text-[10px] font-black text-slate-400 uppercase">${p.maturity}</div>
                </div>
            </div>
        </div>
    </div>`;
}
