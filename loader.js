/* loader.js */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

/**
 * MASTER SYNC FUNCTION:
 * Merges Google Sheet data into your static POLICY_DATA.
 */
/* loader.js - Update only the sync logic */

export async function syncWithGoogleSheets(masterList) {
    // ... your existing fetch and processCSV code ...

    // 1. Private mapping - names are hidden inside this function
    const insuredMap = {
        "Suhail Nami": { type: "Self", img: "avatar_self.png" },
        "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
        "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
    };

    ["india", "singapore"].forEach(country => {
        if (!masterList[country]) return;

        masterList[country] = masterList[country].map(policy => {
            const match = sheetRecords.find(row => row["Policy No."] === policy.id);

            if (match) {
                policy.name = match.name;
                policy.company = match.company;
                policy.type = match.type;

                // 2. Only apply avatars for India
                if (country === "india") {
                    const insuredName = match["Insured"];
                    const identity = insuredMap[insuredName];
                    
                    if (identity) {
                        policy.avatarPath = identity.img;
                        policy.holderType = identity.type; // For alt text/tooltips
                    } else {
                        policy.avatarPath = "avatar_unknown.png";
                    }
                }
            }
            return policy;
        });
    });

    return masterList;
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
    // 1. Handle Policy Name (e.g., "LIC : Jeevan Anand")
    const rawFullName = item["Policy_Name"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        item.company = parts[0].trim();
        item.name = parts[1].trim(); 
    } else {
        item.company = "Insurance";
        item.name = rawFullName;
    }

    // 2. NEW: Handle Category (e.g., "Insurance : Savings")
    const rawCategory = item["Category"] || "";
    if (rawCategory.includes(":")) {
        item.type = rawCategory.split(":")[1].trim();
    } else {
        item.type = rawCategory || "Savings";
    }

    const prem = item["Premium"] || "";
    item.detectedCountry = (prem.includes("₹") || prem.includes("â") || prem.includes("INR")) ? "India" : "Singapore";
    item.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;
    return item;
}
