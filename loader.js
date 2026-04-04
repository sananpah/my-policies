/* loader.js - v4.1.06 - The Recovery Engine */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        const sheetRecords = processCSV(csvData);

        const cleanNumeric = (raw) => {
            if (!raw) return 0;
            let str = String(raw).trim().replace(/[^\x00-\x7F]/g, ""); 
            return parseInt(str.replace(/\D/g, ""), 10) || 0;
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                const match = sheetRecords.find(row => 
                    String(row["Policy No."] || "").trim() === String(staticPolicy.id).trim()
                );

                if (match) {
                    // --- 1. CORE IDENTITY ---
                    const rawFullName = match["Policy_Name"] || "";
                    if (rawFullName.includes(":")) {
                        const parts = rawFullName.split(":");
                        staticPolicy.company = parts[0].trim();
                        staticPolicy.name = parts[1].trim(); 
                    }

                    // --- 2. THE BADGE FIX (TYPE) ---
                    // Maps the "Category" or "Type" column from Sheet to p.type
                    const rawCat = match["Category"] || match["Type"] || "Savings";
                    staticPolicy.type = rawCat.includes(":") ? rawCat.split(":")[1].trim() : rawCat;

                    // --- 3. THE DATE FIX ---
                    const rawComm = match["Commenced Date"] || "";
                    const dateMatch = rawComm.match(/(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{4})/);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    if (dateMatch) {
                        const d = dateMatch[1].padStart(2, '0');
                        const m = months[parseInt(dateMatch[2], 10) - 1] || "Jan";
                        const y = dateMatch[3];
                        staticPolicy.commenced = `${d} ${m} ${y}`;

                        // Maturity Calculation
                        const rawTerm = String(match["Term"] || "");
                        if (rawTerm.includes(":")) {
                            const matYears = parseInt(rawTerm.split(":")[1], 10);
                            if (!isNaN(matYears)) {
                                staticPolicy.maturity = `${d} ${m} ${parseInt(y) + matYears}`;
                            }
                        }
                    }

                    // --- 4. FINANCIALS ---
                    staticPolicy.premium = cleanNumeric(match["Premium"]);
                    staticPolicy.sumAssured = cleanNumeric(match["Sum Assured"]);

                    if (country === "india") {
                        const insuredMap = { "Suhail Nami": "Self", "Saima Suhail": "Wife", "Sulmas Nami": "Daughter" };
                        const avatarMap = { "Suhail Nami": "avatar_self.png", "Saima Suhail": "avatar_wife.png", "Sulmas Nami": "avatar_daughter.png" };
                        staticPolicy.holderType = insuredMap[match["Insured"]] || "Self";
                        staticPolicy.avatarPath = avatarMap[match["Insured"]] || "avatar_self.png";
                    }
                }
                return staticPolicy;
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
    const headerRow = rows.find(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (!headerRow) return [];
    const headers = headerRow.map(h => h.trim());
    return rows.slice(rows.indexOf(headerRow) + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        return obj;
    }).filter(o => o["Policy_Name"]);
}
