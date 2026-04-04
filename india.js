/* india.js - v4.0.98 - Centralized Safety Utilities */

const TODAY = new Date();

export const monthMap = { 
    "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,
    "Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 
};

// --- NEW: SAFETY DATE HELPERS ---
export function safeParseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes(' ')) {
        return new Date(9999, 0, 1); // Fallback to avoid crashes
    }
    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = monthMap[parts[1]] || 0;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
}

export function safeGetYear(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes(' ')) return 2000;
    const parts = dateStr.split(' ');
    return parseInt(parts[parts.length - 1]);
}

// --- UPDATED UTILITIES ---
export function checkIsDueSoon(dueDateStr) {
    if (!dueDateStr || dueDateStr === "PAID UP") return false;
    const due = safeParseDate(dueDateStr);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
}

export function getTimeLeft(endDateStr) {
    if (!endDateStr || endDateStr === "PAID UP") return null;
    const end = safeParseDate(endDateStr);
    let years = end.getFullYear() - TODAY.getFullYear();
    let months = end.getMonth() - TODAY.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years < 0) return null;
    return `${String(years).padStart(2, '0')}y${String(months).padStart(2, '0')}m`;
}

export function autoFmt(val, sym) {
    if (val === undefined || val === null) return sym + "0";
    const num = toNum(val);
    return sym + num.toLocaleString('en-IN'); // Standard Indian formatting
}

export function raw(val) { return (val === undefined || val === null) ? "" : val; }

export function toNum(val) {
    if(!val) return 0;
    const clean = String(val).replace(/[₹$,\s]/g, "");
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
}
