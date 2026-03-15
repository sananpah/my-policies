/* component_in.js - Updated with Brand Opacity Backgrounds */
import { checkIsDueSoon, getTimeLeft, autoFmt, toNum, raw } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const startParts = p.commenced.split(' ');
    const startY = parseInt(startParts[2]);
    const anniversaryDay = parseInt(startParts[0]);
    const anniversaryMonth = startParts[1];
    
    const matY = parseInt(p.maturity.split(' ')[2]);
    const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
    const isPaidUp = p.dueDate === "PAID UP";
    const timeLeft = getTimeLeft(p.premiumEnds);
    
    const currentAnniversary = new Date(`${anniversaryMonth} ${anniversaryDay}, ${CURRENT_YEAR}`);
    const hasPassedThisYear = TODAY > currentAnniversary;

    const isULIP = p.isULIP === true;
    const unitValue = Math.round(toNum(p.currentUnitValue || 0));
    const prem = Math.round(toNum(p.premium || 0));

    // --- NEW BRAND BACKGROUND LOGIC ---
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- REINSTATED ORIGINAL TIMELINE LOGIC ---
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
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center">
                    ${p.name}
                    ${p.isWife ? `<span class="family-marker ml-3" title="Wife's Policy"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.94 14c-.46-4.17-3.97-7.41-8.19-7.41s-7.73 3.24-8.19 7.41c-.02.21.11.41.32.41H20.62c.21 0 .34-.2.32-.41z"/></svg></span>` : ''}
                    ${p.isDaughter ? `<span class="family-marker ml-3" title="Daughter's Policy"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg></span>` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-10">
                <div class="flex items-center w-[300px] -ml-12">
                    <div class="funky-badge" style="border-color: ${brandColor}; box-shadow: 0 0 10px ${brandColor}44;">${p.type}</div>
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
            <div class="w-44 text-center">
                <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Next Due Date</p>
                ${isPaidUp ? `<img src="paid.jpg" class="paid-logo mx-auto">` : 
                `<div class="px-6 py-3 rounded-xl font-black text-xs text-center shadow-lg ${checkIsDueSoon(p.dueDate) ? 'due-blink' : 'bg-slate-900 text-white'}">${p.dueDate}</div>`}
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
                    <div class="detail-item">
                        <p>Customer ID</p>
                        <p>${p.clientId || 'N/A'}</p>
                    </div>
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
