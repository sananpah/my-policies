/* component_sg.js - Updated Color Scheme & Logic */
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const startY = commDate.getFullYear();
    
    // --- 1. CORE CALCULATIONS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    
    // Fallback Sum Assured logic
    const displaySumAssured = (toNum(p.sumAssured) === 0) ? accountValue : toNum(p.sumAssured);

    // Determine Policy Year
    let chargeYear = TODAY.getFullYear() - startY;
    const anniversaryThisYear = new Date(TODAY.getFullYear(), commDate.getMonth(), commDate.getDate());
    if (TODAY >= anniversaryThisYear) chargeYear++;
    
    const totalPremiumsPaid = annualPremium * 3; 

    // --- 2. SURRENDER LOGIC BY COMPANY ---
    const chargePct = p.surrenderCharges[chargeYear] || 0;
    let surrenderChargeAmount = 0;

    if (p.company.toUpperCase().includes("MANULIFE")) {
        surrenderChargeAmount = totalPremiumsPaid * (chargePct / 100);
    } else {
        surrenderChargeAmount = accountValue * (chargePct / 100);
    }

    const surrenderValue = Math.round(Math.max(0, accountValue - surrenderChargeAmount));
    const lockedValue = Math.round(accountValue - surrenderValue);
    const displayYear = chargeYear; 

    // --- 3. BRANDING ---
    const isManulife = p.company.toUpperCase().includes("MANULIFE");
    const brandColor = isManulife ? "#00a758" : "#d31145";
    const shadowStyle = isManulife 
        ? "0 20px 25px -5px rgba(0, 167, 88, 0.25)" 
        : "0 20px 25px -5px rgba(211, 17, 69, 0.15)";

    // --- 4. TIMELINE GENERATION (New Color Scheme) ---
    let timelineHtml = '';
    const totalSegments = 15;
    for(let polY = 1; polY <= totalSegments; polY++) {
        const yr = startY + polY - 1;
        const isCurrent = (polY === displayYear);
        const isPast = (polY < displayYear);
        const chargeAtYear = p.surrenderCharges[polY] || 0;
        
        // APPLY USER PREFERENCES
        let colorClass = "";
        if (isCurrent) {
            colorClass = "bg-black ring-2 ring-white z-10 shadow-lg"; // Current Year: Black with White Border
        } else if (isPast) {
            colorClass = "bg-emerald-900"; // Past Years: Dark Green
        } else if (chargeAtYear === 0) {
            colorClass = "bg-red-600"; // Vested: Red
        } else {
            colorClass = "bg-pink-400"; // Future Locked: Pink
        }

        timelineHtml += `
            <div class="segment ${colorClass} relative group h-8 flex-1 border-r border-white/10 first:rounded-l-lg transition-all">
                <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-[10px] z-[100] whitespace-nowrap pointer-events-none shadow-2xl transition-all duration-200">
                    <b class="text-sky-400 uppercase">YR ${polY} (${yr})</b><br>
                    <span class="text-slate-300">${isCurrent ? 'Current' : (chargeAtYear > 0 ? 'Locked' : 'Vested')}</span>
                </div>
            </div>`;
    }

    const starHtml = `
        <div class="mat-star relative group flex items-center justify-center px-4 h-8 border-l border-slate-300 ml-1">
            <span class="text-amber-500 text-lg cursor-help transition-transform group-hover:scale-125">★</span>
        </div>`;

    return `
    <div class="policy-card mb-8 rounded-[32px] bg-white overflow-hidden transition-all duration-300" 
         style="border-top: 8px solid ${brandColor}; box-shadow: ${shadowStyle};" 
         id="card-${p.id}">
        
        <div class="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50/50" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-6">
                <div class="w-16 h-16 flex items-center justify-center bg-white rounded-2xl border border-slate-100">
                    <img src="${p.logo}" class="max-h-12 object-contain">
                </div>
                <div>
                    <h3 class="font-black text-2xl text-slate-800 tracking-tighter">${p.name}</h3>
                    <p class="text-[10px] font-bold uppercase tracking-widest" style="color: ${brandColor}">${p.company}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Market Value</p>
                <p class="text-3xl font-black text-slate-900">${autoFmt(accountValue, sym)}</p>
            </div>
        </div>

        <div class="content-area px-8 pb-10 pt-4 bg-slate-50 border-t">
            <div class="grid grid-cols-4 gap-4 mb-10">
                <div class="bg-slate-900 p-5 rounded-[24px] text-center shadow-lg">
                    <p class="text-[9px] font-bold text-slate-500 uppercase mb-1">Sum Assured</p>
                    <p class="text-sm font-black text-white">${autoFmt(displaySumAssured, sym)}</p>
                </div>
                <div class="bg-slate-900 p-5 rounded-[24px] text-center shadow-lg">
                    <p class="text-[9px] font-bold text-slate-500 uppercase mb-1">Annual Premium</p>
                    <p class="text-sm font-black text-sky-400">${autoFmt(p.premium, sym)}</p>
                </div>
                <div class="bg-emerald-600 p-5 rounded-[24px] shadow-lg text-center">
                    <p class="text-[9px] font-bold text-emerald-100 uppercase mb-1">Surrender Value</p>
                    <p class="text-2xl font-black text-white">${autoFmt(surrenderValue, sym)}</p>
                </div>
                <div class="bg-white p-5 rounded-[24px] border border-red-100 text-center shadow-sm">
                    <p class="text-[9px] font-bold text-red-400 uppercase mb-1">Locked Value</p>
                    <p class="text-2xl font-black text-red-600">-${autoFmt(lockedValue, sym)}</p>
                </div>
            </div>

            <div class="flex justify-between items-center mb-2 px-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>Start: ${p.commenced}</span>
                <span>End: ${p.maturity}</span>
            </div>

            <div class="relative flex items-center h-12 bg-slate-200 rounded-xl px-1 shadow-inner">
                <div class="flex-1 flex h-8 items-center overflow-visible">
                    ${timelineHtml}
                    <div class="flex-[0.3] h-8 bg-transparent"></div>
                </div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
