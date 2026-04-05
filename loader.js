/* loader.js - v4.1.4 - Multi-Currency + MIP Extraction + Term Logic */
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

        // Internal cleaner for basic numbers (handles symbols, commas, and spaces)
        const cleanNumeric = (raw) => {
            if (!raw || raw === "No Value") return 0;
            let str = String(raw).trim();
            str = str.replace(/[^\x00-\x7F]/g, ""); // Junk Fix
            str = str.replace(/[^\d.]/g, "");       // Strip all but digits and dots
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

                    // --- STEP 1: DOT-TO-SPACE & COMMENCED DATE ---
                    let rawDate = String(match["Commenced Date"] || "").trim();
                    p.commenced = rawDate.replace(/\./g, ' '); 

                    // --- STEP 2: PPT:MAT:MIP TERM CALCULATION ---
                    const rawTerm = String(match["Term"] || ""); 
                    if (rawTerm.includes(":")) {
                        const termParts = rawTerm.split(":");
                        const ppt = parseInt(termParts[0], 10);
                        const mat = parseInt(termParts[1], 10);
                        const mipValue = parseInt(termParts[2], 10); // Extract 3rd value

                        // Singapore-specific MIP mapping
                        if (country === "singapore") {
                            p.mip = isNaN(mipValue) ? -1 : mipValue;
                        }

                        // Date Calculation
                        if (p.commenced.includes(" ")) {
                            const startParts = p.commenced.split(" ");
                            const startYear = parseInt(startParts[2], 10);
                            
                            if (!isNaN(startYear)) {
                                p.premiumEnds = `${startParts[0]} ${startParts[1]} ${startYear + ppt}`;
                                p.maturity = `${startParts[0]} ${startParts[1]} ${startYear + mat}`;
                            }
                        }
                    }

                    // --- STEP 3: FINANCIAL CLEANING ---
                    p.premium = cleanNumeric(match["Premium"]);
                    
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    p.sumAssured = (rawSA.includes("not") || cleanNumeric(match["Sum Assured"]) === 0) ? 0 : cleanNumeric(match["Sum Assured"]);

                    // Current Value logic: Original string for card, clean number for header math
                    const rawCV = match["Current Value"] || "No Value";
                    p.currentUnitValue = rawCV; 
                    p.unitValueNumeric = cleanNumeric(rawCV);

                    // --- STEP 4: AVATAR MAPPING ---
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

        console.log("✅ v4.1.4: Multi-Currency + MIP Term Math Successful.");
        return masterList;
    } catch (e) { 
        console.warn("⚠️ Sync failed:", e);
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
