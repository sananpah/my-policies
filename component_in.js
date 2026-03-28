/* component_in.js */
import { checkIsDueSoon, autoFmt, toNum, raw } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const displayName = p.name || "Unnamed Policy";
    const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };

    // Date helper
    const getParts = (str) => {
        const parts = (str || "01 Jan 2000").split(' ');
        return { d: parseInt(parts[0]), m: parts[1], mNum: monthMap[parts[1]] || 0, y: parseInt(parts[2]) };
    };

    const start = getParts(p.commenced);
    const mat = getParts(p.maturity);
    const premEnd = getParts(p.premiumEnds);

    const hasPassed = (TODAY.getMonth() > start.mNum) || (TODAY.getMonth() === start.mNum && TODAY.getDate() >= start.d);
    const isTermOver = CURRENT_YEAR > premEnd.y || (CURRENT_YEAR === premEnd.y && hasPassed);
    const isPaidUp = p.status === "PAID UP" || isTermOver;

    const brandColor = p.color || "#962524";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3),16)},${parseInt(brandColor.slice(3,5),16)},${parseInt(brandColor.slice(5,7),16)},0.04)`;

    let timelineHtml = '';
    for(let yr = start.y; yr <= mat.y; yr++) {
        const polY = yr - start.y + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let color = "bg-prem-future", phase = "Future", detail = "";

        if (yr <= premEnd.y) {
            const effectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassed);
            color = (isCurrent && !hasPassed && !isPaidUp) ? "bg-current" : (effectivelyPaid ? "bg-prem-past" : "bg-prem-future");
            phase = effectivelyPaid ? "Premium Paid" : "Payment Due";
            detail = `Amt: ${autoFmt(p.premium, sym)}`;
        } else {
            color = isPast ? "bg-payout-past" : "bg-payout-future";
            phase = "Growth/Income";
            detail = "Accumulating";
        }
        timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b>${phase}</b><br>${detail}<br>Year ${polY} (${yr})</div></div>`;
    }

    return `
    <div class="policy-card mb-6" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg}; display:flex; align-items:center; padding:15px;" onclick="this.parentElement.classList.toggle('active')">
            <div class="w-32"><img src="${p.logo}" class="max-h-12" onerror="this.src='image_4e0b3d.png'"></div>
            <div class="flex-1 ml-6">
                <h3 class="font-black text-slate-800 text-xl">${displayName}</h3>
                <p class="text-xs text-slate-400">${p.company}</p>
            </div>
            <div class="text-right mr-6">
                <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                <p class="text-lg font-black">${autoFmt(p.sumAssured, sym)}</p>
            </div>
            <div class="w-32 text-center">
                <p class="text-[9px] font-bold text-slate-400 uppercase">Premium</p>
                <p class="text-lg font-black text-emerald-600">${isPaidUp ? 'PAID' : autoFmt(p.premium, sym)}</p>
            </div>
        </div>
        <div class="content-area p-6" style="background:white">
            <div class="timeline-track" style="display:flex; height:20px; background:#eee; position:relative; margin-top:40px;">
                <div style="position:absolute; top:-25px; left:0; font-size:10px; font-weight:bold;">${p.commenced}</div>
                ${timelineHtml}
                <div style="position:absolute; top:-25px; right:0; font-size:10px; font-weight:bold;">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
