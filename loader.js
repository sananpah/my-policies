/* loader.js - v4.5.2 - Nominee Sync, SG 3-Part Term & Multi-line Logic */
import { toNum, autoFmt, monthMap } from './utils.js?v=1.0.2';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    const TODAY = new Date();

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
                    // 1. Basic Policy Info
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
                    
                    // ... Nominee() Mapping ...
                    const nomineeRaw = String(match["Nominee"] || "").trim();
                    p.nominees = []; 
                    
                    if (!nomineeRaw || nomineeRaw.toLowerCase() === "n/a") {
                        p.nomineeStatus = nomineeRaw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
                    } else {
                        p.nomineeStatus = "ASSIGNED";
                        
                        // NEW REGEX: Splits by comma, "and", "&", OR newlines (\n or \r)
                        const names = nomineeRaw.split(/,|\band\b|&|\n|\r/).map(n => n.trim());
                        
                        names.forEach(name => {
                            // Scrub any non-printable characters that Excel might have left behind
                            const cleanName = name.replace(/[^\x20-\x7E]/g, "").trim();
                            if (!cleanName) return; // Skip empty segments
                    
                            const matchName = cleanName.toLowerCase();
                            let img = "avatar_unknown.png"; 
                            
                            const mappedEntry = Object.entries(insuredMap).find(([fullName]) => 
                                matchName.includes(fullName.toLowerCase())
                            );
                    
                            if (mappedEntry) img = mappedEntry[1].img;
                            
                            p.nominees.push({ name: cleanName, img: img });
                        });
                    }
                    

                    // 2. Date & Term Logic (SG: SurrenderFree:Mat:MIP)
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
                    const isULIP = (p.type || "").toUpperCase().includes("ULIP");
                    const sym = (country === "singapore") ? "$" : "₹";

                    // 3. India Specific: MoneyBack & Step-Up
                    if (country === "india") {
                        const mbLine = rawBenefits.split(/\r?\n/).find(l => l.toLowerCase().includes("moneyback"));
                        p.payoutSchedule = {}; 
                        if (mbLine && mbLine.includes(":")) {
                            const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                            content.split(",").forEach(seg => {
                                const parts = seg.split(":").map(s => s.trim());
                                if (parts.length < 2) return;
                                const range = parts[0];
                                const valRaw = parts[1];
                                let numOnly = toNum(valRaw);
                                let baseVal = valRaw.toLowerCase().includes("%bsa") ? (p.sumAssured * (numOnly / 100)) : numOnly;
                                if (range.includes("-")) {
                                    const [s, e] = range.split("-").map(Number);
                                    const hasStep = parts[2]?.toUpperCase() === "STEP";
                                    const stepInterval = hasStep ? parseInt(parts[3]) : 0;
                                    const stepPercent = hasStep ? parseInt(parts[4]) : 0;
                                    for (let y = s; y <= e; y++) {
                                        let finalVal = baseVal;
                                        if (hasStep && y >= s + stepInterval) {
                                            const stepsPassed = Math.floor((y - s) / stepInterval);
                                            finalVal = Math.round(baseVal * (1 + (stepsPassed * (stepPercent / 100))));
                                        }
                                        p.payoutSchedule[y] = finalVal;
                                    }
                                } else {
                                    const y = parseInt(range);
                                    if (!isNaN(y)) p.payoutSchedule[y] = baseVal;
                                }
                            });
                        }
                    }

                    // 4. Singapore Specific: Withdrawal Parsing
                    if (country === "singapore") {
                        const lines = rawBenefits.split(/\r?\n/);
                        const withdrawLine = lines.find(l => l.toLowerCase().trim().startsWith("withdrawal"));
                        p.withdrawals = [];
                        if (withdrawLine) {
                            const cleanLine = withdrawLine.replace(/,/g, ''); 
                            const matches = cleanLine.match(/\d+(\.\d+)?/g); 
                            if (matches) p.withdrawals = matches.map(Number);
                        }
                    }

                    // 5. Shared ULIP Projection Engine
                    if (isULIP) {
                        const currentVal = toNum(p.currentUnitValue);
                        const annPrem = toNum(p.premium);
                        const startYear = TODAY.getFullYear();
                        const endProjectionYear = (country === "singapore") ? (startY + surrenderFreeYear + 2) : (startY + p.ppt);

                        const calculateProjection = (rate) => {
                            let projected = currentVal;
                            for (let yr = startYear; yr < endProjectionYear; yr++) {
                                if (yr < (startY + surrenderFreeYear)) projected += annPrem;
                                projected = projected * (1 + rate);
                            }
                            return projected;
                        };
                        p.maturityAmt = `Est. @4%: ${autoFmt(calculateProjection(0.04), sym)}<br>Est. @8%: ${autoFmt(calculateProjection(0.08), sym)}*`;
                    } else {
                        const maturityLine = rawBenefits.split(/\r?\n/).find(l => l.trim().startsWith("Maturity Benefit"));
                        if (maturityLine) {
                            let val = maturityLine.split(":")[1]?.trim() || "";
                            val = val.replace(/(\d+)%BSA/gi, (m, pct) => autoFmt((p.sumAssured * parseFloat(pct)/100), sym));
                            p.maturityAmt = val.replace(/BSA/gi, autoFmt(p.sumAssured, sym));
                        }
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
