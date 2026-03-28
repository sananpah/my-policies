// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function fetchPortfolioData() {
    try {
        const response = await fetch(SHEET_URL + `&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        return processCSV(csvData);
    } catch (error) {
        console.error("Error fetching sheet:", error);
        return [];
    }
}

/* loader.js */
function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    
    // Robust parsing (Same as debug.html)
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);

    // Find the header row
    const headerIdx = rows.findIndex(r => r.some(cell => cell && cell.includes("Policy_Name")));
    if (headerIdx === -1) return [];

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    return dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { 
            if(h) obj[h] = (rowData[i] || "").trim(); 
        });
        
        // --- BRUTE FORCE FIX ---
        // If the first column has a ":" (like Prudential : PruSave), 
        // we force it to be the Policy_Name regardless of what the header says.
        const firstCell = (rowData[0] || "").trim();
        if (firstCell.includes(":") || (firstCell.length > 5 && !obj["Policy_Name"])) {
            obj["Policy_Name"] = firstCell;
        }

        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;

        return parseInsuranceTab(obj);
    }).filter(r => r !== null);
}

function parseInsuranceTab(row) {
    const rawFullName = row["Policy_Name"] || "";

    // Split "Company : Name"
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim();
    } else {
        row.company = "Insurance";
        row.name = rawFullName;
    }

    // Country Detection (Handles symbols and the 'â' mojibake)
    const prem = row["Premium"] || "";
    row.detectedCountry = (prem.includes("₹") || prem.includes("â")) ? "India" : "Singapore";
    
    // Clean Numeric Value (Removes symbols, commas, and spaces)
    row.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;

    return row;
}
