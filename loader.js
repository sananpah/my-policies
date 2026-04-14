/* loader.js - v4.5.25 - Minimal Fix: No Variable Changes */
import { toNum, autoFmt, monthMap, getColorMap, githubLogo } from './utils.js?v=1.0.4';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    const TODAY = new Date();

    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        /* loader.js - Update the map keys */

        const insuredMap = {
            "Self": { type: "Self", img: "avatar_self.png" },
            "Wife": { type: "Wife", img: "avatar_wife.png" },
            "Daughter": { type: "Daughter", img: "avatar_daughter.png" },
            "Family": { type: "Family", img: "avatar_family.png" },
            // Keep these for your Google Sheet sync logic
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
                    p.color = getColorMap(p.company);
                    p.type = match.type || p.type;
                    p.logo = `${githubLogo}logo_${p.company.replace(/[\s.]/g, "")}.png`;

                    const identity = insuredMap[match["Insured"]];
                    if (identity) { 
                        p.avatarPath = identity.img; 
                        p.holderType = identity.type; 
                    }

                    p.premium = toNum(match["Premium"]);
                    p.totalPremiumPaid = toNum(match["Total Premium"]); 

                    p.sumAssured = toNum(match["Sum Assured"]);
                    p.unitValueNumeric = toNum(match["Current Value"]);
                    p.currentUnitValue = match["Current Value"] || "No Value";

                    const nomineeRaw = String(match["Nominee"] || "").trim();
                    p.nominees = []; 
                    if (!nomineeRaw || nomineeRaw.toLowerCase() === "n/a") {
                        p.nomineeStatus = nomineeRaw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
                    } else {
                        p.nomineeStatus = "ASSIGNED";
                        const names = nomineeRaw.split(/,|\band\b|&|\n|\r/).map(n => n.trim());
                        names.forEach(name => {
                            const cleanName = name.replace(/[^\x20-\x7E]/g, "").trim();
                            if (!cleanName) return;
                            const matchName = cleanName.toLowerCase();
                            let img = "avatar_unknown.png"; 
                            const mappedEntry = Object.entries(insuredMap).find(([fullName]) => matchName.includes(fullName.toLowerCase()));
                            if (mappedEntry) img = mappedEntry[1].img;
                            p.nominees.push({ name: cleanName, img: img });
                        });
                    }

                    const otherDataRaw = String(match["Other Data"] || "").trim();
                    p.uin = "N/A"; p.clientId = "N/A";
                    p.surrenderCharges = null; p.surrenderBase = "VALUATION";

                    if (otherDataRaw && otherDataRaw.toLowerCase() !== "n/a") {
                        const lines = otherDataRaw.split(/\n|\r/);
                        lines.forEach(line => {
                            const cleanLine = line.trim().toLowerCase();
                            if (cleanLine.startsWith("uin:")) p.uin = line.split(":")[1]?.trim() || "N/A";
                            else if (cleanLine.startsWith("clientid:")) {
                                if (!(p.type || "").toUpperCase().includes("ULIP")) p.clientId = line.split(":")[1]?.trim() || "N/A";
                            }
                            else if (cleanLine.startsWith("surrender:")) {
                                const content = line.split(":")[1] || "";
                                p.surrenderBase = content.includes("[pp]") ? "PREMIUM" : "VALUATION";
                                const rawValues = content.replace(/\[.*?\]/g, "").split(",");
                                p.surrenderCharges = {};
                                rawValues.forEach((val, index) => {
                                    const cleanVal = parseInt(val.trim());
                                    if (!isNaN(cleanVal)) p.surrenderCharges[index + 1] = cleanVal;
                                });
                            }
                        });
                    }
                    if (!p.surrenderCharges) p.surrenderCharges = { 1: 0 };

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
                    const isULIP = (p.type || "").toUpperCase().includes("ULIP") || (country === "singapore");
                    const sym = (country === "singapore") ? "$" : "₹";

                    const benefitsLines = rawBenefits.split(/\r?\n/);
                    const withdrawLine = benefitsLines.find(l => l.toLowerCase().trim().includes("withdraw"));
                    p.withdrawals = [];

                    if (withdrawLine) {
                        const content = withdrawLine.split(":")[1] || "";
                        const segments = content.split(",");
                        segments.forEach(seg => {
                            const cleanNum = seg.replace(/[$\s,]/g, "");
                            const val = parseFloat(cleanNum);
                            if (!isNaN(val)) p.withdrawals.push(val);
                        });
                    }

                    if (country === "india") {
                        const mbLine = benefitsLines.find(l => l.toLowerCase().includes("moneyback"));
                        p.payoutSchedule = {}; 
                        if (mbLine && mbLine.includes(":")) {
                            const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                            content.split(",").forEach(seg => {
                                const parts = seg.split(":").map(s => s.trim());
                                if (parts.length < 2) return;
                                const range = parts[0];
                                const baseVal = parts[1].toLowerCase().includes("%bsa") ? (p.sumAssured * (toNum(parts[1]) / 100)) : toNum(parts[1]);
                                if (range.includes("-")) {
                                    const [s, e] = range.split("-").map(Number);
                                    for (let y = s; y <= e; y++) p.payoutSchedule[y] = baseVal;
                                } else if (!isNaN(parseInt(range))) { 
                                    p.payoutSchedule[parseInt(range)] = baseVal; 
                                }
                            });
                        }
                    }

                    if (isULIP) {
                        const calculateProjection = (rate) => {
                            let projected = p.unitValueNumeric;
                            const currentYear = TODAY.getFullYear();
                            
                            let targetYear = (country === "india") ? (startY + matYears) : (startY + surrenderFreeYear + 2);
                            let stopPayYear = (country === "india") ? (startY + surrenderFreeYear) : (startY + p.mip);
                            
                            if (country === "singapore" && surrenderFreeYear === matYears) {
                                targetYear = startY + matYears;
                                stopPayYear = targetYear;
                            }

                            for (let yr = currentYear; yr < targetYear; yr++) {
                                if (yr < stopPayYear) projected += p.premium;
                                projected = projected * (1 + rate);
                            }
                            return { v: projected, t: targetYear, s: stopPayYear };
                        };

                        const r4 = calculateProjection(0.04);
                        const r8 = calculateProjection(0.08);

                        const disclaimer = `<div style="font-size:0.55rem; opacity:0.6; margin-top:4px; font-style:italic;">` +
                            `*Pay till ${r4.s}, Grow till ${r4.t}</div>`;

                        p.maturityAmt = `Est. @4%: ${autoFmt(r4.v, sym)}<br>` +
                                       `Est. @8%: ${autoFmt(r8.v, sym)}` + 
                                       disclaimer;
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
