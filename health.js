/* health.js - v1.5.2 - Added GitHub Logo Pathing */
import { autoFmt, checkIsDueSoon } from './utils.js';

// 1. Define your GitHub folder path here
// Use the "raw" link to ensure the images render correctly in the browser
const githubLogo = "https://raw.githubusercontent.com/sananpah/my-policies/main/assets/logo/";

function getNextDue(expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    
    let nextDue = new Date(today.getFullYear(), expiry.getMonth(), expiry.getDate());
    
    if (nextDue < today) {
        nextDue.setFullYear(today.getFullYear() + 1);
    }
    
    const day = String(nextDue.getDate()).padStart(2, '0');
    const month = nextDue.toLocaleString('en-GB', { month: 'short' });
    const year = nextDue.getFullYear();
    
    return `${day} ${month} ${year}`;
}

function getOwnerIcon(owner) {
    const name = owner.toLowerCase();
    if (name === 'father') return 'man';
    if (name === 'mother') return 'woman';
    if (name === 'daughter') return 'child_care';
    if (name === 'family') return 'family_restroom';
    return 'person';
}

export function createHealthCard(p, isMobile = false) {
    const sym = p.currency === "INR" ? "₹" : "$";
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.05)`;

    const premium = (parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0));
    const nextDue = getNextDue(p.expiryDate);

    // --- LOGIC FOR GITHUB LOGO PATH ---
    // This checks if p.logo is already a full URL; if not, it prepends the GitHub path
    const logoSrc = p.logo.startsWith('http') ? p.logo : `${GITHUB_LOGO_BASE}${p.logo}`;

    const isDueSoon = checkIsDueSoon(nextDue);
    const blinkClass = isDueSoon ? "animate-card-pulse" : "";

    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    let years = expiryDate.getFullYear() - today.getFullYear();
    let months = expiryDate.getMonth() - today.getMonth();
    if (months < 0) { years--; months += 12; }
    const timeRemaining = `${String(Math.max(0, years)).padStart(2, '0')}y${String(Math.max(0, months)).padStart(2, '0')}m`;

    return `
    <div class="health-card policy-card mb-6 rounded-[30px] md:rounded-[40px] bg-white border-2 relative overflow-hidden transition-all duration-500 ${blinkClass}" 
         id="card-${p.id}"
         style="border-left: ${isMobile ? '10px' : '16px'} solid ${brandColor}; border-color: ${isDueSoon ? '#f87171' : brandColor};">
        
        <div class="p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group" style="background: ${brandBg}" onclick="toggleCard('${p.id}')">
            <div class="flex items-center gap-4 md:gap-8 mb-4 md:mb-0">
                <div class="w-14 h-14 md:w-20 md:h-20 bg-white rounded-2xl shadow-sm p-2 flex items-center justify-center border border-slate-100">
                    <img src="${logoSrc}" class="max-h-full object-contain" alt="${p.name} logo">
                </div>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white">
                            <span class="material-symbols-outlined text-[16px]">${getOwnerIcon(p.owner)}</span>
                        </div>
                        <span class="text-[9px] font-black px-3 py-1 rounded-full text-white uppercase tracking-wider" style="background: ${brandColor}">
                            ${p.category}
                        </span>
                    </div>
                    <h3 class="font-black text-lg md:text-2xl text-slate-900 leading-tight">${p.name}</h3>
                    <p class="text-[10px] font-bold text-slate-400 tracking-widest uppercase">#${p.id}</p>
                </div>
            </div>
            <div class="flex items-center justify-between md:justify-end gap-4 md:gap-10 border-t md:border-0 pt-4 md:pt-0">
                <div class="text-left md:text-right">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Premium</p>
                    <p class="text-lg md:text-2xl font-black text-slate-800">${autoFmt(premium, sym)}</p>
                    <div class="flex gap-1 justify-start md:justify-end mt-1">
                        ${p.cashAmount > 0 ? `<div class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase">CASH</div>` : ''}
                        ${p.cpfAmount > 0 ? `<div class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[8px] font-black uppercase">CPF</div>` : ''}
                    </div>
                </div>
                <div class="bg-white/80 px-4 py-3 rounded-2xl border border-white/50 text-center min-w-[100px] shadow-sm">
                    <p class="text-[8px] font-black ${isDueSoon ? 'text-red-500' : 'text-orange-500'} uppercase mb-0.5">Due: ${nextDue.split(' ').slice(0,2).join(' ')}</p>
                    <p class="text-[11px] font-black ${isDueSoon ? 'text-red-700' : 'text-slate-700'} leading-none">Left: ${timeRemaining}</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 hidden md:block group-[.open]:rotate-180 transition-transform">expand_more</span>
            </div>
        </div>
        <div class="content-area overflow-hidden">
            <div class="p-5 md:p-8 flex flex-col md:flex-row gap-4 md:gap-6 bg-white border-t border-slate-50">
                <div class="w-full md:w-1/3 space-y-3">
                    <div class="p-4 md:p-6 rounded-2xl md:rounded-[32px] bg-slate-50 border border-slate-100">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Yearly Limit / SA</p>
                        <p class="text-xl md:text-2xl font-black text-slate-800">
                            ${p.sumAssured === 0 ? 'Rider Benefit' : autoFmt(p.sumAssured, sym)}
                        </p>
                    </div>
                    <div class="p-4 md:p-6 rounded-2xl md:rounded-[32px] bg-slate-50 border border-slate-100">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Total Invested</p>
                        <p class="text-lg md:text-xl font-black text-slate-600">${autoFmt(p.totalPaid, sym)}</p>
                    </div>
                </div>
                <div class="w-full md:w-2/3 p-5 md:p-6 rounded-2xl md:rounded-[32px] bg-sky-50 border border-sky-100">
                    <p class="text-[10px] font-black text-sky-600 uppercase mb-4 tracking-widest">Key Coverage Benefits</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        ${p.benefits.map(b => `
                            <div class="flex items-start gap-2">
                                <span class="material-symbols-outlined text-sky-500 text-[14px] mt-0.5">check_circle</span>
                                <span class="text-[11px] md:text-[12px] font-bold text-sky-900 leading-tight">${b}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="mx-5 md:mx-8 mb-6 flex flex-col md:flex-row justify-between items-center py-4 border-t border-slate-100 gap-3">
                <div class="flex items-center gap-2 text-slate-400">
                    <span class="material-symbols-outlined text-sm text-emerald-500">event_available</span>
                    <span class="text-[10px] font-black uppercase">Covered Till: <span class="text-slate-800 ml-1 font-black">${p.expiryDate}</span></span>
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase">
                    Nominee: <span class="text-slate-800 ml-1 font-black">${p.nominee || 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>`;
}
