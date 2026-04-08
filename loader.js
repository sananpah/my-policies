/* loader.js - v4.3.6 - Smart MoneyBack Parser & Data Sync */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export const autoFmt = (val, sym) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return sym + "0";
    return sym + Math.round(n).toLocaleString('en-IN');
};

const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };

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

        const cleanNumeric = (raw) => {
            if (!raw || raw === "No Value") return 0;
            return parseFloat(String(raw).replace(/[^\x00-\x7F]/g, "").replace(/[^\d.]/g, "")) || 0;
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
                    if (identity) { p.avatarPath = identity.img; p.holderType = identity.type; }

                    p.premium = cleanNumeric(match["Premium"]);
                    p.sumAssured = cleanNumeric(match["Sum Assured"]);
                    p.currentUnitValue = match["Current Value"] || "No Value";

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

                    if (country === "india") {
                        const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                        const mbLine = rawBenefits.split(/\r?\n/).find(l => l.toLowerCase().includes("moneyback"));
                        p.payoutSchedule = {}; 
                        
                        if (mbLine && mbLine.includes(":")) {
                            const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                            content.split(",").forEach(seg => {
                                if (!seg.includes(":")) return;
                                const [range, valRaw] = seg.split(":").map(s => s.trim());
                                
                                let numOnly = parseFloat(valRaw.replace(/[^\d.]/g, ""));
                                let annualVal = 0;

                                // --- SMART DETECTION ---
                                if (valRaw.toLowerCase().includes("%bsa")) {
                                    annualVal = (p.sumAssured || 0) * (numOnly / 100);
                                } else {
                                    annualVal = numOnly; // Use flat amount (₹ 100,000)
                                }

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
