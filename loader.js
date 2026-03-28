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

function parseInsuranceTab(row) {
    // 1. Parse "Company : Policy Name"
    const rawFullName = row["Insurance [Investment].Name of the policy"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim();
    } else {
        row.company = "Unknown";
        row.name = rawFullName;
    }

    // 2. Detect Country via Premium Currency Symbol
    const premiumAttr = row["Premium"] || "";
    if (premiumAttr.includes("₹")) {
        row.detectedCountry = "India";
        row.currencySymbol = "₹";
    } else if (premiumAttr.includes("$")) {
        row.detectedCountry = "Singapore";
        row.currencySymbol = "$";
    }

    // 3. Convert Premium to a clean number for logic/math
    row.premiumNumeric = parseFloat(premiumAttr.replace(/[₹$,\s]/g, "")) || 0;

    return row;
}
