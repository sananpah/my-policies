/* component_in.js - v5.0.1 - Timeline & Star Restoration */
import { checkIsDueSoon, autoFmt, toNum, monthMap, safeGetYear } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
    const commStr = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]), annMonth = monthMap[startParts[1]] || 0, startY = parseInt(startParts[2]);
    const annThisYear = new Date(CURRENT_YEAR, annMonth, annDay);
    
    let yearsComp = CURRENT_YEAR - startY;
    if (TODAY < annThisYear) yearsComp--;
    const polYear = yearsComp + 1;

    const premEndYear = safeGetYear(p.premiumEnds), matY = safeGetYear(p.maturity);
    const isPaying = (CURRENT_YEAR < premEndYear) || (CURRENT_YEAR === premEndYear && TODAY < annThisYear);
    
    const payoutStr = p.payoutSchedule ? p.payoutSchedule[polYear] : null;
    const isIncome = !isPaying && !!payoutStr;

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    const cardFmt = (v) => sym + Math.round(toNum(v)).toLocaleString('en-IN');

    let midLbl = "Sum Assured", midVal = cardFmt(p.sumAssured), midCol = "text-slate-700";
    if (isPaying) {
        midLbl = "Annual Premium"; midVal = cardFmt(p.premium); midCol = "text-emerald-600";
    } else if (isIncome) {
        midLbl = "Annual Payout"; midVal = payoutStr; midCol = "text-[#854d0e]"; 
    }

    const isPaidUp = (p.status === "PAID UP") || (CURRENT_YEAR >= premEndYear && TODAY >= annThisYear);
    const dueStr = isPaidUp ? "PAID UP" : `${annDay} ${startParts[1]} ${TODAY >= annThisYear ? CURRENT_YEAR+1 : CURRENT_YEAR}`;

    // --- RESTORED TIMELINE LOGIC ---
    let timeline = '';
    for(let y = startY; y < matY; y++) {
        const lpY = y - startY + 1;
        const past = y < CURRENT_YEAR;
        const curPayout = p.payoutSchedule ? p.payoutSchedule[lpY] : null;
        let color = "bg-history-brown", phase = "Growth", detail = "Accumulating Value";

        if (y < premEndYear) {
            const effPaid = past || (y === CURRENT_YEAR && TODAY >= annThisYear);
            color = (y === CURRENT_YEAR && TODAY < annThisYear) ? "bg-current" : (effPaid ? "bg-prem-past" : "bg-prem-future");
            phase = "Premium Payment"; detail = `Amt: ${cardFmt(p.premium)}`;
        } else if (curPayout) {
            color = past ? "bg-payout-past" : "bg-payout-future";
            phase = "Income Phase"; detail = `Payout: ${curPayout}`;
        }
        timeline += `<div class="segment ${color}"><div class="tooltip"><b class="uppercase tracking-tighter text-[10px]">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${lpY} (${y})</span></div></div>`;
    }

    // Restore Maturity Star
    timeline += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span class="text-lg font-black">${cardFmt(p.maturityAmt || p.sumAssured)}</span></div></div>`;

    return `
    <div class="policy-card mb-6" style="border-left: 16px solid ${brandColor};" id="card-${p.id}">
        <div class="card-header transition-colors" style="background: ${brandBg}; cursor:pointer;" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12" onerror="this.src='logo_default.png'"></div>
            <div class="flex-1 ml-10"><h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                ${p.name}
                ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">` : ''}
            </h3></div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px]">
                    <div class="funky-badge-v2" style="border: 1.5px solid ${brandColor}; color: ${brandColor}; background: ${brandBg}; padding: 2px 8px; border-radius: 6px; font-weight: 900; text-transform: uppercase; font-size: 10px;">
                        ${isIncome ? "Income Phase" : p.type}
                    </div>
                    <div class="ml-6">
                        <p class="text-[9px] uppercase font-bold text-slate-400">${midLbl}</p>
                        <p class="text-lg font-black ${midCol}">${midVal}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 pl-10 border-slate-100">
                    <p class="text-[9px] uppercase font-bold text-slate-400">Sum Assured</p>
                    <p class="text-lg font-black text-slate-800">${cardFmt(p.sumAssured)}</p>
                </div>
            </div>
            <div class="w-40 text-center">
                <p class="text-[9px] uppercase font-bold text-slate-400">Next Due</p>
                <div class="font-black ${checkIsDueSoon(dueStr) ? 'text-red-500' : 'text-slate-900'}">${dueStr}</div>
            </div>
        </div>
        <div class="content-area hidden px-8 pb-8" id="content-${p.id}">
            <div class="detail-grid grid grid-cols-3 gap-4 mb-12 pt-6">
                <div class="detail-item"><p class="text-[10px] uppercase font-bold text-slate-400">Policy Number</p><p class="font-bold">${p.id}</p></div>
                <div class="detail-item"><p class="text-[10px] uppercase font-bold text-slate-400">UIN Number</p><p class="font-bold">${p.uin || 'N/A'}</p></div>
                ${isULIP ? `
                <div class="detail-item bg-indigo-50 border-2 border-indigo-500 rounded-xl p-3">
                    <p class="text-[10px] text-indigo-700 font-extrabold uppercase">Portfolio Value</p>
                    <p class="text-xl font-black text-indigo-900">${p.currentUnitValue}</p>
                </div>` : `
                <div class="detail-item"><p class="text-[10px] uppercase font-bold text-slate-400">Customer ID</p><p class="font-bold">${p.clientId || 'N/A'}</p></div>`
                }
            </div>
            <div class="timeline-container relative pt-10 px-4">
                <div class="absolute -top-2 left-4 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                <div class="timeline-track relative h-12 flex items-center">${timeline}</div>
                <div class="absolute -top-2 right-12 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
