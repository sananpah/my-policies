/* app.js - v1.0.0 - Centralized App Logic */
import { syncWithGoogleSheets, autoFmt } from './loader.js';
import { createPolicyCard } from './component_in.js';
import { createSGCard } from './component_sg.js';
import { createHealthCard } from './health.js';
import { healthData } from './data_health.js';
import { POLICY_DATA } from './data.js';
import { toNum, safeGetYear } from './india.js';

// Global state to track category and current data
window.currentCategory = 'india';
let localPolicyData = POLICY_DATA;

/**
 * Main Initialization
 */
export async function initDashboard(version) {
    console.log(`Nami Portfolio Engine [Build ${version}]`);
    
    // Sync with Google Sheets first
    try {
        localPolicyData = await syncWithGoogleSheets(POLICY_DATA);
    } catch (e) {
        console.warn("Sheet sync failed, using local data.js baseline.");
    }

    // Default render
    render('india');
}

/**
 * Main Render Function
 */
export function render(cat) {
    window.currentCategory = cat;
    const sortBy = document.getElementById('sort-trigger').value;
    const container = document.getElementById('container');
    const statusBadge = document.getElementById('portfolio-status');
    const sortContainer = document.getElementById('sort-container');
    const summaryBar = document.getElementById('summary-bar');

    const TODAY = new Date();
    const CURRENT_YEAR = TODAY.getFullYear();

    // 1. Handle UI Layout Transitions
    if (cat === 'health') {
        sortContainer.classList.add('invisible');
        statusBadge.innerHTML = `<span class="material-symbols-outlined text-xs align-middle mr-1">medical_services</span> HEALTH PORTFOLIO`;
        updateHealthSummary(summaryBar);
    } else {
        sortContainer.classList.remove('invisible');
        const flagSrc = (cat === 'india') ? 'in' : 'sg';
        statusBadge.innerHTML = `<img src="https://flagcdn.com/w40/${flagSrc}.png" class="w-5 h-auto inline-block align-middle mr-2 rounded-sm">${cat.toUpperCase()} PORTFOLIO`;
        updatePolicySummary(summaryBar, cat, CURRENT_YEAR);
    }

    // 2. Prepare and Sort List
    let list = cat === 'health' ? [...healthData] : [...(localPolicyData[cat] || [])];
    const sym = (cat === 'singapore') ? "$" : "₹";

    if (cat !== 'health') {
        if (sortBy === 'premium') list.sort((a, b) => toNum(b.premium) - toNum(a.premium));
        else if (sortBy === 'due') list.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
        else if (sortBy === 'time') list.sort((a, b) => parseDate(a.premiumEnds) - parseDate(b.premiumEnds));
    }

    // 3. Render Cards
    container.innerHTML = list.map(p => {
        if (cat === 'health') return createHealthCard(p);
        if (cat === 'singapore') return createSGCard(p, sym, TODAY, CURRENT_YEAR);
        return createPolicyCard(p, sym, TODAY, CURRENT_YEAR);
    }).join('');
}

/**
 * Toggle Card Expansion
 */
export function handleToggle(id) {
    const card = document.getElementById(`card-${id}`);
    if (!card) return;
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.policy-card, .health-card').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
}

/**
 * Update Health Specific Summary Bar
 */
function updateHealthSummary(bar) {
    bar.className = "flex items-center justify-between bg-slate-900 p-6 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500";
    
    const sgTotal = healthData.filter(p => p.currency === "SGD").reduce((acc, p) => acc + parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0), 0);
    const inCash = healthData.filter(p => p.currency === "INR").reduce((acc, p) => acc + parseFloat(p.cashAmount || 0), 0);

    bar.innerHTML = `
        <div class="flex items-center gap-2 pl-4">
            <span class="material-symbols-outlined text-emerald-500 text-3xl">medical_services</span>
            <span class="text-sm font-black uppercase tracking-widest ml-2">Health Portfolio</span>
        </div>
        <div class="flex gap-6 pr-4">
            <div class="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <img src="https://flagcdn.com/w40/sg.png" class="w-4 h-auto rounded-sm">
                <span class="text-lg font-black text-white">$${Math.round(sgTotal).toLocaleString('en-IN')}</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <img src="https://flagcdn.com/w40/in.png" class="w-4 h-auto rounded-sm">
                <span class="text-lg font-black text-white">₹${Math.round(inCash).toLocaleString('en-IN')}</span>
            </div>
        </div>`;
}

/**
 * Update India/Singapore Summary Bar (with Family Breakdown)
 */
function updatePolicySummary(bar, cat, currentYear) {
    const list = localPolicyData[cat] || [];
    const sym = (cat === 'singapore') ? "$" : "₹";
    
    bar.className = "grid grid-cols-[1.2fr_1fr_1fr] gap-6 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500";

    const tSA = list.reduce((acc, p) => acc + toNum(p.sumAssured), 0);
    const tAnn = list.reduce((acc, p) => {
        const status = (p.status || "").toUpperCase();
        const pEndYear = safeGetYear(p.premiumEnds);
        const isPaidUp = (status === "PAID UP" || currentYear > (pEndYear - 1));
        return isPaidUp ? acc : acc + toNum(p.premium || 0);
    }, 0);
    const tUnitValue = list.reduce((acc, p) => acc + (p.unitValueNumeric || 0), 0);

    let familyHtml = '';
    if (cat === 'india') {
        const hSA = list.filter(p => !p.avatarPath || p.holderType === "Self").reduce((acc, p) => acc + toNum(p.sumAssured), 0);
        const wSA = list.filter(p => p.holderType === "Wife").reduce((acc, p) => acc + toNum(p.sumAssured), 0);
        const dSA = list.filter(p => p.holderType === "Daughter").reduce((acc, p) => acc + toNum(p.sumAssured), 0);
        
        familyHtml = `
            <div class="flex justify-center gap-4 mt-4 pt-3 border-t border-slate-800/50">
                <div class="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full border border-slate-700/30">
                    <img src="avatar_self.png" class="w-5 h-5 rounded-full object-cover border border-slate-500">
                    <span class="text-[11px] font-black text-slate-200">${sym}${Math.round(hSA).toLocaleString('en-IN')}</span>
                </div>
                <div class="flex items-center gap-2 bg-pink-900/20 px-3 py-1.5 rounded-full border border-pink-700/30">
                    <img src="avatar_wife.png" class="w-5 h-5 rounded-full object-cover border border-pink-500">
                    <span class="text-[11px] font-black text-pink-200">${sym}${Math.round(wSA).toLocaleString('en-IN')}</span>
                </div>
                <div class="flex items-center gap-2 bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-700/30">
                    <img src="avatar_daughter.png" class="w-5 h-5 rounded-full object-cover border border-indigo-500">
                    <span class="text-[11px] font-black text-indigo-200">${sym}${Math.round(dSA).toLocaleString('en-IN')}</span>
                </div>
            </div>`;
    }

    bar.innerHTML = `
        <div class="border-r border-slate-700 text-center pr-6">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sum Assured</p>
            <p class="text-4xl font-black text-emerald-400"><span>${sym}${Math.round(tSA).toLocaleString('en-IN')}</span></p>
            ${familyHtml}
        </div>
        <div class="border-r border-slate-700 text-center">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Premium</p>
            <p class="text-4xl font-black text-indigo-400">${sym}${Math.round(tAnn).toLocaleString('en-IN')}</p>
        </div>
        <div class="text-center">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
            <p class="text-4xl font-black text-pink-500">${sym}${Math.round(tUnitValue).toLocaleString('en-IN')}</p>
        </div>`;
}

/**
 * Utility: Parse Date Strings
 */
function parseDate(str) {
    if (!str || str === "PAID UP") return new Date(9999, 0, 1);
    const p = str.toString().replace(/\./g, ' ').split(' ');
    return new Date(`${p[1]} ${p[0]}, ${p[2]}`);
}
