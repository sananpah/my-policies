// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function fetchPortfolioData() {
    try {
        // Add a timestamp to the URL to force the browser to get fresh data
        const cacheBuster = `&t=${new Date().getTime()}`;
        const response = await fetch(SHEET_URL + cacheBuster);
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
    const rawFullName = row["Policy_Name"] || ""; 

    // 1. Split logic
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim();
    } else {
        row.company = "Insurance";
        row.name = rawFullName;
    }

    // 2. SMART COUNTRY DETECTION (Handles broken encoding)
    const premiumAttr = row["Premium"] || "";
    
    // Check for ₹ OR the broken 'â' sequence
    const isIndia = premiumAttr.includes("₹") || premiumAttr.includes("â");
    const isSingapore = premiumAttr.includes("$");

    if (isIndia) {
        row.detectedCountry = "India";
    } else if (isSingapore) {
        row.detectedCountry = "Singapore";
    } else {
        row.detectedCountry = "Other";
    }

    // 3. CLEAN NUMERIC VALUE
    // We remove ALL non-numeric characters (including the broken â symbols)
    row.premiumNumeric = parseFloat(premiumAttr.replace(/[^\d.]/g, "")) || 0;

    return row;
}
