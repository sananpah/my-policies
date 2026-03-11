/* INDIA BASELINE ENGINE v3.5.83 (FROZEN)
   Logic: Traditional Life, Pension, and Money-Back Plans
*/

window.renderIndia = function() {
    // Pull data from the global POLICY_DATA object
    const list = POLICY_DATA.india || [];
    const sym = "₹";
    const container = document.getElementById('container');
    container.innerHTML = '';

    list.forEach(p => {
        const startParts = p.commenced.split(' ');
        const startY = parseInt(startParts[2]);
        const anniversaryDay = parseInt(startParts[0]);
        const anniversaryMonth = startParts[1]; 
        
        const matY = parseInt(p.maturity.split(' ')[2]);
        const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
        const isPaidUp = p.dueDate === "PAID UP";
        
        // Anniversary Check for "Paid" Status
        const currentAnniversary = new Date(`${anniversaryMonth} ${anniversaryDay}, ${CURRENT_YEAR}`);
        const hasPassedThisYear = TODAY > currentAnniversary;

        let timelineHtml = '';
        for(let yr = startY; yr < matY; yr++) {
            const polY = yr - startY + 1;
            const isPast = yr < CURRENT_YEAR;
            const isCurrent = yr === CURRENT_YEAR;
            let color = "", phase = "", detail = "";

            if (yr <= premEndYear) {
                // Anniversary-aware Dark Green flip
                const isEffectivelyPaid = isPast || isPaidUp || (isCurrent && hasPassedThisYear);
                
                if (p.name.includes("Fortune Maximiser") && polY >= (p.bonusStartYear || 2)) {
                    color = "bg-hybrid"; phase = "Premium + Bonus";
                    detail = `Prem: ${autoFmt(p.premium, sym)} + Bonus`;
                } else {
                    color = (isCurrent && !hasPassedThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                    phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                    detail = `Amt: ${autoFmt(p.premium, sym)}`;
                }
            } 
            else if (p.name.includes("Nishchit Pension") && polY === 7) {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = "Deferment Year"; detail = "Wealth Locked";
            }
            else {
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

        // Add Maturity Star
        timelineHtml += `<div class="mat-star">★<div class="tooltip"><b class="text-orange-400 uppercase tracking-widest">Maturity</b><br><span class="text-lg font-black">${p.maturityAmt || p.sumAssured}</span></div></div>`;

        container.innerHTML += `
        <div class="policy-card" style="border-left: 16px solid ${p.color}">
            <div class="card-header" onclick="toggleCard('${p.id}')">
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
                        <p class="text-lg font-black text-slate-700">${autoFmt(p.sumAssured, sym)}</p>
                    </div>
                    <div class="text-center border-l-2 border-slate-100 pl-10">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Annual Premium</p>
                        <p class="text-lg font-black ${isPaidUp ? 'text-slate-300 line-through' : 'text-emerald-600'}">${autoFmt(p.premium, sym)}</p>
                    </div>
                </div>
                <div class="w-44 text-center">
                    ${isPaidUp ? '<span class="text-emerald-600 font-black">PAID UP</span>' : `<div class="bg-slate-900 text-white p-2 rounded">${p.dueDate}</div>`}
                </div>
            </div>
            <div class="content-area">
                <div class="timeline-track relative flex items-center h-10 mt-10">
                    ${timelineHtml}
                </div>
            </div>
        </div>`;
    });
};
