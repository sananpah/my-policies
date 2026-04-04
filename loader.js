/* loader.js - v4.0.89 - Final Data Sync Bridge */
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

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                const match = sheetRecords.find(row => row["Policy No."] === staticPolicy.id);

                if (match) {
                    staticPolicy.name = match.name;
                    staticPolicy.company = match.company;
                    staticPolicy.type = match.type;

                    // 1. SYNC & CLEAN: Sum Assured
                    const rawSA = (match["Sum Assured"] || "").toString().toLowerCase();
                    if (rawSA.includes("not") || rawSA.trim() === "") {
                        staticPolicy.sumAssured = 0;
                    } else {
                        // Strip all characters EXCEPT digits and dots
                        const cleanSA = parseFloat(rawSA.replace(/[^\d.]/g, ""));
                        staticPolicy.sumAssured = isNaN(cleanSA) ? 0 : cleanSA;
                    }

                    // 2. SYNC & CLEAN: Premium (FIXED: Handles "Rs." prefix correctly)
                    const rawPrem = (match["Premium"] || "0").toString();
                    // Regex: [^\d.] matches anything that isn't a digit or a decimal point
                    const cleanPremStr = rawPrem.replace(/[^\d.]/g, "");
                    const cleanPrem = parseFloat(cleanPremStr);
                    staticPolicy.premium = isNaN(cleanPrem) ? 0 : cleanPrem;

                    // 3. SYNC & CLEAN: Commenced Date (FIXED: Month Mapping)
                    const rawDate = match["Commenced Date"] || "";
                    if (rawDate.includes(".")) {
                        const parts = rawDate.split("."); // [dd, mm, yyyy]
                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        
                        const day = parts[0].padStart(2, '0');
                        // Use Number() to ensure "08" becomes 8, then subtract 1 for array index
                        const monthIdx = Number(parts[1]) - 1; 
                        const monthName = months[monthIdx] || "Jan";
                        const year = parts[2];
                        
                        staticPolicy.commenced = `${day} ${monthName} ${year}`;
                    } else {
                        staticPolicy.commenced = rawDate;
                    }

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

        console.log("✅ v4.0.89: Premium and Date logic strictly fixed.");
        return masterList;

    } catch (error) {
        console.warn("⚠️ Sync Failed.", error);
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
