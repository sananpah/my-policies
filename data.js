<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nami Portfolio v3.5.30</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Inter:wght@400;700;900&display=swap');
        
        body { background-color: #f8fafc; font-family: 'Inter', sans-serif; padding: 40px; }
        .brand-header { font-family: 'Orbitron', sans-serif; background: linear-gradient(90deg, #6366f1, #ec4899, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3.5rem; font-weight: 900; text-transform: uppercase; }
        .build-tag { position: absolute; top: 40px; right: 40px; font-family: 'Orbitron', sans-serif; background: #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; color: #64748b; }

        @keyframes alert-glow { 0% { box-shadow: 0 0 5px #dc2626; background: #dc2626; } 50% { box-shadow: 0 0 20px #ef4444; background: #b91c1c; } 100% { box-shadow: 0 0 5px #dc2626; background: #dc2626; } }
        .due-blink { animation: alert-glow 1.5s infinite ease-in-out !important; }

        /* Neon Badge System */
        .badge-container { display: flex; align-items: center; width: 240px; margin-left: -45px; } 
        .badge-base {
            font-family: 'Orbitron', sans-serif; font-size: 8px; font-weight: 900; letter-spacing: 1px;
            padding: 5px 12px; border-radius: 8px; text-transform: uppercase; position: relative;
            overflow: hidden; display: inline-flex; align-items: center; justify-content: center;
            color: white; min-width: 95px; transition: 0.3s;
        }
        .badge-saving { background: linear-gradient(135deg, #00ff88, #00ad5f); box-shadow: 0 0 12px rgba(0, 255, 136, 0.3); }
        .badge-retirement { background: linear-gradient(135deg, #ffcc00, #ff8800); box-shadow: 0 0 12px rgba(255, 204, 0, 0.3); }
        .badge-ulip { background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 0 12px rgba(99, 102, 241, 0.3); }
        .badge-ilp, .badge-investmentlinked { background: linear-gradient(135deg, #ff0077, #aa0055); box-shadow: 0 0 12px rgba(255, 0, 119, 0.3); }

        /* Timeline Styling */
        .bg-prem-past { background: #064e3b; } 
        .bg-prem-future { background: #10b981; } 
        .bg-wait-past { background: #451a03; } 
        .bg-wait-future { background: #f59e0b; }
        /* Hybrid Logic: Green top (Premium) to Amber bottom (Bonus) */
        .bg-hybrid { background: linear-gradient(to bottom, #10b981, #f59e0b); border: 1px solid rgba(255,255,255,0.3); }
        .bg-current { background: #22c55e; box-shadow: 0 0 15px rgba(34,229,94,0.6); border: 2px solid white; z-index: 10; }
        
        .policy-card { background: white; border-radius: 24px; border-left: 16px solid; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .card-header { cursor: pointer; display: flex; align-items: center; padding: 25px 35px; }
        .content-area { display: none; padding: 30px; border-top: 1px solid #f1f5f9; background: #fafbfc; border-radius: 0 0 24px 0; }
        .open .content-area { display: block; }

        .timeline-track { position: relative; height: 36px; background: #e2e8f0; border-radius: 18px; display: flex; padding: 0 4px; align-items: center; margin-top: 30px; }
        .segment { height: 28px; flex: 1; margin: 0 1px; border-radius: 3px; position: relative; transition: 0.2s; }
        .segment:hover { transform: scaleY(1.3); z-index: 40; cursor: help; }

        .mat-node { position: absolute; right: -12px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; background: #0f172a; border-radius: 50%; border: 3px solid white; z-index: 60; display: flex; align-items: center; justify-content: center; cursor: help; pointer-events: auto; }
        .mat-node:hover { transform: translateY(-50%) scale(1.2); }

        .tooltip { visibility: hidden; opacity: 0; position: absolute; bottom: 140%; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; padding: 8px; border-radius: 6px; width: 180px; text-align: center; z-index: 100; font-size: 10px; transition: 0.2s; pointer-events: none; }
        .segment:hover .tooltip, .mat-node:hover .tooltip { visibility: visible; opacity: 1; }
        .paid-logo { width: 100px; filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.8)); transform: rotate(-5deg); }
    </style>
</head>
<body>

    <div class="build-tag">BUILD v3.5.30</div>

    <div class="max-w-7xl mx-auto mb-8">
        <h1 class="brand-header">Nami Portfolio</h1>
        <div id="summary-bar" class="grid grid-cols-3 gap-4 mt-6 bg-slate-900 p-6 rounded-[24px] text-white shadow-xl">
            <div class="border-r border-slate-700 text-center"><p class="text-[9px] uppercase font-bold text-slate-400">Total Sum Assured</p><p id="total-sa" class="text-3xl font-black text-emerald-400">₹0</p></div>
            <div class="border-r border-slate-700 text-center"><p class="text-[9px] uppercase font-bold text-slate-400">Annual Commitment</p><p id="total-premium" class="text-3xl font-black text-indigo-400">₹0</p></div>
            <div class="text-center"><p class="text-[9px] uppercase font-bold text-slate-400">Due Soon</p><p id="due-count" class="text-3xl font-black text-orange-400">0</p></div>
        </div>
        <div class="flex gap-2 mt-6">
            <button onclick="render('india')" id="btn-india" class="px-6 py-2 rounded-xl font-bold bg-slate-900 text-white shadow-lg">INDIA</button>
            <button onclick="render('wife')" id="btn-wife" class="px-6 py-2 rounded-xl font-bold bg-white text-slate-400 border">WIFE</button>
            <button onclick="render('singapore')" id="btn-singapore" class="px-6 py-2 rounded-xl font-bold bg-white text-slate-400 border">SINGAPORE</button>
        </div>
    </div>

    <div id="container" class="max-w-7xl mx-auto"></div>

    <script type="module">
        import { POLICY_DATA } from './data.js';
        const TODAY = new Date('2026-03-08');

        window.toggleCard = (id) => document.getElementById(`card-${id}`).classList.toggle('open');

        function getBadgeClass(type) {
            if (!type) return 'badge-fallback';
            const slug = type.toLowerCase().replace(/\s+/g, '');
            const validTypes = ['saving', 'retirement', 'ulip', 'ilp', 'investmentlinked'];
            return validTypes.includes(slug) ? `badge-${slug}` : 'badge-fallback';
        }

        function checkIsDueSoon(dueDateStr) {
            if (!dueDateStr || dueDateStr === "PAID UP") return false;
            const parts = dueDateStr.split(' ');
            if (parts.length < 2) return false;
            const due = new Date(`${parts[1]} ${parts[0]}, 2026`);
            const diff = (due - TODAY) / 86400000;
            return diff >= 0 && diff <= 30;
        }

        window.render = function(cat) {
            const list = POLICY_DATA[cat];
            const sym = list[0]?.currency || "₹";
            updateSummary(list, sym);

            document.getElementById('container').innerHTML = list.map(p => {
                const parts = p.commenced.split(' ');
                const anniversary = new Date(`${parts[1]} ${parts[0]}, 2026`);
                const isAnniversaryPassed = TODAY >= anniversary;
                const startY = parseInt(parts[2]);
                const matY = parseInt(p.maturity.split(' ')[2]);
                const premEndYear = parseInt(p.premiumEnds.split(' ')[2]);
                const isDueSoon = checkIsDueSoon(p.dueDate);
                
                let timelineHtml = '';
                for(let yr = startY; yr < matY; yr++) {
                    const polY = yr - startY + 1;
                    let color = "", phase = "", detail = "";
                    const isFortune = p.name.includes("Fortune Maximiser");
                    const isPension = p.name.includes("Nishchit Pension SL");

                    // Fortune Maximiser Hybrid Logic (Year 2 to Premium End)
                    if (isFortune && polY >= 2 && yr <= premEndYear) {
                        color = "bg-hybrid"; 
                        phase = "Hybrid: Premium + Bonus"; 
                        detail = `Annual Bonus Applied + Premium: ${sym}${p.premium.toLocaleString()}`;
                    } 
                    // Fortune Maximiser Post-Premium Bonus
                    else if (isFortune && yr > premEndYear) {
                        color = yr < 2026 ? "bg-wait-past" : "bg-wait-future";
                        phase = "Annual Bonus Phase";
                        detail = "Annual Cash Bonus Payout";
                    }
                    else if (isPension && polY === 7) {
                        color = yr < 2026 ? "bg-wait-past" : "bg-wait-future";
                        phase = "Deferment Period"; detail = "Policy Gap Year";
                    }
                    else if (yr <= premEndYear && !(isPension && polY >= 8)) {
                        const isDone = yr < 2026 || (yr === 2026 && isAnniversaryPassed) || p.dueDate === "PAID UP";
                        color = isDone ? "bg-prem-past" : (yr === 2026 ? "bg-current" : "bg-prem-future");
                        phase = "Premium Phase";
                        detail = isDone ? "Payment Completed" : `Premium: ${sym}${p.premium.toLocaleString()}`;
                    } else {
                        color = yr < 2026 ? "bg-wait-past" : "bg-wait-future";
                        let payoutAmt = p.annualPayout || (p.payoutSchedule && p.payoutSchedule[polY]);
                        phase = payoutAmt ? "Income Phase" : "Growth Phase";
                        detail = payoutAmt ? `Annual Payout: ${sym}${payoutAmt.toLocaleString()}` : "Wealth Accumulation";
                    }
                    timelineHtml += `<div class="segment ${color}"><div class="tooltip"><b>${phase}</b><br><span class="text-orange-400">${detail}</span><br>Year ${polY} (${yr})</div></div>`;
                }

                return `
                <div class="policy-card" id="card-${p.id}" style="border-color: ${p.color}">
                    <div class="card-header" onclick="toggleCard('${p.id}')">
                        <div class="w-20"><img src="${p.logo}" class="max-h-8"></div>
                        <div class="flex-1 ml-4"><h3 class="font-black text-slate-800 text-lg tracking-tight">${p.name}</h3></div>
                        <div class="flex gap-4 items-center justify-center flex-1">
                            <div class="badge-container">
                                <div class="badge-base ${getBadgeClass(p.type)}">
                                    ${p.type}
                                    <div class="type-shimmer"></div>
                                </div>
                                <div class="text-center ml-4">
                                    <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sum Assured</p>
                                    <p class="text-sm font-black text-slate-700">${sym}${p.sumAssured.toLocaleString()}</p>
                                </div>
                            </div>
                            <div class="text-center border-l border-r border-slate-100 px-10">
                                <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Premium</p>
                                <p class="text-sm font-black text-emerald-600">${sym}${p.premium.toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="w-40 flex flex-col items-center">
                            ${(p.dueDate === "PAID UP" || (isAnniversaryPassed && premEndYear <= 2026)) ? `<img src="paid.jpg" class="paid-logo">` : 
                            `<p class="text-[8px] font-black text-slate-400 uppercase mb-1">Due Date</p>
                             <div class="px-4 py-1.5 rounded-lg font-black text-[10px] text-center w-full ${isDueSoon ? 'due-blink text-white' : 'bg-slate-900 text-white'}">${p.dueDate}</div>`}
                        </div>
                    </div>
                    <div class="content-area">
                        <div class="timeline-track">
                            <div class="absolute -top-7 left-0 text-[10px] font-black text-slate-400 uppercase">${p.commenced}</div>
                            ${timelineHtml}
                            <div class="mat-node">
                                <span class="text-white text-[12px]">★</span>
                                <div class="tooltip">
                                    <b class="text-emerald-400 uppercase">Maturity Event</b><br>
                                    ${p.maturity}<br>
                                    <span class="text-lg font-black">${p.maturityAmt || 'End of Term'}</span>
                                </div>
                            </div>
                            <div class="absolute -top-7 right-0 text-[10px] font-black text-slate-400 uppercase">${p.maturity}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        function updateSummary(list, sym) {
            const totalSA = list.reduce((acc, p) => acc + (p.sumAssured || 0), 0);
            const totalAnnual = list.reduce((acc, p) => acc + (p.dueDate !== "PAID UP" ? p.premium : 0), 0);
            const dueCount = list.filter(p => checkIsDueSoon(p.dueDate)).length;
            document.getElementById('total-sa').innerText = `${sym}${totalSA.toLocaleString()}`;
            document.getElementById('total-premium').innerText = `${sym}${totalAnnual.toLocaleString()}`;
            document.getElementById('due-count').innerText = dueCount;
        }
        render('india');
    </script>
</body>
</html>
