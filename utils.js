/* utils.js — Shared utilities v5.0 */

export const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
};

export const getColorMap = (companyName) => {
    const colors = {
        "AIA" : "#d31145",
        "AxisMaxLife" : "#ae125d",
        "BajajLife" : "#005a9c",
        "BhartiAXA" : "#005a9c",
        "HSBCLife" : "#db0011",
        "ICICIPru" : "#9b2226",
        "IndusIndNippon" : "#962524",
        "KotakLife" : "#e63946",
        "ManuLife" : "#00a758",
        "Prudential" : "#ED1B2E",
        "SBILife" : "#00B4EE",
        "SingLife" : "#E60000"
    };
    return colors[companyName] || "#64748b";
};

const TODAY = new Date();

export function raw(val) {
    return (val === undefined || val === null) ? "" : val;
}

export const toNum = (val) => {
    // Immediate exit for null/empty
    if (val === undefined || val === null || val === "No Value" || val === "") {
        return 0;
    }
    // If it's already a number, just return it
    if (typeof val === "number") return val;

    // Clean the string:
    // - replace(/[^\x00-\x7F]/g, ""): Removes hidden non-ASCII characters
    // - replace(/[^\d.]/g, ""): Removes symbols (₹, $, %) and commas
    const clean = String(val)
        .replace(/[^\x00-\x7F]/g, "") 
        .replace(/[^\d.]/g, "");
    
    const result = parseFloat(clean);
    
    // Final safety: return 0 if result is NaN
    return isNaN(result) ? 0 : result;
};

export function parseDate(str) {
    if (!str || str === "PAID UP") return new Date(9999, 0, 1);
    const p = str.toString().replace(/\./g, ' ').split(' ');
    return new Date(p[1] + " " + p[0] + ", " + p[2]);
}

export function safeParseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // Clean string: replace dots with spaces and split
    const cleanStr = dateStr.toString().replace(/\./g, ' ');
    const parts = cleanStr.trim().split(/\s+/);
    
    // If format is "15 Jan 2030"
    if (parts.length === 3) {
        const day   = parseInt(parts[0], 10);
        const month = monthMap[parts[1]] ?? 0;
        const year  = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    
    // Fallback to standard JS parsing
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
}

export function safeGetYear(dateStr) {
    if (!dateStr) return TODAY.getFullYear();
    const cleanStr = dateStr.toString().replace(/\./g, ' ');
    const parts    = cleanStr.trim().split(/\s+/);
    if (parts.length === 3) return parseInt(parts[2], 10);
    const d = new Date(dateStr);
    return isNaN(d.getFullYear()) ? TODAY.getFullYear() : d.getFullYear();
}

export function autoFmt(val, sym) {
    // Check for empty/null values
    if (val === undefined || val === null || val === "No Value" || val === "") {
        return sym + "0";
    }
    // If it's already a number, use it. If it's a string, clean it first.
    const num = (typeof val === "number") ? val : toNum(val);
    // Final check: if it's not a number at all, just return the raw value
    if (isNaN(num)) return val;
    // Round and format with Indian commas
    return sym + Math.round(num).toLocaleString('en-IN');
}

export function checkIsDueSoon(dueDateStr) {
    const TODAY = new Date();
    if (!dueDateStr || dueDateStr === "PAID UP") return false;
    const due  = safeParseDate(dueDateStr);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
}

/**
 * Calculates years and months between TODAY and a target date.
 * Returns "YYy MMm" or null if the date has passed.
 */

/* utils.js */
export function getTimeRemaining(targetDateStr, TODAY) {
    if (!targetDateStr || targetDateStr === "PAID UP") return null;
    
    const target = safeParseDate(targetDateStr);
    const diffInMs = target - TODAY;
    
    // Only return null if the target date is strictly in the past
    if (diffInMs < 0) return null;

    const totalDays = diffInMs / (1000 * 60 * 60 * 24);
    const totalMonths = Math.round(totalDays / 30.44);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return `${String(years).padStart(2, '0')}y ${String(months).padStart(2, '0')}m`;
}

// --- CALCULATION LOGIC (Moved from app.js) ---

/** Calculates SA, Premium (excluding paid up), and Unit Value */
export function calculatePortfolioTotals(list) {
    return list.reduce((acc, p) => {
        const status = (p.status || "").toUpperCase();
        const finalPremiumDate = safeParseDate(p.premiumEnds);
        const isPaidUp = (status === "PAID UP" || TODAY > finalPremiumDate);
 
        acc.sa += toNum(p.sumAssured);
        acc.unitValue += (p.unitValueNumeric || 0);
        
        // Only add premium if the policy is still active and not assigned (SA > 0)
        if (!isPaidUp && toNum(p.sumAssured) > 0) {
            acc.premium += toNum(p.premium);
        }
        
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
