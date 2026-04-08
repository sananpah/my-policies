// utils.js — Shared utilities v4.2

export const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
};

const TODAY = new Date();

export function safeParseDate(dateStr) {
    if (!dateStr) return new Date();
    const cleanStr = dateStr.toString().replace(/\./g, ' ');
    const parts = cleanStr.trim().split(/\s+/);
    if (parts.length === 3) {
        const day   = parseInt(parts[0], 10);
        const month = monthMap[parts[1]] ?? 0;
        const year  = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
}

export function checkIsDueSoon(dueDateStr) {
    if (!dueDateStr || dueDateStr === "PAID UP") return false;
    const due  = safeParseDate(dueDateStr);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
}

export function getTimeLeft(endDateStr) {
    if (!endDateStr || endDateStr === "PAID UP") return null;
    const end = safeParseDate(endDateStr);
    let years  = end.getFullYear() - TODAY.getFullYear();
    let months = end.getMonth()    - TODAY.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years < 0) return null;
    return `${String(years).padStart(2, '0')}y ${String(months).padStart(2, '0')}m`;
}

export function autoFmt(val, sym) {
    if (val === undefined || val === null || val === "No Value") return sym + "0";
    const clean = val.toString().replace(/[^\d.]/g, "");
    const num   = parseFloat(clean);
    return isNaN(num) ? val : sym + num.toLocaleString('en-IN');
}

export function raw(val) {
    return (val === undefined || val === null) ? "" : val;
}

export const toNum = (val) => {
    if (!val || val === "No Value") return 0;
    const clean = val.toString().replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
};

export function safeGetYear(dateStr) {
    if (!dateStr) return TODAY.getFullYear();
    const cleanStr = dateStr.toString().replace(/\./g, ' ');
    const parts    = cleanStr.trim().split(/\s+/);
    if (parts.length === 3) return parseInt(parts[2], 10);
    const d = new Date(dateStr);
    return isNaN(d.getFullYear()) ? TODAY.getFullYear() : d.getFullYear();
}

export function parseDate(str) {
    if (!str || str === "PAID UP") return new Date(9999, 0, 1);
    const p = str.toString().replace(/\./g, ' ').split(' ');
    return new Date(p[1] + " " + p[0] + ", " + p[2]);
}
