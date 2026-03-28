// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function fetchPortfolioData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        return processCSV(csvData);
    } catch (error) {
        console.error("Error fetching sheet:", error);
        return [];
    }
}

/* loader.js */
function processCSV(csv) {
    const lines = csv.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, i) => { row[header] = values[i]; });
        
        // EXCLUSIVE: Pass the row to the parser
        return parseInsuranceTab(row);
    });
}

function parseInsuranceTab(row) {
    // 1. Capture the raw policy name from your specific header
    const rawFullName = row["Policy_Name"] || ""; 

    // 2. Perform the Split Logic
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim(); // This maps to the card title
    } else {
        row.company = "Insurance";
        row.name = rawFullName; // Fallback if no colon exists
    }

    // 3. Detect Country and Numeric Values
    const premiumAttr = row["Premium"] || "";
    row.detectedCountry = premiumAttr.includes("₹") ? "India" : (premiumAttr.includes("$") ? "Singapore" : "Other");
    row.premiumNumeric = parseFloat(premiumAttr.replace(/[₹$,\s]/g, "")) || 0;

    return row;
}
