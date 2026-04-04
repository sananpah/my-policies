/* loader.js - v4.1.05 - Final Integrated Sync */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    try {
        // 1. FETCH & DECODE
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

        // 2. THE DIGIT-ONLY FORTRESS (Fixes ₹209 error)
        const cleanNumeric = (raw) => {
            if (!raw) return 0;
            let str = String(raw).trim();
            // Remove Non-ASCII Junk (â‚¹, Â, etc.)
            str = str.replace(/[^\x00-\x7F]/g, ""); 
            // Extract only digits
            const digitsOnly = str.replace(/\D/g, ""); 
            return parseInt(digitsOnly, 10) || 0;
        };

        // 3. PROCESS COUNTRIES
        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                // Match "Policy No." from Sheet to "id" in data.js
                const match = sheetRecords.find(row => 
                    String(row["Policy No."] || "").trim() === String(staticPolicy.id).trim()
                );

                if (match) {
                    // Update Name/Company from Policy_Name column (Format: Company : Name)
                    const rawFullName = match["Policy_Name"] || "";
                    if (rawFullName.includes(":")) {
                        const parts = rawFullName.split(":");
                        staticPolicy.company = parts[0].trim();
                        staticPolicy.name = parts[1].trim(); 
                    }

                    // --- DATE MAPPING & MATURITY CALCULATION ---
                    const rawComm = match["Commenced Date"] || "";
                    const dateMatch = rawComm.match(/(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{4})/);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    if (dateMatch) {
                        const d = dateMatch[1].padStart(2, '0');
                        const mIdx = parseInt(dateMatch[2], 10) - 1;
                        const m = months[mIdx] || "Jan";
                        const y = dateMatch[3];
                        
                        // Set Commenced Date
                        staticPolicy.commenced = `${d} ${m} ${y}`;

                        // Calculate Maturity from Term (Format: PPT:MAT:MIP)
                        const rawTerm = String(match["Term"] || "");
                        if (rawTerm.includes(":")) {
                            const matYears = parseInt(rawTerm.split(":")[1], 10);
                            if (!isNaN(matYears)) {
                                staticPolicy.maturity = `${d} ${m} ${parseInt(y) + matYears}`;
                            }
                        }
                    }

                    // Financials
                    staticPolicy.premium = cleanNumeric(match["Premium"]);
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    staticPolicy.sumAssured = (rawSA.includes("not")) ? 0 : cleanNumeric(match["Sum Assured"]);

                    // India Specifics (Avatar/Insured)
                    if (country === "india") {
                        const identity = insuredMap[match["Insured"]];
                        if (identity) {
                            staticPolicy.avatarPath = identity.img;
                            staticPolicy.holderType = identity.type;
                        }
                    }
                }
                return staticPolicy;
            });
        });

        console.log("✅ v4.1.05: Full Data Sync Complete.");
        return masterList;
    } catch (e) { 
        console.error("❌ Sync Error:", e);
        return masterList; 
    }
}

// Robust CSV Parser (Handles Quotes and Commas inside values)
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
    const headerRow = rows.find(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (!headerRow) return [];
    const headers = headerRow.map(h => h.trim());
    return rows.slice(rows.indexOf(headerRow) + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        return obj;
    }).filter(o => o["Policy_Name"] && o["Policy_Name"] !== "EMPTY");
}
