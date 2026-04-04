/* component_in.js - v4.1.10 - Global Scope Fix */
import { checkIsDueSoon, autoFmt, toNum, raw, safeParseDate, safeGetYear, monthMap } from './india.js';

// --- THE CRITICAL FIX: Explicit Global Binding ---
window.toggleCard = function(id) {
    console.log("Toggle clicked for ID:", id); // Check your F12 console
    const card = document.getElementById(`card-${id}`);
    if (!card) return;

    const content = card.querySelector('.content-area');
    const isActive = card.classList.contains('active');

    if (!isActive) {
        // CLOSE ALL OTHER CARDS FIRST
        document.querySelectorAll('.policy-card.active').forEach(other => {
            other.classList.remove('active');
            other.querySelector('.content-area').style.maxHeight = "0px";
        });

        // OPEN THIS CARD
        card.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
    } else {
        // CLOSE THIS CARD
        card.classList.remove('active');
        content.style.maxHeight = "0px";
    }
};

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    // 1. DATA PREP
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
    const isPaidUp = p.status === "PAID UP" || (CURRENT_YEAR > premEndYear || (CURRENT_YEAR === premEndYear && hasPassedThisYear));
    const finalDueDate = isPaidUp ? "PAID UP" : `${anniversaryDay} ${anniversaryMonth} ${nextDueYear}`;

    const brandColor = p.color || "#6366f1";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // 2. TIMELINE GENERATOR
    let timelineHtml = '';
    for(let yr = startY; yr < matY; yr++) {
        const polY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isCurrent = yr === CURRENT_YEAR;
        let colorClass = ""; 

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
            colorClass = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
        } else {
            colorClass = isPast ? "bg-history-brown" : "bg-future-light-brown";
        }
        timelineHtml += `<div class="segment ${colorClass}"><div class="tooltip">Year ${polY} (${yr})</div></div>`;
    }

    // 3. HTML STRUCTURE
    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor};">
        <div class="card-header" style="background: ${brandBg};" onclick="window.toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12 object-contain"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color: ${brandColor}; color: ${brandColor}; background: white;">
                        ${p.type || 'Insurance'}
                    </div>
                    <div class="ml-6">
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none">Premium</p>
                    <p class="text-lg font-black text-emerald-600">${autoFmt(p.premium, sym)}</p>
                </div>
            </div>

            <div class="w-40 text-center">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                    <div class="font-black text-[11px] text-slate-900">${finalDueDate}</div>
                </div>
            </div>
        </div>

        <div class="content-area" style="display: block; max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); background: white;">
            <div style="padding: 40px;">
                <div class="detail-grid">
                    <div class="detail-item"><p>Policy Number</p><p>${p.id}</p></div>
                    <div class="detail-item"><p>UIN Number</p><p>${p.uin || 'N/A'}</p></div>
                    <div class="detail-item"><p>Customer ID</p><p>${p.clientId || 'N/A'}</p></div>
                </div>

                <div class="timeline-track" style="margin-top: 40px; margin-bottom: 20px;">
                    <div class="absolute -top-10 left-0 text-[11px] font-black text-slate-400 uppercase">${commStr}</div>
                    ${timelineHtml}
                    <div class="absolute -top-10 right-0 text-[11px] font-black text-slate-400 uppercase">${matStr}</div>
                </div>
            </div>
        </div>
    </div>`;
}
