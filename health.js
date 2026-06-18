/* health.js - v1.6.0 - Synced with India Layout & Full Life Logic */
import { autoFmt, checkIsDueSoon, githubLogo } from './utils.js?v=1.0.4';

function getNextDue(expiryDateStr) {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    let nextDue = new Date(today.getFullYear(), expiry.getMonth(), expiry.getDate());
    
    if (nextDue < today) nextDue.setFullYear(today.getFullYear() + 1);
    
    const day = String(nextDue.getDate()).padStart(2, '0');
    const month = nextDue.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} ${nextDue.getFullYear()}`;
}

export function createHealthCard(p, isMobile = false) {
    const sym = p.currency === "INR" ? "₹" : "$";
    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.05)`;

    const premium = (parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0));
    const nextDue = getNextDue(p.expiryDate);

    // Asset logic: Logos from GitHub, Avatars from local root (relative path)
    const logoSrc = `${githubLogo}${p.logo}`;
    const avatarSrc = p.avatar || null;

    const isDueSoon = checkIsDueSoon(nextDue);
    const blinkClass = isDueSoon ? "animate-card-pulse" : "";

    // --- TIME REMAINING LOGIC ---
    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    let years = expiryDate.getFullYear() - today.getFullYear();
    let months = expiryDate.getMonth() - today.getMonth();
    if (months < 0) { years--; months += 12; }
    
    const isFullLife = years > 20;
    const timeRemaining = `${String(Math.max(0, years)).padStart(2, '0')}y ${String(Math.max(0, months)).padStart(2, '0')}m`;

    // Modern Icon Mapping (Self, Wife, Daughter, Family)
    const iconMap = { "Self": "man", "Wife": "woman", "Daughter": "child_care", "Family": "family_restroom" };
    const fallbackIcon = iconMap[p.holderType] || "person";

    return `
    // --- NOMINEE AVATAR HTML ---
    const nomineeHtml = (p.nomineeStatus === "NA") ? `<span class="text-[11px] font-black text-slate-400 uppercase italic">N/A</span>` :
                      (!p.nominees || p.nominees.length === 0 || p.nomineeStatus === "EMPTY") ? `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase">Unassigned</span>` :
                      `<div class="flex -space-x-3 items-center">${p.nominees.map(n => `<img src="${n.img}" class="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-20">`).join('')}</div>`;

    return `
    <div class="health-card policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${logoSrc}" class="max-h-12 object-contain" alt="${p.name}"></div>
            
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white shadow-sm overflow-hidden">
                        ${avatarSrc 
                            ? `<img src="${avatarSrc}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                               <span class="material-symbols-outlined text-[16px] hidden">${fallbackIcon}</span>`
                            : `<span class="material-symbols-outlined text-[16px]">${fallbackIcon}</span>`
                        }
                    </div>
                </h3>
            </div>

            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${p.category || 'Health'}</div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Annual Premium</p>
                            <div class="flex items-center gap-2">
                                <p class="text-lg text-emerald-600 font-black leading-none">${autoFmt(premium, sym)}</p>
                                <div class="flex flex-col gap-[2px]">
                                    ${p.cashAmount > 0 ? `<span class="text-[7px] bg-emerald-100 text-emerald-600 px-1 rounded font-black leading-none py-[2px]">CASH</span>` : ''}
                                    ${p.cpfAmount > 0 ? `<span class="text-[7px] bg-blue-100 text-blue-600 px-1 rounded font-black leading-none py-[2px]">CPF</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sum Assured</p>
                        <p class="text-lg font-black text-slate-800 leading-none">${p.sumAssured === 0 ? 'Rider' : autoFmt(p.sumAssured, sym)}</p>
                    </div>
                </div>
            </div>

            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                <div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                    ${isFullLife 
                        ? `<div class="mb-1 inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Full Life ♾️</div>`
                        : `<p class="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">Left: ${timeRemaining}</p>`
                    }
                    <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                    <div class="font-black text-[11px] ${isDueSoon ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${nextDue}</div>
                </div>
            </div>
        </div>

        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p style="font-family:'Orbitron'; font-weight:700;">${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>Total Invested</p><p style="font-family:'Orbitron'; font-weight:700;">${autoFmt(p.totalPaid, sym)}</p></div>
                <div class="detail-item"><p>Covered Till</p><p style="font-family:'Orbitron'; font-weight:700;">${p.expiryDate}</p></div>
            </div>
            
            <div class="mt-4 p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-3">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee(s)</p>
                <div class="flex items-center h-10">${nomineeHtml}</div>
            </div>

            <div class="mt-4 p-5 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                <p class="text-[9px] font-black text-sky-600 uppercase mb-3 tracking-widest">Key Coverage Benefits</p>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                    ${p.benefits.map(b => `
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-sky-500 text-[14px] mt-0.5">check_circle</span>
                            <span class="text-[11px] font-bold text-slate-700 leading-tight">${b}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>`;
}
