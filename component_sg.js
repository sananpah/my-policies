/* component_sg.js - v6.0.0 - Baseline (Dynamic Timeline & Capital Analysis) */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    
    // --- 1. CORE CALCULATIONS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const displaySumAssured = (toNum(p.sumAssured) === 0) ? accountValue : toNum(p.sumAssured);

    let yearsElapsed = TODAY.getFullYear() - commDate.getFullYear();
    if (TODAY.getMonth() < commDate.getMonth() || 
       (TODAY.getMonth() === commDate.getMonth() && TODAY.getDate() < commDate.getDate())) {
        yearsElapsed--;
    }
    const derivedPremiumsPaid = yearsElapsed + 1;
    const currentInPhase = (TODAY.getFullYear() - startY) + 1;

    // --- WITHDRAWAL & MANUAL BASE LOGIC (For Prudential/Manual Entry) ---
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + b, 0);
    // Use totalPremiumPaid if available (handles holidays), else use derived math
    const totalInvestmentBase = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * derivedPremiumsPaid);
    const netInvestmentBase = totalInvestmentBase - totalWithdrawn;

    let dueYear = TODAY.getFullYear();
    const thisYearAnniversary = new Date(dueYear, commDate.getMonth(), commDate.getDate());
    if (TODAY >= thisYearAnniversary) dueYear++;
    const nextDueDate = new Date(dueYear, commDate.getMonth(), commDate.getDate());
    const dateStr = nextDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- BRAND LOGIC ---
    const isPrudential = p.company.toUpperCase().includes("PRUDENTIAL");
    const isSinglife = p.company.toUpperCase().includes("SINGLIFE");
    const isFlexiBrand = p.company.toUpperCase().includes("MANULIFE") || p.company.toUpperCase().includes("HSBC");
    
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- 2. SURRENDER VALUE MATH ---
    const chargePct = p.surrenderCharges[derivedPremiumsPaid] || 0;
    let surrenderChargeAmount = isFlexiBrand ? totalInvestmentBase * (chargePct / 100) : accountValue * (chargePct / 100);
    const surrenderValue = Math.round(Math.max(0, accountValue - surrenderChargeAmount));
    const lockedValue = Math.round(accountValue - surrenderValue);

    // --- 3. DYNAMIC TIMELINE GENERATION ---
    let timelineHtml = '';
    const maxYears = isPrudential ? 30 : 15; // Exclusive 30-year view for Prudential

    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        const isCurrentDue = (polY === currentInPhase && nextDueDate.getFullYear() === TODAY.getFullYear());
        const isCompleted = (polY < currentInPhase) || (polY === currentInPhase && nextDueDate.getFullYear() > TODAY.getFullYear());
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        
        let colorClass = "";
        let statusLabel = "";

        if (isCurrentDue) {
            colorClass = "bg-black ring-2 ring-white z-20 scale-110 shadow-xl";
            statusLabel = "Premium Due";
        } else if (isCompleted) {
            colorClass = "bg-emerald-900";
            statusLabel = "Completed";
        } 
        else if (isSinglife) {
            if (polY === 3) { colorClass = "bg-indigo-500"; statusLabel = "Locked"; }
            else if (polY >= 4 && polY <= 10) { colorClass = "bg-pink-400"; statusLabel = "Flexi Premium/Locked"; }
            else { colorClass = "bg-red-600"; statusLabel = "Vested"; }
        } 
        else if (isFlexiBrand) {
            if (polY === 5) { colorClass = "bg-indigo-500"; statusLabel = "Locked"; }
            else if (polY >= 6 && polY <= 10) { colorClass = "bg-pink-400"; statusLabel = "Flexi Premium/Locked"; }
            else { colorClass = "bg-red-600"; statusLabel = "Vested"; }
        } 
        else {
            colorClass = chargeAtYear > 0 ? "bg-pink-400" : "bg-red-600";
            statusLabel = chargeAtYear > 0 ? "Locked" : "Vested";
        }

        timelineHtml += `
            <div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/item">
                <div class="opacity-0 group-hover/item:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b>
                    <span class="text-white font-bold tracking-tight">${statusLabel}</span>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            </div>`;
    }

    const starHtml = `
        <div class="ml-2 relative group/star flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help">
            <span class="text-amber-500 text-xl transition-transform group-hover/star:scale-125">★</span>
            <div class="opacity-0 group-hover/star:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-3 rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none transition-all duration-300 min-w-[180px]">
                <b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-1">Maturity</b>
                <span class="text-xs font-black block" style="transform: skewX(-10deg) rotate(-2deg); transform-origin: left;">Unit Value : ${autoFmt(accountValue, sym)}</span>
                <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
            </div>
        </div>`;

    // --- CAPITAL ANALYSIS BLOCK (Conditional for Premium Holidays/Withdrawals) ---
    const capitalAnalysisHtml = p.totalPremiumPaid ? `
        <div class="mb-8 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capital Analysis</h4>
                <span class="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">Manual History Tracked</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div class="p-3 rounded-2xl bg-slate-50">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Actual Paid</p>
                    <p class="font-black text-slate-700">${autoFmt(p.totalPremiumPaid, sym)}</p>
                </div>
                <div class="p-3 rounded-2xl bg-slate-50">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Total Withdrawn</p>
                    <p class="font-black text-red-500">-${autoFmt(totalWithdrawn, sym)}</p>
                </div>
                <div class="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p class="text-[9px] font-bold text-indigo-400 uppercase">Net Base</p>
                    <p class="font-black text-indigo-900">${autoFmt(netInvestmentBase, sym)}</p>
                </div>
            </div>
        </div>
    ` : '';

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 relative" id="card-${p.id}">
        <div class="absolute top-0 left-0 w-2 h-full z-30" style="background: ${brandColor}"></div>

        <div class="p-8 flex items-center justify-between cursor-pointer transition-colors relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 px-4">
                <div class="w-20 h-20 flex items-center justify-center bg-white rounded-[24px] shadow-sm border border-slate-50 p-3">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div>
                    <h3 class="font-black text-3xl text-slate-900 tracking-tight leading-none mb-2">${p.name}</h3>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-widest" style="background: ${brandColor}">${p.company}</span>
                        <span class="font-mono text-xs font-bold text-slate-400">#${p.id}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-10 text-right px-4">
                <div><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Annual Premium</p><p class="text-2xl font-black text-slate-800 tracking-tight">${autoFmt(p.premium, sym)}</p></div>
                <div><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Valuation</p><p class="text-2xl font-black text-slate-900 tracking-tighter">${autoFmt(accountValue, sym)}</p></div>
                <div class="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-[20px] border border-white/50">
                    <p class="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-1 text-center">Next Due</p>
                    <p class="text-lg font-black text-slate-700 tracking-tight">${dateStr}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-10 pb-10 pt-2" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-4 gap-6 mb-8">
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1.5 h-full" style="background: ${brandColor}"></div>
                    <p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Sum Assured</p>
                    <p class="text-2xl font-black text-slate-800">${autoFmt(displaySumAssured, sym)}</p>
                </div>
                <div class="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
                    <p class="text-[10px] font-black text-slate-400 mb-2 uppercase">Total Invested</p>
                    <p class="text-2xl font-black text-slate-800">${autoFmt(totalInvestmentBase, sym)}</p>
                </div>
                <div class="p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm">
                    <p class="text-[10px] font-black text-emerald-600 mb-2 uppercase">Surrender Value</p>
                    <p class="text-3xl font-black text-emerald-700">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm">
                    <p class="text-[10px] font-black text-red-400 mb-2 uppercase">Locked Capital</p>
                    <p class="text-3xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            ${capitalAnalysisHtml}

            <div class="flex justify-between items-end mb-4 px-2">
                <div><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p><p class="text-sm font-bold text-slate-700 underline decoration-2 decoration-sky-300 underline-offset-4">${p.commenced}</p></div>
                <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Maturity Date</p><p class="text-sm font-bold text-slate-700 underline decoration-2 decoration-amber-300 underline-offset-4">${p.maturity}</p></div>
            </div>
            
            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 shadow-inner border border-slate-200/50">
                <div class="flex-1 flex h-10 items-center gap-1 overflow-hidden">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
