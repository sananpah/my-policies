/* loader.js - v4.1.03 - Strict Header Mapping */
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
                const match = sheetRecords.find(row => row["Policy No."] === staticPolicy.id);

                if (match) {
                    // Update CORE attributes
                    staticPolicy.name = match["Policy_Name"]?.split(':')[1]?.trim() || match.name;
                    staticPolicy.company = match["Policy_Name"]?.split(':')[0]?.trim() || match.company;
                    
                    // DATE MAPPING
                    const rawComm = match["Commenced Date"] || "";
                    const dateMatch = rawComm.match(/(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{4})/);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    if (dateMatch) {
                        const d = dateMatch[1].padStart(2, '0');
                        const m = months[parseInt(dateMatch[2]) - 1];
                        const y = dateMatch[3];
                        staticPolicy.commenced = `${d} ${m} ${y}`;

                        // MATURITY CALCULATION
                        const rawTerm = String(match["Term"] || "");
                        if (rawTerm.includes(":")) {
                            const matYears = parseInt(rawTerm.split(":")[1], 10);
                            if (!isNaN(matYears)) {
                                staticPolicy.maturity = `${d} ${m} ${parseInt(y) + matYears}`;
                            }
                        }
                    }

                    staticPolicy.premium = cleanNumeric(match["Premium"]);
                    staticPolicy.sumAssured = cleanNumeric(match["Sum Assured"]);
                    
                    if (country === "india" && match["Insured"]) {
                        const insuredMap = {
                            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
                            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
                            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
                        };
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
        return obj;
    });
}
