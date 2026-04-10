/* loader.js - v4.5.0 - Dynamic Nominee Mapping & SG 3-Part Term */
import { toNum, autoFmt, monthMap } from './utils.js';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    const TODAY = new Date();
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        // Single Source of Truth for Family Avatars
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
                    p.name = match.name || p.name;
                    p.company = match.company || p.company;
                    p.type = match.type || p.type;
                    p.logo = `logo_${p.company.replace(/[\s.]/g, "")}.png`;

                    const identity = insuredMap[match["Insured"]];
                    if (identity) { 
                        p.avatarPath = identity.img; 
                        p.holderType = identity.type; 
                    }

                    p.premium = toNum(match["Premium"]);
                    p.sumAssured = toNum(match["Sum Assured"]);
                    p.unitValueNumeric = toNum(match["Current Value"]);
                    p.currentUnitValue = match["Current Value"] || "No Value";

                    // --- REFINED NOMINEE LOGIC (Referencing insuredMap) ---
                    const nomineeRaw = String(match["Nominee"] || "").trim();
                    p.nominees = []; 
                    if (!nomineeRaw || nomineeRaw.toLowerCase() === "n/a") {
                        p.nomineeStatus = nomineeRaw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
                    } else {
                        p.nomineeStatus = "ASSIGNED";
                        const names = nomineeRaw.split(/,|\band\b|&/i).map(n => n.trim());
                        names.forEach(name => {
                            const matchName = name.toLowerCase();
                            let img = "avatar_unknown.png"; 
                            
                            // Dynamically find matching family member from insuredMap
                            const mappedEntry = Object.entries(insuredMap).find(([fullName]) => 
                                matchName.includes(fullName.toLowerCase())
                            );
                            if (mappedEntry) img = mappedEntry[1].img;
                            
                            p.nominees.push({ name: name, img: img });
                        });
                    }

                    // --- TERM & DATE LOGIC ---
                    let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' '); 
                    p.commenced = rawDate;
                    const dateParts = rawDate.split(" ");
                    const startY = parseInt(dateParts[2]);

                    const rawTermStr = String(match["Term"] || "");
                    const termParts = rawTermStr.includes(":") ? rawTermStr.split(":") : [0, 0, 0];
                    const surrenderFreeYear = parseInt(termParts[0], 10) || 0;
                    const matYears = parseInt(termParts[1], 10) || 0;
                    
                    p.mip = termParts[2] ? parseInt(termParts[2], 10) : surrenderFreeYear; 
                    p.ppt = surrenderFreeYear; 

                    if (!isNaN(startY)) {
                        p.premiumEnds = `${dateParts[0]} ${dateParts[1]} ${startY + surrenderFreeYear - 1}`;
                        p.maturity = `${dateParts[0]} ${dateParts[1]} ${startY + matYears}`;
                    }

                    const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                    const sym = (country === "singapore") ? "$" : "₹";

                    // --- PROJECTION LOGIC ---
                    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
                    if (isULIP) {
                        const endProj = (country === "singapore") ? (startY + surrenderFreeYear + 2) : (startY + p.ppt);
                        const calc = (rate) => {
                            let proj = p.unitValueNumeric;
                            for (let yr = TODAY.getFullYear(); yr < endProj; yr++) {
                                if (yr < (startY + surrenderFreeYear)) proj += p.premium;
                                proj *= (1 + rate);
                            }
                            return proj;
                        };
                        p.maturityAmt = `Est. @4%: ${autoFmt(calc(0.04), sym)}<br>Est. @8%: ${autoFmt(calc(0.08), sym)}*`;
                    }
                }
                return p;
            });
        });
        return masterList;
    } catch (e) { console.warn("Sync failed:", e); return masterList; }
}

function processCSV(csv) {
    const rows = [];
    let cur = [''], inQ = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { cur[cur.length-1] += '"'; i++; }
        else if (char === '"') inQ = !inQ;
        else if (char === ',' && !inQ) cur.push('');
        else if (char === '\n' && !inQ) { rows.push(cur); cur = ['']; }
        else cur[cur.length-1] += char;
    }
    rows.push(cur);
    const hIdx = rows.findIndex(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (hIdx === -1) return [];
    const headers = rows[hIdx].map(h => h.trim());
    return rows.slice(hIdx + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        const rawFullName = obj["Policy_Name"] || "";
        if (rawFullName.includes(":")) {
            const parts = rawFullName.split(":");
            obj.company = parts[0].trim();
            obj.name = parts[1].trim(); 
        }
        const rawCat = obj["Category"] || "";
        obj.type = rawCat.includes(":") ? rawCat.split(":")[1].trim() : (rawCat || "Savings");
        return obj;
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}
