/* health.js - v1.4.3 - Integrated Baseline with Next Due */
import { autoFmt } from './india.js';

/**
 * Calculates the next policy anniversary based on the expiry date.
 * Does not modify existing date logic.
 */
function getNextDue(expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    
    // Anniversary is the same Day/Month as Expiry
    let nextDue = new Date(today.getFullYear(), expiry.getMonth(), expiry.getDate());
    
    // If the anniversary already happened this year, the next one is next year
    if (nextDue < today) {
        nextDue.setFullYear(today.getFullYear() + 1);
    }
    
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return nextDue.toLocaleDateString('en-GB', options).toUpperCase();
}

function getOwnerIcon(owner) {
    const name = owner.toLowerCase();
    if (name === 'father') return `<span class="material-symbols-outlined text-lg">man</span>`;
    if (name === 'mother') return `<span class="material-symbols-outlined text-lg">woman</span>`;
    if (name === 'daughter') return `<span class="material-symbols-outlined text-lg">child_care</span>`;
    if (name === 'family') return `<span class="material-symbols-outlined text-lg">family_restroom</span>`;
    return `<span class="material-symbols-outlined text-lg">person</span>`;
}

export function createHealthCard(p) {
    const sym = p.currency === "INR" ? "₹" : "$";
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.05)`;

    // Baseline: Calculate Dynamic Premium based on Cash + CPF
    const premium = (parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0));
    
    // New Feature: Calculate Next Due
    const nextDue = getNextDue(p.expiryDate);

    // Baseline: Time Remaining Logic
    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    let years = expiryDate.getFullYear() - today.getFullYear();
    let months = expiryDate.getMonth() - today.getMonth();
    if (months < 0) { years--; months += 12; }
    const timeRemaining = `${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;

    return `
    <div class="health-card policy-card mb-8 rounded-[40px] bg-white border-2 relative overflow-hidden transition-all hover:shadow-xl" 
         id="card-${p.id}"
         style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="p-8 flex items-center justify-between cursor-pointer group" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-8 pl-4">
                <div class="w-20 h-20 bg-white rounded-3xl shadow-sm p-3 flex items-center justify-center border border-slate-100">
                    <img src="${p.logo}" class="max-h-full object-contain">
                </div>
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white shadow-sm">
                            ${getOwnerIcon(p.owner)}
                        </div>
                        <span class="text-[10px] font-black px-4 py-2 rounded-full text-white uppercase tracking-wider" style="background: ${brandColor}">
                            ${p.category}
                        </span>
                    </div>
                    <h3 class="font-black text-2xl text-slate-900 leading-none">${p.name}</h3>
                    <p class="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">#${p.id}</p>
                </div>
            </div>

            <div class="flex gap-10 items-center pr-4">
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Annual Premium</p>
                    <p class="text-2xl font-black text-slate-800">${autoFmt(premium, sym)}</p>
                    <div class="flex gap-1 justify-end mt-1">
                        ${p.cashAmount > 0 ? `<div class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase">CASH</div>` : ''}
                        ${p.cpfAmount > 0 ? `<div class="px-2 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-black uppercase">CPF</div>` : ''}
                    </div>
                </div>

                <div class="text-right border-l border-slate-200/50 pl-8 min-w-[110px]">
                    <p class="text-[9px] font-black text-orange-500 uppercase mb-1 tracking-widest">Next Due</p>
                    <p class="text-lg font-black text-slate-700 leading-none">${nextDue}</p>
                    <p class="text-[8px] font-bold text-slate-400 mt-1 uppercase">Anniversary</p>
                </div>
                
                <div class="bg-white/80 px-6 py-4 rounded-[24px] border border-white/50 text-center min-w-[120px] shadow-sm ml-4">
                    <p class="text-[9px] font-black text-emerald-600 uppercase mb-1">Coverage Left</p>
                    <p class="text-lg font-black text-slate-800">${timeRemaining}</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 transition-transform group-[.open]:rotate-180">expand_more</span>
            </div>
        </div>

        <div class="content-area p-8 bg-white border-t border-slate-50">
            <div class="flex gap-6">
                <div class="w-1/3 space-y-4">
                    <div class="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                        <p class="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Yearly Limit / SA</p>
                        <p class="text-2xl font-black text-slate-800">
                            ${p.sumAssured === 0 ? 'Rider Benefit' : autoFmt(p.sumAssured, sym)}
                        </p>
                    </div>
                    <div class="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                        <p class="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Invested (To Date)</p>
                        <p class="text-xl font-black text-slate-600">${autoFmt(p.totalPaid, sym)}</p>
                    </div>
                </div>

                <div class="w-2/3 p-6 rounded-[32px] bg-sky-50 border border-sky-100">
                    <p class="text-[10px] font-black text-sky-600 uppercase mb-4 tracking-widest">Key Coverage Benefits</p>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                        ${p.benefits.map(b => `
                            <div class="flex items-start gap-2">
                                <span class="material-symbols-outlined text-sky-500 text-sm mt-0.5">check_circle</span>
                                <span class="text-[12px] font-bold text-sky-900 leading-tight">${b}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
                <div class="flex items-center gap-2 text-slate-400">
                    <span class="material-symbols-outlined text-sm text-emerald-500">event_available</span>
                    <span class="text-[10px] font-black uppercase tracking-tighter">Covered Till: <span class="text-slate-800 ml-1 font-black">${p.expiryDate}</span></span>
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase">
                    Nominee: <span class="text-slate-800 ml-1 font-black">${p.nominee || 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>`;
}
