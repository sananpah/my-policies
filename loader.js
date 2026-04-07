/* loader.js - v4.3.17 - Stable Logic Restoration */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export const autoFmt = (val, sym) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return sym + "0";
    return sym + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const csvData = await response.text();
        const sheetRecords = processCSV(csvData);

        const cleanNumeric = (raw) => {
            if (!raw || raw === "No Value") return 0;
            return parseFloat(String(raw).replace(/[^\x00-\x7F]/g, "").replace(/[^\d.]/g, "")) || 0;
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;
            masterList[country] = masterList[country].map(p => {
                const match = sheetRecords.find(row => String(row["Policy No."]).trim() === String(p.id).trim());
                if (!match) return p;

                p.name = match.name;
                p.company = match.company;
                p.type = match.type;
                p.logo = `logo_${p.company.replace(/[\s.]/g, "")}.png`;
                p.premium = cleanNumeric(match["Premium"]);
                p.sumAssured = cleanNumeric(match["Sum Assured"]);
                p.currentUnitValue = match["Current Value"] || "No Value";
                p.unitValueNumeric = cleanNumeric(p.currentUnitValue);

                let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' '); 
                p.commenced = rawDate;
                const dateParts = rawDate.split(" ");
                const startY = parseInt(dateParts[2]);

                const rawTermStr = String(match["Term"] || "");
                if (rawTermStr.includes(":")) {
                    const parts = rawTermStr.split(":");
                    p.ppt = parseInt(parts[0], 10);
                    p.premiumEnds = `${dateParts[0]} ${dateParts[1]} ${startY + p.ppt}`;
                    p.maturity = `${dateParts[0]} ${dateParts[1]} ${startY + parseInt(parts[1], 10)}`;
                }

                if (country === "india") {
                    p.payoutSchedule = {};
                    const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                    const mbLine = rawBenefits.split(/\r?\n/).find(l => l.toLowerCase().includes("moneyback"));
                    
                    if (mbLine && mbLine.includes(":")) {
                        const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                        content.split(",").forEach(seg => {
                            const parts = seg.split(":").map(s => s.trim());
                            if (parts.length < 2) return;
                            let base = cleanNumeric(parts[1]);
                            if (parts[1].toLowerCase().includes("%bsa")) base = p.sumAssured * (base / 100);
                            const [s, e] = parts[0].includes("-") ? parts[0].split("-").map(Number) : [Number(parts[0]), Number(parts[0])];
                            for (let y = s; y <= e; y++) {
                                let val = base;
                                if (parts[2] === "STEP") {
                                    const stepY = parseInt(parts[3]), stepP = parseFloat(parts[4]) / 100;
                                    val = base + (Math.floor((y - s) / stepY) * (base * stepP));
                                }
                                p.payoutSchedule[y] = val; // Store exact number
                            }
                        });
                    }
                }
                return p;
            });
        });
        return masterList;
    } catch (e) { return masterList; }
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
        } else { obj.company = "Unknown"; obj.name = rawFullName; }
        const rawCat = obj["Category"] || "";
        obj.type = rawCat.includes(":") ? rawCat.split(":")[1].trim() : (rawCat || "Savings");
        return obj;
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}
