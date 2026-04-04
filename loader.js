/* loader.js - v4.0.97 - Maturity Handshake & Junk-Safe Sync */
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

        // Internal Helper: The Digit-Only Fortress (Fixed v4.0.96 logic)
        const cleanNumeric = (raw) => {
            if (!raw) return 0;
            let str = String(raw).trim();
            str = str.replace(/[^\x00-\x7F]/g, ""); // Remove Non-ASCII Junk
            const digitsOnly = str.replace(/\D/g, ""); // Strip all non-digits
            const num = parseFloat(digitsOnly);
            return isNaN(num) ? 0 : num;
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                const match = sheetRecords.find(row => row["Policy No."] === staticPolicy.id);

                if (match) {
                    staticPolicy.name = match.name;
                    staticPolicy.company = match.company;
                    staticPolicy.type = match.type;

                    // 1. Live Premium & Sum Assured
                    staticPolicy.premium = cleanNumeric(match["Premium"]);
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    staticPolicy.sumAssured = (rawSA.includes("not")) ? 0 : cleanNumeric(match["Sum Assured"]);

                    // 2. Commenced Date & Maturity Calculation
                    const rawDate = String(match["Commenced Date"] || "");
                    const dateMatch = rawDate.match(/(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{4})/);
                    
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    if (dateMatch) {
                        const commDay = dateMatch[1].padStart(2, '0');
                        const commMonthIdx = parseInt(dateMatch[2], 10) - 1;
                        const commYear = parseInt(dateMatch[3], 10);
                        
                        // Set Commenced Date (dd MMM yyyy)
                        staticPolicy.commenced = `${commDay} ${months[commMonthIdx]} ${commYear}`;

                        // --- NEW: Maturity Calculation (PPT:MaturityYears:MIP) ---
                        const rawTerm = String(match["Term"] || "");
                        if (rawTerm.includes(":")) {
                            const termParts = rawTerm.split(":");
                            // Extract middle value (Maturity Years)
                            const matYears = parseInt(termParts[1]?.trim(), 10);
                            
                            if (!isNaN(matYears)) {
                                const matYear = commYear + matYears;
                                staticPolicy.maturity = `${commDay} ${months[commMonthIdx]} ${matYear}`;
                            }
                        }
                    }

                    // 3. Avatar Mapping (India Only)
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

        console.log("✅ v4.0.97: Maturity Handshake Active.");
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
