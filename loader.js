/* loader.js */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

/**
 * MASTER SYNC FUNCTION:
 * Merges Google Sheet data into your static POLICY_DATA without breaking the UI.
 */
export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        
        // Use your existing processCSV logic to get clean JSON objects from the sheet
        const sheetRecords = processCSV(csvData);

        // Loop through your categories in POLICY_DATA
        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;

            masterList[country] = masterList[country].map(staticPolicy => {
                // Match ID from POLICY_DATA to "Policy No." in Google Sheet
                const match = sheetRecords.find(row => row["Policy No."] === staticPolicy.id);

                if (match) {
                    // Update Name and Company from the Sheet's "Policy_Name" attribute
                    // Your parseInsuranceTab already handles the "Company : Policy Name" split
                    staticPolicy.name = match.name;
                    staticPolicy.company = match.company;
                } else {
                    // If name attribute was removed from data.js and not found in Excel
                    if (!staticPolicy.name || staticPolicy.name.trim() === "") {
                        staticPolicy.name = "Unknown";
                    }
                }
                return staticPolicy;
            });
        });

        console.log("✅ Silent Sync: POLICY_DATA updated from Google Sheets.");
        return masterList;

    } catch (error) {
        console.warn("⚠️ Sync Failed: Using static fallback data.", error);
        return masterList;
    }
}

/**
 * Your original CSV Processor
 */
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

/**
 * Your original Tab Parser
 */
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

    const prem = item["Premium"] || "";
    item.detectedCountry = (prem.includes("₹") || prem.includes("â") || prem.includes("INR")) ? "India" : "Singapore";
    item.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;
    return item;
}
