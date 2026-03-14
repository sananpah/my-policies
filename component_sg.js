/* component_sg.js - v4.1.2 - Tooltip Fix */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    
    // --- 1. CORE CALCULATIONS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const displaySumAssured = (toNum(p.sumAssured) === 0) ? accountValue : toNum(p.sumAssured);

    const calendarYearDiff = TODAY.getFullYear() - startY;
    const currentInPhase = calendarYearDiff + 1;

    const isManulife = p.company.toUpperCase().includes("MANULIFE");
    const premiumsPaidCount = p.premiumsPaid || 3; 
    
    const financialYear = isManulife ? premiumsPaidCount : calendarYearDiff;

    // --- 2. SURRENDER VALUE MATH ---
    const totalPremiumsPaid = annualPremium * premiumsPaidCount; 
    const chargePct = p.surrenderCharges[financialYear] || 0;
    
    let surrenderChargeAmount = isManulife 
        ? totalPremiumsPaid * (chargePct / 100)
        : accountValue * (chargePct / 100);

    const surrenderValue = Math.round(Math.max(0, accountValue - surrenderChargeAmount));
    const lockedValue = Math.round(accountValue - surrenderValue);

    // --- 3. BRANDING ---
    const brandColor = isManulife ? "#00a758" : "#d31145";
    const brandBg = isManulife ? "rgba(0, 167, 88, 0.03)" : "rgba(211, 17, 69, 0.03)";

    // --- 4. TIMELINE GENERATION (Fixed Tooltip Labels) ---
    let timelineHtml = '';
    for(let polY = 1; polY <= 15; polY++) {
        const yr = startY + polY - 1;
        const isCurrent = (polY === currentInPhase);
        const isPast = (polY < currentInPhase);
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        
        let colorClass = "";
        let statusLabel = "";

        if (isCurrent) {
            colorClass = "bg-black ring-2 ring-white z-20 scale-110 shadow-xl";
            statusLabel = "Current Active Year";
        } else if (isPast) {
            colorClass = "bg-emerald-900";
            statusLabel = "Year Completed";
        } else if (chargeAtYear > 0) {
            colorClass = "bg-pink-400";
            statusLabel = "Locked Phase"; // Pink Bar
        } else {
            colorClass = "bg-red-600";
            statusLabel = "Vested / Liquid"; // Red Bar
        }

        timelineHtml += `
            <div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/item">
                <div class="opacity-0 group-hover/item:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase tracking-widest block mb-1 font-black">Year ${polY} (${yr})</b>
                    <span class="text-white font-bold">${statusLabel}</span>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            </div>`;
    }

    const starHtml = `
        <div class="ml-2 relative group/star flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help">
            <span class="text-amber-500 text-xl transition-transform group-hover/star:scale-125">★</span>
            <div class="opacity-0 group-hover/star:opacity-100 absolute bottom-full mb-3 right-0 bg-slate-900 text-white p-3 rounded-xl z-[100] shadow-2xl border border-white/10 pointer-events-none transition-all duration-200 min-w-[120px]">
                <b class="text-amber-400 uppercase tracking-widest block text-[9px] mb-1">Maturity</b>
                <span class="text-xs font-black">100% Fund Value</span>
                <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
            </div>
        </div>`;

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100" id="card-${p.id}">
        <div class="p-8 flex items-center justify-between cursor-pointer" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8">
                <div class="relative">
                    <div class="w-20 h-20 flex items-center justify-center bg-white rounded-[24px] shadow-sm border border-slate-50 p-3">
                        <img src="${p.logo}" class="max-h-full object-contain">
                    </div>
                    <div class="absolute -bottom-2 -right-2 px-3 py-1 bg-black text-white text-[9px] font-black rounded-full tracking-tighter uppercase">SG</div>
                </div>
                <div>
                    <h3 class="font-black text-3xl text-slate-900 tracking-tight leading-none mb-2">${p.name}</h3>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-widest" style="background: ${brandColor}">${p.company}</span>
                        <span class="font-mono text-xs font-bold text-slate-400">#${p.id}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Market Valuation</p>
                <p class="text-4xl font-black text-slate-900 tracking-tighter">${autoFmt(accountValue, sym)}</p>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-2" style="background: linear-gradient(to bottom, #ffffff, ${brandBg})">
            <div class="grid grid-cols-4 gap-6 mb-12">
                <div class="relative p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm overflow-hidden">
                    <div class="absolute top-0 left-0 w-1.5 h-full" style="background: ${brandColor}"></div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sum Assured</p>
                    <p class="text-2xl font-black text-slate-800 tracking-tight">${autoFmt(displaySumAssured, sym)}</p>
                </div>
                <div class="relative p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm overflow-hidden">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Premium</p>
                    <p class="text-2xl font-black text-slate-800 tracking-tight">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="relative p-6 rounded-[32px] bg-emerald-50 border border-emerald-100 shadow-sm overflow-hidden">
                    <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Surrender Value</p>
                    <p class="text-3xl font-black text-emerald-700 tracking-tight">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="relative p-6 rounded-[32px] bg-red-50 border border-red-100 shadow-sm overflow-hidden">
                    <p class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Locked Capital</p>
                    <p class="text-3xl font-black text-red-600 tracking-tight">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commencement</p>
                    <p class="text-sm font-bold text-slate-700 underline decoration-2 decoration-sky-300 underline-offset-4">${p.commenced}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maturity Date</p>
                    <p class="text-sm font-bold text-slate-700 underline decoration-2 decoration-amber-300 underline-offset-4">${p.maturity}</p>
                </div>
            </div>

            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 shadow-inner border border-slate-200/50">
                <div class="flex-1 flex h-10 items-center gap-1">
                    ${timelineHtml}
                </div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
