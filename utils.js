/* utils.js — Shared utilities v5.0 */

export const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
};

const TODAY = new Date();

// --- DATA PARSING ---
export const toNum = (val) => {
    if (!val || val === "No Value") return 0;
    const clean = val.toString().replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
};

export function parseDate(str) {
    if (!str || str === "PAID UP") return new Date(9999, 0, 1);
    const p = str.toString().replace(/\./g, ' ').split(' ');
    return new Date(p[1] + " " + p[0] + ", " + p[2]);
}

export function safeGetYear(dateStr) {
    if (!dateStr) return TODAY.getFullYear();
    const cleanStr = dateStr.toString().replace(/\./g, ' ');
    const parts    = cleanStr.trim().split(/\s+/);
    if (parts.length === 3) return parseInt(parts[2], 10);
    const d = new Date(dateStr);
    return isNaN(d.getFullYear()) ? TODAY.getFullYear() : d.getFullYear();
}

// --- FORMATTERS ---
export function autoFmt(val, sym) {
    if (val === undefined || val === null || val === "No Value") return sym + "0";
    const num = typeof val === "number" ? val : toNum(val);
    return isNaN(num) ? val : sym + Math.round(num).toLocaleString('en-IN');
}

export function checkIsDueSoon(dueDateStr) {
    const TODAY = new Date();
    if (!dueDateStr || dueDateStr === "PAID UP") return false;
    const due  = safeParseDate(dueDateStr);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
}

// --- CALCULATION LOGIC (Moved from app.js) ---

/** Calculates SA, Premium (excluding paid up), and Unit Value */
export function calculatePortfolioTotals(list) {
    const CURRENT_YEAR = TODAY.getFullYear();
    return list.reduce((acc, p) => {
        const status = (p.status || "").toUpperCase();
        const pEndYear = safeGetYear(p.premiumEnds);
        const isPaidUp = (status === "PAID UP" || CURRENT_YEAR > (pEndYear - 1));

        acc.sa += toNum(p.sumAssured);
        acc.unitValue += (p.unitValueNumeric || 0);
        if (!isPaidUp) acc.premium += toNum(p.premium);
        
        return acc;
    }, { sa: 0, premium: 0, unitValue: 0 });
}

/** Calculates Family SA Breakdown for India */
export function calculateFamilyBreakdown(list) {
    return {
        self: list.filter(p => !p.avatarPath || p.holderType === "Self").reduce((acc, p) => acc + toNum(p.sumAssured), 0),
        wife: list.filter(p => p.holderType === "Wife").reduce((acc, p) => acc + toNum(p.sumAssured), 0),
        daughter: list.filter(p => p.holderType === "Daughter").reduce((acc, p) => acc + toNum(p.sumAssured), 0)
    };
}

/** Calculates Health Totals for SGD and INR */
export function calculateHealthTotals(healthList) {
    const sg = healthList.filter(p => p.currency === "SGD").reduce((acc, p) => acc + toNum(p.cashAmount) + toNum(p.cpfAmount), 0);
    const inr = healthList.filter(p => p.currency === "INR").reduce((acc, p) => acc + toNum(p.cashAmount), 0);
    return { sg, inr };
}
