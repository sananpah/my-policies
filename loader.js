/* loader.js - v5.0.0 - Modular Refactor with Dynamic Country Detection */
import { toNum, autoFmt, getColorMap, githubLogo, insuredMap } from './utils.js?v=1.0.5';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

/**
 * Main Sync Function
 * Decommissions hardcoded category IDs and classifies data row-by-row
 */
export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        // Initialize new structure
        const updatedList = { india: [], singapore: [], health: masterList.health || [] };

        sheetRecords.forEach(match => {
            const policyId = String(match["Policy No."]).trim();
            if (!policyId || policyId === "undefined") return;

            // Find existing baseline if available
            const existing = [...(masterList.india || []), ...(masterList.singapore || [])]
                .find(p => String(p.id).trim() === policyId) || {};

            let p = { ...existing, id: policyId };

            // 1. Basic Info & Identity
            mapBasicInfo(p, match);
            mapIdentity(p, match);

            // 2. Financials & Nominees
            mapFinancials(p, match);
            mapNominees(p, match);

            // 3. Technical Data & Country Detection (UIN Logic)
            mapTechnicalData(p, match);
            const country = (p.uin !== "N/A") ? "india" : "singapore";

            // 4. Dates & Projections
            mapDatesAndTerms(p, match);
            mapProjections(p, match, country);

            // Push to detected category
            updatedList[country].push(p);
        });

        return updatedList;
    } catch (e) {
        console.warn("Sync failed:", e);
        return masterList;
    }
}

/* --- HELPER FUNCTIONS --- */

function mapBasicInfo(p, match) {
    p.name = match.name || p.name;
    p.company = match.company || p.company;
    p.color = getColorMap(p.company);
    p.type = match.type || p.type;
    p.logo = `${githubLogo}logo_${p.company.replace(/[\s.]/g, "")}.png`;
}

function mapIdentity(p, match) {
    const identity = insuredMap[match["Insured"]];
    if (identity) {
        p.avatarPath = identity.img;
        p.holderType = identity.type;
    }
}

function mapFinancials(p, match) {
    p.premium = toNum(match["Premium"]);
    p.totalPremiumPaid = toNum(match["Total Premium"]);
    p.sumAssured = toNum(match["Sum Assured"]);
    p.unitValueNumeric = toNum(match["Current Value"]);
    p.currentUnitValue = match["Current Value"] || "No Value";
}

function mapNominees(p, match) {
    const raw = String(match["Nominee"] || "").trim();
    p.nominees = [];
    if (!raw || raw.toLowerCase() === "n/a") {
        p.nomineeStatus = raw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
    } else {
        p.nomineeStatus = "ASSIGNED";
        const names = raw.split(/,|\band\b|&|\n|\r/).map(n => n.trim());
        names.forEach(name => {
            const clean = name.replace(/[^\x20-\x7E]/g, "").trim();
            if (!clean) return;
            let img = "avatar_unknown.png";
            const mapped = Object.entries(insuredMap).find(([full]) => clean.toLowerCase().includes(full.toLowerCase()));
            if (mapped) img = mapped[1].img;
            p.nominees.push({ name: clean, img: img });
        });
    }
}

function mapTechnicalData(p, match) {
    const raw = String(match["Other Data"] || "").trim();
    p.uin = "N/A"; p.clientId = "N/A";
    p.surrenderCharges = null; p.surrenderBase = "VALUATION";

    if (raw && raw.toLowerCase() !== "n/a") {
        const lines = raw.split(/\n|\r/);
        lines.forEach(line => {
            const cleanLine = line.trim().toLowerCase();
            if (cleanLine.startsWith("uin:")) p.uin = line.split(":")[1]?.trim() || "N/A";
            else if (cleanLine.startsWith("clientid:")) {
                if (!(p.type || "").toUpperCase().includes("ULIP")) p.clientId = line.split(":")[1]?.trim() || "N/A";
            } else if (cleanLine.startsWith("surrender:")) {
                const content = line.split(":")[1] || "";
                p.surrenderBase = content.includes("[pp]") ? "PREMIUM" : "VALUATION";
                p.surrenderCharges = {};
                content.replace(/\[.*?\]/g, "").split(",").forEach((val, idx) => {
                    const cleanVal = parseInt(val.trim());
                    if (!isNaN(cleanVal)) p.surrenderCharges[idx + 1] = cleanVal;
                });
            }
        });
    }
    if (!p.surrenderCharges) p.surrenderCharges = { 1: 0 };
}

function mapDatesAndTerms(p, match) {
    let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' ');
    p.commenced = rawDate;
    const parts = rawDate.split(" ");
    const startY = parseInt(parts[2]);

    const rawTerm = String(match["Term"] || "");
    const termParts = rawTerm.includes(":") ? rawTerm.split(":") : [0, 0, 0];
    const ppt = parseInt(termParts[0], 10) || 0;
    const mat = parseInt(termParts[1], 10) || 0;

    p.mip = termParts[2] ? parseInt(termParts[2], 10) : ppt;
    p.ppt = ppt;

    if (!isNaN(startY)) {
        p.premiumEnds = `${parts[0]} ${parts[1]} ${startY + ppt - 1}`;
        p.maturity = `${parts[0]} ${parts[1]} ${startY + mat}`;
    }
}

function mapProjections(p, match, country) {
    const isULIP = (p.type || "").toUpperCase().includes("ULIP") || (country === "singapore");
    const sym = (country === "singapore") ? "$" : "₹";
    const TODAY = new Date();

    if (isULIP) {
        const calc = (rate) => {
            let projected = p.unitValueNumeric;
            const startY = parseInt(p.commenced.split(" ")[2]);
            let targetYear = (country === "india") ? (startY + (p.maturity.split(" ")[2] - startY)) : (startY + p.ppt + 2);
            let stopYear = (country === "india") ? (startY + p.ppt) : (startY + p.mip);

            if (country === "singapore" && p.ppt === (p.maturity.split(" ")[2] - startY)) {
                targetYear = stopYear = parseInt(p.maturity.split(" ")[2]);
            }

            for (let yr = TODAY.getFullYear(); yr < targetYear; yr++) {
                if (yr < stopYear) projected += p.premium;
                projected *= (1 + rate);
            }
            return { v: projected, t: targetYear, s: stopYear };
        };

        const r4 = calc(0.04);
        const r8 = calc(0.08);
        const disclaimer = `<div style="font-size:0.55rem; opacity:0.6; margin-top:4px; font-style:italic;">*Pay till ${r4.s}, Grow till ${r4.t}</div>`;
        
        p.maturityAmt = `Est. @4%: ${autoFmt(r4.v, sym)}<br>Est. @8%: ${autoFmt(r8.v, sym)}${disclaimer}`;
    }
}

function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) currentRow.push('');
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else currentRow[currentRow.length-1] += char;
    }
    rows.push(currentRow);
    const headerIdx = rows.findIndex(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (headerIdx === -1) return [];
    const headers = rows[headerIdx].map(h => h.trim());
    return rows.slice(headerIdx + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        const rawName = obj["Policy_Name"] || "";
        if (rawName.includes(":")) {
            const pts = rawName.split(":");
            obj.company = pts[0].trim();
            obj.name = pts[1].trim();
        }
        const rawCat = obj["Category"] || "";
        obj.type = rawCat.includes(":") ? rawCat.split(":")[1].trim() : (rawCat || "Savings");
        return obj;
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}
