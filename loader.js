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

function processCSV(csv) {
    // 1. Advanced Parse (Handles quotes, commas in numbers, and multi-line cells)
    const rows = [];
    let row = [''], inQuote = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { row[row.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { row.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(row); row = ['']; }
        else { row[row.length-1] += char; }
    }
    rows.push(row);

    // 2. Identify the Header Row (Looking for Policy_Name)
    const headerIdx = rows.findIndex(r => r.some(cell => cell && cell.includes("Policy_Name")));
    if (headerIdx === -1) return [];

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    // 3. Map Data and Filter out empty fragments
    return dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if(h) obj[h] = (rowData[i] || "").trim(); });
        
        // Skip if Policy_Name is missing (fragment/empty row)
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
