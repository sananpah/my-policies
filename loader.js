/* loader.js - v4.4.0 - Cleaned & Modularized */
import { toNum, autoFmt, monthMap } from './utils.js?v=1.0.2';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    const TODAY = new Date();
    const CURRENT_YEAR = TODAY.getFullYear();

    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        const insuredMap = {
            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;
            masterList[country] = masterList[country].map(p => {
                const match = sheetRecords.find(row => String(row["Policy No."]).trim() === String(p.id).trim());
                if (match) {
                    // Basic Info
                    p.name = match.name || p.name;
                    p.company = match.company || p.company;
                    p.type = match.type || p.type;
                    p.logo = `logo_${p.company.replace(/[\s.]/g, "")}.png`;

                    // Identity Mapping
                    const identity = insuredMap[match["Insured"]];
                    if (identity) { 
                        p.avatarPath = identity.img; 
                        p.holderType = identity.type; 
                    }

                    // Numeric Values - Now using imported toNum
                    p.premium = toNum(match["Premium"]);
                    p.sumAssured = toNum(match["Sum Assured"]);
                    
                    // Essential for Header Calculations
                    p.unitValueNumeric = toNum(match["Current Value"]);
                    p.currentUnitValue = match["Current Value"] || "No Value";

                    // Date & Term Logic
                    let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' '); 
                    p.commenced = rawDate;
                    const dateParts = rawDate.split(" ");
                    const startY = parseInt(dateParts[2]);

                    const rawTermStr = String(match["Term"] || "");
                    if (rawTermStr.includes(":")) {
                        const parts = rawTermStr.split(":");
                        p.ppt = parseInt(parts[0], 10) || 0;
                        const mat = parseInt(parts[1], 10) || 0;
                        if (!isNaN(startY)) {
                            p.premiumEnds = `${dateParts[0]} ${dateParts[1]} ${startY + p.ppt}`;
                            p.maturity = `${dateParts[0]} ${dateParts[1]} ${startY + mat}`;
                        }
                    }

                    // India Specific Logic
                    if (country === "india") {
                        const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                        
                        // MoneyBack Logic
                        const mbLine = rawBenefits.split(/\r?\n/).find(l => l.toLowerCase().includes("moneyback"));
                        p.payoutSchedule = {}; 
                        
                        if (mbLine && mbLine.includes(":")) {
                            const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                            content.split(",").forEach(seg => {
                                if (!seg.includes(":")) return;
                                const [range, valRaw] = seg.split(":").map(s => s.trim());
                                
                                let numOnly = toNum(valRaw);
                                let annualVal = valRaw.toLowerCase().includes("%bsa") 
                                    ? (p.sumAssured * (numOnly / 100)) 
                                    : numOnly;

                                if (range.includes("-")) {
                                    const [s, e] = range.split("-").map(Number);
                                    for (let y = s; y <= e; y++) p.payoutSchedule[y] = annualVal;
                                } else {
                                    const y = parseInt(range);
                                    if (!isNaN(y)) p.payoutSchedule[y] = annualVal;
                                }
                            });
                        }

                        // Maturity Text Formatting
                        const maturityLine = rawBenefits.split(/\r?\n/).find(l => l.trim().startsWith("Maturity Benefit"));
                        if (maturityLine) {
                            let val = maturityLine.split(":")[1]?.trim() || "";
                            val = val.replace(/(\d+)%BSA/gi, (m, pct) => autoFmt((p.sumAssured * parseFloat(pct)/100), "₹"));
                            p.maturityAmt = val.replace(/BSA/gi, autoFmt(p.sumAssured, "₹"));
                        }
                    }
                }
                return p;
            });
        });
        return masterList;
    } catch (e) { 
        console.warn("Sync failed:", e); 
        return masterList; 
    }
}

function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);
    const headerIdx = rows.findIndex(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (headerIdx === -1) return [];
    const headers = rows[headerIdx].map(h => h.trim());
    return rows.slice(headerIdx + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        const rawFullName = obj["Policy_Name"] || "";
        if (rawFullName.includes(":")) {
            const parts = rawFullName.split(":");
            obj.company = parts[0].trim();
            obj.name = parts[1].trim(); 
        }
        const rawCategory = obj["Category"] || "";
        obj.type = rawCategory.includes(":") ? rawCategory.split(":")[1].trim() : (rawCategory || "Savings");
        return obj;
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}
