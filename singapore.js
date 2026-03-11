/* singapore.js - The ILP Engine */

window.renderSingapore = function() {
    const list = POLICY_DATA.singapore || [];
    const container = document.getElementById('container');
    container.innerHTML = ''; 

    list.forEach(p => {
        if (p.type === "ILP") {
            const startYear = parseInt(p.commenced.split(' ')[2]);
            let timelineHtml = '';

            for(let i = 0; i < 15; i++) {
                const year = startYear + i;
                const polY = i + 1;
                const isPast = year < 2026; 
                const isCurrent = year === 2026;
                
                const wBonus = (p.welcomeBonus && p.welcomeBonus[polY]) || 0;
                const sBonus = (p.specialBonus && p.specialBonus[polY]) || 0;
                const charge = (p.surrenderCharges && p.surrenderCharges[polY] !== undefined) 
                               ? p.surrenderCharges[polY] 
                               : 0;

                let colorClass = isCurrent ? "bg-red-600 shadow-lg scale-110 z-10" : (isPast ? "bg-slate-400" : "bg-red-300");

                timelineHtml += `
                    <div class="segment ${colorClass} flex-1 h-8 rounded-sm relative group cursor-help">
                        <div class="tooltip opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded w-32 text-center transition-all pointer-events-none">
                            <b class="text-red-300 uppercase">Year ${polY} (${year})</b><br>
                            Total Bonus: ${wBonus + sBonus}%<br>
                            Exit Charge: ${charge}%
                        </div>
                    </div>`;
            }

            container.innerHTML += `
                <div class="policy-card bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border-l-[16px]" style="border-color: ${p.color}">
                    <div class="p-8 flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-black text-slate-800">${p.name}</h3>
                            <div class="flex gap-2 mt-1">
                                <span class="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500 uppercase">${p.company}</span>
                                <span class="text-[10px] bg-red-600 px-2 py-1 rounded font-bold text-white uppercase">${p.type}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-slate-400 uppercase">Annual Premium</p>
                            <p class="text-3xl font-black text-red-600">${p.currency}${p.premium.toLocaleString()}</p>
                        </div>
                    </div>

                    <div class="px-8 pb-8">
                        <div class="grid grid-cols-3 gap-4 mb-8">
                            <div class="bg-slate-50 p-4 rounded-2xl">
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Policy Number</p>
                                <p class="text-sm font-bold text-slate-700">${p.id}</p>
                            </div>
                            <div class="bg-slate-50 p-4 rounded-2xl">
                                <p class="text-[9px] font-bold text-slate-400 uppercase">ILP Death Benefit</p>
                                <p class="text-[10px] font-bold text-emerald-600 uppercase">Higher of Premium or Value</p>
                            </div>
                            <div class="bg-slate-50 p-4 rounded-2xl">
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Minimum Investment Period</p>
                                <p class="text-sm font-bold text-red-700">10 Years</p>
                            </div>
                        </div>

                        

                        <div class="relative pt-6">
                            <div class="flex gap-1 items-end h-10">
                                ${timelineHtml}
                            </div>
                            <div class="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                                <span>Commenced ${startYear}</span>
                                <span>Exit Charges end Yr 11</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    });
    
    // Summary logic for Singapore
    const totalPrem = list.reduce((sum, pol) => sum + pol.premium, 0);
    document.getElementById('total-sa').innerText = "Market Value";
    document.getElementById('total-premium').innerText = "$" + totalPrem.toLocaleString();
};
