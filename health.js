/* health.js - v1.0.0 */
import { autoFmt } from './india.js';

export function createHealthCard(p) {
    const sym = p.currency === "INR" ? "₹" : "$";
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.06)`;

    // Calculate Expiry Countdown
    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    let years = expiryDate.getFullYear() - today.getFullYear();
    let months = expiryDate.getMonth() - today.getMonth();
    if (months < 0) { years--; months += 12; }
    const timeRemaining = `${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;

    return `
    <div class="health-card mb-8 rounded-[40px] bg-white border-2 relative transition-all overflow-hidden" 
         id="health-${p.id}"
         style="border-left: 14px solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="p-8 flex items-center justify-between" style="background: ${brandBg}">
            <div class="flex items-center gap-8">
                <div class="w-20 h-20 bg-white rounded-3xl shadow-sm p-3 flex items-center justify-center border border-slate-100">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[10px] font-black px-3 py-1 rounded-full bg-slate-800 text-white uppercase tracking-wider">${p.owner}</span>
                        <span class="text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-wider" style="background: ${brandColor}">${p.category}</span>
                    </div>
                    <h3 class="font-black text-2xl text-slate-900 leading-none">${p.name}</h3>
                    <p class="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">ID: ${p.id}</p>
                </div>
            </div>

            <div class="flex gap-10 items-center">
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Premium</p>
                    <p class="text-2xl font-black text-slate-800">${autoFmt(p.premium, sym)}</p>
                    <div class="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[9px] font-black mt-1">${p.paymentMode}</div>
                </div>
                
                <div class="bg-white/80 px-6 py-4 rounded-[24px] border border-white/50 text-center min-w-[120px] shadow-sm">
                    <p class="text-[9px] font-black text-emerald-600 uppercase mb-1">Coverage Left</p>
                    <p class="text-lg font-black text-slate-800">${timeRemaining}</p>
                </div>
            </div>
        </div>

        <div class="p-8 bg-white">
            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-4 p-5 rounded-[28px] bg-slate-50 border border-slate-100 flex flex-col justify-center">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-2">Sum Assured / Limit</p>
                    <p class="text-2xl font-black text-slate-800">
                        ${p.sumAssured === 0 || p.sumAssured === "Not Applicable" ? 'Rider Cover' : autoFmt(p.sumAssured, sym)}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">Total Paid: ${autoFmt(p.totalPaid, sym)}</p>
                </div>

                <div class="col-span-8 p-5 rounded-[28px] bg-sky-50 border border-sky-100">
                    <p class="text-[10px] font-black text-sky-600 uppercase mb-3">Coverage & Benefits</p>
                    <div class="flex flex-wrap gap-2">
                        ${p.benefits.map(b => `
                            <span class="text-[11px] font-extrabold text-sky-900 bg-white/80 px-4 py-1.5 rounded-xl shadow-sm border border-sky-200/50">
                                ${b}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="mt-6 flex justify-between items-center pt-6 border-t border-slate-50">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                    <span class="text-[10px] font-black text-slate-400 uppercase">Expires: <span class="text-slate-800 ml-1">${p.expiryDate}</span></span>
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase">
                    Nominee: <span class="text-slate-800 ml-1">${p.nominee}</span>
                </div>
            </div>
        </div>
    </div>`;
}
