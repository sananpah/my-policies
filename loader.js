/* loader.js - v4.1.6 - Pure Dynamic Term + Total Premium Sync */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        
        const sheetRecords = processCSV(csvData);

        const insuredMap = {
            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
        };

        const cleanNumeric = (raw) => {
            if (!raw || raw === "No Value") return 0;
            let str = String(raw).trim();
            str = str.replace(/[^\x00-\x7F]/g, ""); 
            str = str.replace(/[^\d.]/g, "");       
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(p => {
                const match = sheetRecords.find(row => String(row["Policy No."]).trim() === String(p.id).trim());

                if (match) {
                    p.name = match.name || p.name;
                    p.company = match.company || p.company;
                    p.type = match.type || p.type;

                    // Date Cleaning
                    let rawDate = String(match["Commenced Date"] || "").trim();
                    p.commenced = rawDate.replace(/\./g, ' '); 

                    // Term Extraction (PPT:MAT:MIP)
                    const rawTerm = String(match["Term"] || ""); 
                    if (rawTerm.includes(":")) {
                        const termParts = rawTerm.split(":");
                        const pptVal = parseInt(termParts[0], 10);
                        const matVal = parseInt(termParts[1], 10);
                        const mipVal = parseInt(termParts[2], 10);

                        if (country === "singapore") {
                            p.ppt = isNaN(pptVal) ? 0 : pptVal;
                            p.mip = isNaN(mipVal) ? 0 : mipVal;
                            
                            // NEW: Total Premium Sync
                            const rawTotal = match["Total Premium"] || "0";
                            p.totalPremiumPaid = cleanNumeric(rawTotal);
                        }

                        if (p.commenced.includes(" ")) {
                            const startParts = p.commenced.split(" ");
                            const startYear = parseInt(startParts[2], 10);
                            if (!isNaN(startYear)) {
                                p.premiumEnds = `${startParts[0]} ${startParts[1]} ${startYear + pptVal}`;
                                p.maturity = `${startParts[0]} ${startParts[1]} ${startYear + matVal}`;
                            }
                        }
                    }

                    // Financials
                    p.premium = cleanNumeric(match["Premium"]);
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    p.sumAssured = (rawSA.includes("not") || cleanNumeric(match["Sum Assured"]) === 0) ? 0 : cleanNumeric(match["Sum Assured"]);

                    const rawCV = match["Current Value"] || "No Value";
                    p.currentUnitValue = rawCV; 
                    p.unitValueNumeric = cleanNumeric(rawCV);

                    if (country === "india") {
                        const identity = insuredMap[match["Insured"]];
                        if (identity) {
                            p.avatarPath = identity.img;
                            p.holderType = identity.type;
                        }
                    }
                }
                return p;
            });
        });

        console.log("✅ v4.1.6: Total Premium & Term Sync Successful.");
        return masterList;
    } catch (e) { 
        console.warn("⚠️ Sync failed:", e);
        return masterList; 
    }
}

// ... rest of processCSV and parseInsuranceTab (unchanged) ...
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
        if (!obj["Policy_Name"] && rowData[0]?.includes(":")) obj["Policy_Name"] = rowData[0];
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;
        return parseInsuranceTab(obj);
    }).filter(item => item !== null);
}

function parseInsuranceTab(item) {
    const rawFullName = item["Policy_Name"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        item.company = parts[0].trim();
        item.name = parts[1].trim(); 
    } else {
        item.company = "Insurance";
        item.name = rawFullName;
    }
    const rawCategory = item["Category"] || "";
    item.type = rawCategory.includes(":") ? rawCategory.split(":")[1].trim() : (rawCategory || "Savings");
    return item;
}
