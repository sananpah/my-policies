/* component_sg.js - v7.0.8 - Header Match: Premium/Sum Assured + Policy # in Expanded */
import { autoFmt, toNum, getTimeRemaining } from './utils.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate = new Date(p.commenced);
    const matDate = new Date(p.maturity);
    const startY = commDate.getFullYear();
    const endY = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay = commDate.getDate();

    const mip = (p.mip !== undefined) ? p.mip : 0;
    const ppt = (p.ppt !== undefined) ? p.ppt : 0;
    const isPaidUp = (p.dueDate === "PAID UP");
    
    const thisYearAnniversary = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassedThisYear = TODAY >= thisYearAnniversary;
    let yearsPassed = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnniversary) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    // --- COUNTDOWN LOGIC ---
    let premRemainingStr = "";
    if (isPaidUp) {
        premRemainingStr = "PAID UP";
    } else if (mip === 0) {
        premRemainingStr = "VESTED";
    } else {
        let targetDate = (mip === -1) ? matDate : new Date(startY + mip, commMonth, commDay);
        if (targetDate <= TODAY) {
            premRemainingStr = "VESTED";
        } else {
            let years = targetDate.getFullYear() - TODAY.getFullYear();
            let months = targetDate.getMonth() - TODAY.getMonth();
            if (months < 0) { years--; months += 12; }
            premRemainingStr = `${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;
        }
    }
    const timeLeftDisplay = (premRemainingStr === "VESTED" || premRemainingStr === "PAID UP") ? premRemainingStr : `LEFT: ${premRemainingStr}`;

    // --- CALCULATIONS ---
    const accountValue = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid ? toNum(p.totalPremiumPaid) : (annualPremium * policyYearIdx);
    const totalWithdrawn = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const netInvested = totalPremiumsPaid - totalWithdrawn;

    const chargePct = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    let surrenderValue = (p.surrenderBase === "PREMIUM") 
        ? Math.round(Math.max(0, accountValue - (chargePct / 100 * totalPremiumsPaid)))
        : Math.round(Math.max(0, accountValue * (1 - (chargePct / 100))));

    const lockedDisplay = (accountValue - surrenderValue) <= 0 
        ? `<span class="text-slate-400 text-sm font-bold uppercase tracking-widest">Fully Vested</span>` 
        : `-${autoFmt(accountValue - surrenderValue, sym)}`;

    // --- NOMINEE UI ---
    let nomineeHtml = "";
    if (p.nomineeStatus === "NA") {
        nomineeHtml = `<span class="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">N/A</span>`;
    } else if (!p.nominees || p.nominees.length === 0 || p.nomineeStatus === "EMPTY") {
        nomineeHtml = `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase tracking-widest">Unassigned</span>`;
    } else {
        nomineeHtml = `<div class="flex -space-x-3 items-center">${(p.nominees || []).map(n => `<img src="${n.img}" class="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-20">`).join('')}</div>`;
    }

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;

    // --- STAR TOOLTIP ---
    const targetExitYear = Math.min(endY, startY + ppt + 2);
    const calcProj = (rate) => Math.round((accountValue * Math.pow(1 + rate, Math.max(0, targetExitYear - CURRENT_YEAR))) + (isPaidUp ? 0 : (annualPremium * ((Math.pow(1 + rate, Math.max(0, Math.min(startY + ppt, targetExitYear) - (hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR))) - 1) / rate) * (1 + rate))));
    const starHtml = `<div class="ml-2 relative group flex items-center justify-center w-12 h-10 bg-white rounded-xl shadow-sm border border-slate-200 cursor-help"><span class="text-xl text-amber-500 transition-transform group-hover:scale-125">★</span><div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 right-0 bg-slate-900 text-white p-4 rounded-2xl z-[100] shadow-2xl border border-white/10 pointer-events-none min-w-[180px]"><b class="text-orange-400 uppercase tracking-widest text-[9px] block mb-2 font-black">Projected Maturity*</b><div class="space-y-1"><div class="flex justify-between text-[10px] font-black leading-tight text-white"><span>Est. @4%:</span><span>${autoFmt(calcProj(0.04), sym)}</span></div><div class="flex justify-between text-[10px] font-black leading-tight text-white"><span>Est. @8%:</span><span>${autoFmt(calcProj(0.08), sym)}</span></div></div><div class="mt-2 pt-2 border-t border-white/10 text-[8px] text-slate-400 italic font-medium leading-tight">*Projected until Year ${targetExitYear}.</div><div class="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div></div></div>`;

    // --- TIMELINE ---
    let timelineHtml = '';
    const yearsToMat = endY - startY;
    let maxYears = (yearsToMat <= 25) ? yearsToMat : Math.min(Math.max(15, policyYearIdx + 5), yearsToMat);
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        const isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassedThisYear);
        const colorClass = isPast ? "bg-emerald-900" : (yr === CURRENT_YEAR ? "bg-black ring-2 ring-white z-20 scale-110 shadow-xl" : (polY <= mip ? "bg-indigo-500" : (polY <= ppt ? "bg-pink-400" : "bg-red-600")));
        timelineHtml += `<div class="segment ${colorClass} h-8 flex-1 border-r border-white/10 first:rounded-l-lg last:rounded-r-lg transition-all relative group/segment"></div>`;
    }

    return `
    <div class="policy-card mb-10 rounded-[40px] bg-white overflow-hidden shadow-sm border-2 relative" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="p-8 flex items-center justify-between cursor-pointer relative" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 pl-6 pr-4">
                <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded-[24px] shadow-sm p-3 relative z-20">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div class="relative z-20">
                    <div class="flex items-center gap-4 mb-2">
                        <h3 class="font-black text-3xl text-slate-900 tracking-tight leading-none">${p.name}</h3>
                        <img src="${p.avatarPath || 'avatar_self.png'}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">
                    </div>
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase; display:inline-block;">
                        ${p.type || 'Savings'}
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-10 text-right px-4 relative z-20">
                <div><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Annual Premium</p><p class="text-2xl font-black text-[#059669]">${autoFmt(p.premium, sym)}</p></div>
                <div><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Sum Assured</p><p class="text-2xl font-black text-slate-800">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</p></div>
                
                <div class="bg-white/60 px-6 py-3 rounded-[20px] border border-white/50 flex flex-col justify-center min-w-[125px] h-[64px]">
                    <p class="text-[10px] font-black ${premRemainingStr === 'VESTED' ? 'text-emerald-500' : 'text-indigo-500'} uppercase text-center">${timeLeftDisplay}</p>
                    <div class="h-[1px] bg-slate-200/40 w-full my-1"></div>
                    <p class="text-[9px] font-black text-sky-500 uppercase text-center">Next Due</p>
                    <p class="text-sm font-black text-slate-700 text-center tracking-tight">${new Date(hasPassedThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
            </div>
        </div>

        <div class="content-area px-10 pb-10 pt-2 relative z-20" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm"><p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Policy Number</p><p class="text-[17px] font-bold text-slate-800 tracking-widest" style="font-family:'Orbitron'">${p.id}</p></div>
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm"><p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Valuation</p><p class="text-[19px] font-black text-slate-900 tracking-tighter" style="font-family:'Orbitron'">${autoFmt(accountValue, sym)}</p></div>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm"><p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Invested (Net)</p><p class="text-[17px] font-black text-slate-800 tracking-tight" style="font-family:'Orbitron'">${autoFmt(netInvested, sym)}</p></div>
                <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center shadow-sm"><p class="text-[9px] font-bold text-emerald-600 uppercase mb-1.5">Surrender</p><p class="text-[20px] font-black text-emerald-700" style="font-family:'Orbitron'">${autoFmt(surrenderValue, sym)}</p></div>
                <div class="p-4 rounded-xl bg-red-50/50 border border-red-100 text-center shadow-sm flex flex-col justify-center items-center"><p class="text-[9px] font-bold text-red-400 uppercase mb-1.5">Locked</p><p class="text-[20px] font-black text-red-600 leading-none" style="font-family:'Orbitron'">${lockedDisplay}</p></div>
            </div>

            ${(p.totalPremiumPaid || totalWithdrawn > 0) ? `
            <div class="mb-8 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                <div class="grid grid-cols-3 gap-4">
                    <div class="p-3 rounded-2xl bg-slate-50"><p class="text-[9px] font-bold text-slate-400 uppercase">Paid</p><p class="font-black text-slate-700" style="font-family:'Orbitron'">${autoFmt(totalPremiumsPaid, sym)}</p></div>
                    <div class="p-3 rounded-2xl bg-slate-50"><p class="text-[9px] font-bold text-slate-400 uppercase">Withdrawn</p><p class="font-black text-red-500" style="font-family:'Orbitron'">-${autoFmt(totalWithdrawn, sym)}</p></div>
                    <div class="p-3 rounded-2xl bg-indigo-50 border border-indigo-100"><p class="text-[9px] font-bold text-indigo-400 uppercase">Net Base</p><p class="font-black text-indigo-900" style="font-family:'Orbitron'">${autoFmt(netInvested, sym)}</p></div>
                </div>
            </div>` : ''}

            <div class="mb-6 p-4 bg-white/50 border border-slate-100 rounded-[24px] shadow-sm flex flex-col gap-2">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee(s)</p>
                <div class="flex items-center h-10">${nomineeHtml}</div>
            </div>

            <div class="flex justify-between items-end mb-4 px-2">
                <div><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Commencement</p><p class="text-sm font-bold text-slate-700 underline decoration-sky-300 decoration-2 underline-offset-4">${p.commenced}</p></div>
                <div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase mb-1">Maturity</p><p class="text-sm font-bold text-slate-700 underline decoration-amber-300 decoration-2 underline-offset-4">${p.maturity}</p></div>
            </div>

            <div class="relative flex items-center h-16 bg-slate-100 rounded-[24px] px-2 border border-slate-200/50 shadow-inner">
                <div class="flex-1 flex h-10 items-center gap-1">${timelineHtml}</div>
                ${starHtml}
            </div>
        </div>
    </div>`;
}
