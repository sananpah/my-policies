/* india.js - Utility Engine */
const TODAY = new Date();
export const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };

export function safeParseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes(' ')) return new Date(9999, 0, 1);
    const parts = dateStr.split(' ');
    return new Date(parseInt(parts[2]), monthMap[parts[1]] || 0, parseInt(parts[0]));
}

export function safeGetYear(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes(' ')) return 2050;
    return parseInt(dateStr.split(' ')[2]) || 2050;
}

export function autoFmt(val, sym) {
    const num = parseFloat(String(val).replace(/[₹$,\s]/g, "")) || 0;
    return sym + num.toLocaleString('en-IN');
}

export function toNum(val) { return parseFloat(String(val).replace(/[₹$,\s]/g, "")) || 0; }
export function raw(val) { return val || ""; }
export function checkIsDueSoon() { return false; } // Placeholder
