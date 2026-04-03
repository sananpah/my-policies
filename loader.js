/* loader.js - v4.0.87 - Full Sync Bridge */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        
        const sheetRecords = processCSV(csvData);

        // Private mapping for avatars (Names hidden from UI)
        const insuredMap = {
            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                const match = sheetRecords.find(row => row["Policy No."] === staticPolicy.id);

                if (match) {
                    // 1. Sync Name, Company, and Category
                    staticPolicy.name = match.name;
                    staticPolicy.company = match.company;
                    staticPolicy.type = match.type;

                    // 2. Sync Sum Assured (New Handshake)
                    const rawSA = match["Sum Assured"] || "0";
                    staticPolicy.sumAssured = parseFloat(rawSA.replace(/[^\d.]/g, "")) || 0;

                    // 3. Apply Avatar & Holder Logic (India Only)
                    if (country === "india") {
                        const identity = insuredMap[match["Insured"]];
                        if (identity) {
                            staticPolicy.avatarPath = identity.img;
                            staticPolicy.holderType = identity.type;
                        } else {
                            staticPolicy.avatarPath = "avatar_unknown.png";
                            staticPolicy.holderType = "Unknown";
                        }
                    }
                }
                return staticPolicy;
            });
        });

        console.log("✅ v4.0.87: Full Data & Sum Assured Sync Complete.");
        return masterList;

    } catch (error) {
        console.warn("⚠️ Sync Failed: Falling back to static data.", error);
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
        
        // Safety for first column
        if (!obj["Policy_Name"] && rowData[0]?.includes(":")) obj["Policy_Name"] = rowData[0];
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;

        return parseInsuranceTab(obj);
    }).filter(item => item !== null);
}

function parseInsuranceTab(item) {
    // Split Company : Name
    const rawFullName = item["Policy_Name"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        item.company = parts[0].trim();
        item.name = parts[1].trim(); 
    } else {
        item.company = "Insurance";
        item.name = rawFullName;
    }

    // Split Category : Type
    const rawCategory = item["Category"] || "";
    item.type = rawCategory.includes(":") ? rawCategory.split(":")[1].trim() : (rawCategory || "Savings");

    return item;
}
