/* loader.js - v4.6.6 - RESTORED: India Logic, Next Due, Paid Badges & Consolidated Fix */
import { toNum, autoFmt, getColorMap, getTimeRemaining } from './utils.js?v=1.0.3';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";
const githubLogo = "https://raw.githubusercontent.com/sananpah/my-policies/main/assets/logo/";

export async function syncWithGoogleSheets() {
    const TODAY = new Date();
    let masterList = { india: [], singapore: [] };

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

        sheetRecords.forEach(match => {
            const otherDataRaw = String(match["Other Data"] || "").trim().toLowerCase();
            const isIndia = otherDataRaw.includes("uin:");
            const countryKey = isIndia ? "india" : "singapore";
            const sym = isIndia ? "₹" : "$";

            if (masterList[countryKey]) {
                let p = {};
                p.id = String(match["Policy No."]).trim();
                p.name = match.name;
                p.company = match.company;
                p.type = match.type;
                p.color = getColorMap(p.company);
                p.logo = `${githubLogo}logo_${p.company.replace(/[\s.]/g, "")}.png`;

                const identity = insuredMap[match["Insured"]];
                if (identity) { 
                    p.avatarPath = identity.img; 
                    p.holderType = identity.type; 
                }

                // Financials & Consolidated Fix
                p.premium = toNum(match["Premium"]);
                p.totalPremiumPaid = toNum(match["Total Premium"]); 
                p.sumAssured = toNum(match["Sum Assured"]);
                p.unitValueNumeric = toNum(match["Current Value"]);
                p.currentUnitValue = match["Current Value"] || "No Value";
                
                // --- RESTORED: PAID STATUS & NEXT DUE LOGIC ---
                p.dueDate = String(match["Due Date"] || "").toUpperCase();
                p.isPaidUp = (p.dueDate === "PAID UP");
                
                // --- DATES & TERM (MIP FIX) ---
                let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' '); 
                p.commenced = rawDate;
                const dateParts = rawDate.split(" ");
                const startY = parseInt(dateParts[2]);
                const termParts = String(match["Term"] || "").split(":");
                const ppt = parseInt(termParts[0]) || 0;
                const mat = parseInt(termParts[1]) || 0;
                p.mip = termParts[2] ? parseInt(termParts[2]) : ppt; 
                p.ppt = ppt;

                if (!isNaN(startY)) {
                    p.maturity = `${dateParts[0]} ${dateParts[1]} ${startY + mat}`;
                    // RESTORED: India countdown logic
                    if (countryKey === "india") {
                        p.nextDue = p.isPaidUp ? "PAID UP" : `${dateParts[0]} ${dateParts[1]} ${TODAY.getFullYear() + (TODAY.getMonth() > 10 ? 1 : 0)}`;
                        p.timeRemaining = p.isPaidUp ? "Fully Paid" : getTimeRemaining(p.nextDue);
                    }
                }

                // Nominees & Other Data (same as 4.6.5)
                const nomineeRaw = String(match["Nominee"] || "").trim();
                p.nominees = []; 
                if (!nomineeRaw || nomineeRaw.toLowerCase() === "n/a") {
                    p.nomineeStatus = nomineeRaw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
                } else {
                    p.nomineeStatus = "ASSIGNED";
                    const names = nomineeRaw.split(/,|\band\b|&|\n|\r/).map(n => n.trim());
                    names.forEach(name => {
                        const cleanN = name.replace(/[^\x20-\x7E]/g, "").trim();
                        if (!cleanN) return;
                        const matchName = cleanN.toLowerCase();
                        let img = "avatar_unknown.png"; 
                        const mappedEntry = Object.entries(insuredMap).find(([fn]) => matchName.includes(fn.toLowerCase()));
                        if (mappedEntry) img = mappedEntry[1].img;
                        p.nominees.push({ name: cleanN, img: img });
                    });
                }

                p.uin = "N/A"; p.clientId = "N/A";
                p.surrenderCharges = null; p.surrenderBase = "VALUATION";
                if (otherDataRaw !== "n/a") {
                    otherDataRaw.split(/\n|\r/).forEach(line => {
                        const cleanLine = line.trim().toLowerCase();
                        if (cleanLine.startsWith("uin:")) p.uin = line.split(":")[1]?.trim().toUpperCase();
                        else if (cleanLine.startsWith("clientid:")) p.clientId = line.split(":")[1]?.trim().toUpperCase();
                        else if (cleanLine.startsWith("surrender:")) {
                            const content = line.split(":")[1] || "";
                            p.surrenderBase = content.includes("[av]") ? "VALUATION" : "PREMIUM";
                            p.surrenderCharges = {};
                            content.replace(/\[.*?\]/g, "").split(",").forEach((val, idx) => {
                                const v = parseInt(val.trim());
                                if (!isNaN(v)) p.surrenderCharges[idx + 1] = v;
                            });
                        }
                    });
                }

                // --- RESTORED: MULTI-WITHDRAWAL PARSER ---
                const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                const benefitsLines = rawBenefits.split(/\r?\n/);
                const withdrawLine = benefitsLines.find(l => l.toLowerCase().trim().includes("withdraw"));
                p.withdrawals = [];
                if (withdrawLine) {
                    (withdrawLine.split(":")[1] || "").split(",").forEach(seg => {
                        const cleanNum = seg.replace(/[$\s,]/g, "");
                        const val = parseFloat(cleanNum);
                        if (!isNaN(val)) p.withdrawals.push(val);
                    });
                }

                // India-Specific: Moneyback & Projections
                if (countryKey === "india") {
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

                if ((p.type || "").toUpperCase().includes("ULIP")) {
                    const calculateProjection = (rate) => {
                        let projected = p.unitValueNumeric;
                        const targetYear = (startY + p.mip + (countryKey === "singapore" ? 2 : 0));
                        for (let yr = TODAY.getFullYear(); yr < targetYear; yr++) {
                            if (yr < (startY + ppt)) projected += p.premium;
                            projected = projected * (1 + rate);
                        }
                        return projected;
                    };
                    p.maturityAmt = `Est. @4%: ${autoFmt(calculateProjection(0.04), sym)}<br>Est. @8%: ${autoFmt(calculateProjection(0.08), sym)}*`;
                }
                
                masterList[countryKey].push(p);
            }
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
    const headerRow = rows.find(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (!headerRow) return [];
    const headers = headerRow.map(h => h.trim());
    return rows.slice(rows.indexOf(headerRow) + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;
        const nameParts = obj["Policy_Name"].split(":");
        obj.company = nameParts[0]?.trim();
        obj.name = nameParts[1]?.trim();
        const catParts = (obj["Category"] || "").split(":");
        obj.type = catParts[1]?.trim() || catParts[0]?.trim() || "Savings";
        return obj;
    }).filter(x => x !== null);
}
