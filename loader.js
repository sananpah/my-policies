// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?output=csv";

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

function processCSV(csv) {
    const lines = csv.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => { row[header] = values[i]; });
        
        // Directly call the parser for every row
        return parseInsuranceTab(row);
    });
}

/* loader.js */
function parseInsuranceTab(row) {
    // Use the new attribute name from your Google Sheet
    const rawFullName = row["Policy_Name"] || ""; 
    
    // Parse "Company : Policy Name"
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim(); // This will now be correctly populated
    } else {
        row.company = "Unknown";
        row.name = rawFullName;
    }

    // Detect Country via Premium Currency Symbol
    const premiumAttr = row["Premium"] || "";
    if (premiumAttr.includes("₹")) {
        row.detectedCountry = "India";
    } else if (premiumAttr.includes("$")) {
        row.detectedCountry = "Singapore";
    }

    row.premiumNumeric = parseFloat(premiumAttr.replace(/[₹$,\s]/g, "")) || 0;
    return row;
}
