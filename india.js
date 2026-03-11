/* INDIA BASELINE ENGINE v3.5.87 (FIXED & RECONNECTED)
   Logic: Traditional Life, Pension, and Anniversary-aware Timeline
*/

window.renderIndia = function() {
    const list = window.POLICY_DATA.india || [];
    const sym = "₹";
    const container = document.getElementById('container');
    container.innerHTML = ''; // Clear container

    // Reset Summary Bar for India
    const tSA = list.reduce((acc, p) => acc + (parseInt(String(p.sumAssured).replace(/[₹$,\s]/g, "")) || 0), 0);
    const tAnn = list.reduce((acc, p) => acc + (p.dueDate !== "PAID UP" ? (parseInt(String(p.premium).replace(/[₹$,\s]/g, "")) || 0) : 0), 0);
    
    document.getElementById('total-sa').innerText = sym + tSA.toLocaleString();
    document.getElementById('total-premium').innerText = sym + tAnn.toLocaleString();
    document.getElementById('label-sa').innerText = "Total Sum Assured";

    list.forEach(p => {
        const startParts = p.commenced.split(' ');
        const startY = parseInt(startParts[2]);
        const anniversaryDay = parseInt(startParts[0]);
        const anniversaryMonth = startParts[1]; 
        
        const matY = parseInt(p.maturity.split(' ')[2]);
        const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
        const isPaidUp = p.dueDate === "PAID UP";
        
        // Anniversary Check using Global TODAY and CURRENT_YEAR
        const currentAnniversary = new Date(`${anniversaryMonth} ${anniversaryDay}, ${window.CURRENT_YEAR}`);
        const hasPassedThisYear = window.TODAY > currentAnniversary;

        let timelineHtml = '';
        for(let yr = startY; yr < matY; yr++) {
            const polY = yr - startY + 1;
            const isPast = yr < window.CURRENT_YEAR;
            const isCurrent = yr === window.CURRENT_YEAR;
            let color = "", phase = "", detail = "";

            if (yr <= premEndYear) {
                // Anniversary-aware logic
                const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
                
                if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                    color = "bg-hybrid"; phase = "Premium + Bonus";
                    detail = `Prem: ${window.autoFmt(p.premium, sym)} + Bonus`;
                } else {
                    // Logic: Dark Green if passed, Glow if current/upcoming
                    color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                    phase = isEffectivelyPaid ? "Premium Paid" : "Premium Due";
                    detail = `Amt: ${window.autoFmt(p.premium, sym)}`;
                }
            } 
            else if (p.name.includes("Nishchit Pension") && polY === 7) {
                color = isPast ? "bg-slate-700" : "bg-slate-500"; // Deferment
                phase = "Deferment Year"; detail = "Wealth Locked";
            }
            else {
                const payout = (p.payoutSchedule && p.payoutSchedule[polY]) || p.annualPayout;
                if (payout) {
                    color = isPast ? "bg-blue-800" : "bg-blue-400";
                    phase = isPast ? "Payout Received" : "Income Phase";
                    detail = `Payout: ${window.autoFmt(payout, sym)}`;
                } else {
                    color = isPast ? "bg-slate-300" : "bg-slate-200";
                    phase = "Growth Phase";
                    detail = "Accumulating Value";
                }
            }
            timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b class="text-emerald-400 uppercase tracking-tighter">${phase}</b><br>${detail}<br><span class="opacity-40 text-[9px]">Year ${polY} (${yr})</span></div></div>`;
        }

        container.innerHTML += `
        <div class="policy-card" id="card-${p.id}" style="border-color: ${p.color}">
            <div class="card-header" onclick="window.toggleCard('${p.id}')">
                <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
                <div class="flex-1 ml-10">
                    <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center">
                        ${p.name}
                        ${p.isWife ? '<span class="family-marker">Wife</span>' : ''}
                        ${p.isDaughter ? '<span class="family-marker">Daughter</span>' : ''}
                    </h3>
                </div>
                <div class="flex gap-12 items-center mr-10">
                    <div class="text-center">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Sum Assured</p>
                        <p class="text-lg font-black text-slate-700">${window.autoFmt(p.sumAssured, sym)}</p>
                    </div>
                    <div class="text-center border-l-2 border-slate-100 pl-10">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                        <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${window.autoFmt(p.premium, sym)}</p>
                    </div>
                </div>
                <div class="w-44 text-center">
                    ${isPaidUp ? '<span class="text-emerald-600 font-black">PAID UP</span>' : `<div class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">${p.dueDate}</div>`}
                </div>
            </div>
            <div class="content-area">
                <div class="timeline-track relative flex items-center h-10 mt-4">
                    <div class="absolute -top-8 left-0 text-[10px] font-bold text-slate-400 uppercase">${p.commenced}</div>
                    ${timelineHtml}
                    <div class="absolute -top-8 right-0 text-[10px] font-bold text-slate-400 uppercase">${p.maturity}</div>
                </div>
            </div>
        </div>`;
    });
};
