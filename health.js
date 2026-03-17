/* health.js - v1.3.0 - Visual Icons Only */
import { autoFmt } from './india.js';

function getOwnerIcon(owner) {
    const name = owner.toLowerCase();
    // Returning just the icon with a specific background for each person
    if (name.includes('suhail')) return `<span class="material-symbols-outlined text-lg">man</span>`;
    if (name.includes('saima')) return `<span class="material-symbols-outlined text-lg">woman</span>`;
    if (name.includes('sulmas')) return `<span class="material-symbols-outlined text-lg">child_care</span>`;
    if (name.includes('family')) return `<span class="material-symbols-outlined text-lg">family_restroom</span>`;
    return owner;
}

export function createHealthCard(p) {
    const sym = p.currency === "INR" ? "₹" : "$";
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.05)`;

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
                <div class="w-20 h-20 bg-white rounded-3xl shadow-sm p-3 flex items-center justify-center border border-slate-100 transition-transform group-hover:scale-105">
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
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Premium</p>
                    <p class="text-2xl font-black text-slate-800">${autoFmt(p.premium, sym)}</p>
                    <div class="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[9px] font-black mt-1 uppercase">${p.paymentMode}</div>
                </div>
                
                <div class="bg-white/80 px-6 py-4 rounded-[24px] border border-white/50 text-center min-w-[120px] shadow-sm">
                    <p class="text-[9px] font-black text-emerald-600 uppercase mb-1">Coverage Left</p>
                    <p class="text-lg font-black text-slate-800">${timeRemaining}</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 transition-transform group-[.open]:rotate-180">expand_more</span>
            </div>
        </div>

        <div class="content-area p-8 bg-white border-t border-slate-50">
            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-4 p-6 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col justify-center">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Yearly Limit / SA</p>
                    <p class="text-2xl font-black text-slate-800">
                        ${p.sumAssured === 0 ? 'Rider Benefit' : autoFmt(p.sumAssured, sym)}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase italic">Invested: ${autoFmt(p.totalPaid, sym)}</p>
                </div>

                <div class="col-span-8 p-6 rounded-[32px] bg-sky-50 border border-sky-100">
                    <p class="text-[10px] font-black text-sky-600 uppercase mb-4 tracking-widest">Key Coverage Benefits</p>
                    <div class="flex flex-wrap gap-2">
                        ${p.benefits.map(b => `
                            <span class="text-[11px] font-extrabold text-sky-900 bg-white px-4 py-2 rounded-xl shadow-sm border border-sky-200/30">
                                ${b}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
                <div class="flex items-center gap-2 text-slate-400">
                    <span class="material-symbols-outlined text-sm">event_repeat</span>
                    <span class="text-[10px] font-black uppercase tracking-tighter">Next Renewal: <span class="text-slate-800 ml-1 font-black">${p.expiryDate}</span></span>
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase">
                    Nominee: <span class="text-slate-800 ml-1 font-black">${p.nominee || 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>`;
}
