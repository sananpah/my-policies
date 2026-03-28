/* loader.js */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function fetchPortfolioData() {
    try {
        const response = await fetch(SHEET_URL + `&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        return processCSV(csvData);
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    
    // 1. Advanced CSV Parsing (Handles quotes/commas)
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);

    // 2. Locate Header Row
    const headerIdx = rows.findIndex(r => 
        r.some(cell => cell && cell.toLowerCase().includes("policy_name"))
    );

    if (headerIdx === -1) return [];

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    // 3. Map Data to Objects
    const parsedData = dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { 
            if (h) obj[h] = (rowData[i] || "").trim(); 
        });
        
        // Safety: If the mapped "Policy_Name" is empty, but the first column has data, 
        // it means headers shifted. We grab rowData[0] as a fallback.
        if (!obj["Policy_Name"] && rowData[0] && rowData[0].includes(":")) {
            obj["Policy_Name"] = rowData[0];
        }

        // Skip rows that are clearly not policies
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY" || obj["Policy_Name"].length < 3) {
            return null;
        }

        return parseInsuranceTab(obj);
    }).filter(item => item !== null);

    // --- RENDER DEBUG (Optional: Remove after verification) ---
    renderTopDebug(parsedData);

    return parsedData;
}

function parseInsuranceTab(item) {
    // Standardize the Name and Company
    const rawFullName = item["Policy_Name"] || "";
    
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        item.company = parts[0].trim();
        item.name = parts[1].trim(); // This is what india.js uses
    } else {
        item.company = "Insurance";
        item.name = rawFullName;
    }

    // Robust Country Detection
    const prem = item["Premium"] || "";
    // If it contains Indian indicators or DOES NOT contain Singapore indicators
    if (prem.includes("₹") || prem.includes("â") || prem.includes("INR") || prem.includes("₹")) {
        item.detectedCountry = "India";
    } else if (prem.includes("$") || prem.includes("SGD")) {
        item.detectedCountry = "Singapore";
    } else {
        // Default based on common symbols in your sheet
        item.detectedCountry = "India"; 
    }

    // Clean Premium for math
    item.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;

    return item;
}

function renderTopDebug(records) {
    if (typeof document === 'undefined') return;
    let debugDiv = document.getElementById('loader-debug-top');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'loader-debug-top';
        debugDiv.style = "position:fixed; top:0; left:0; width:100%; background:rgba(0,0,0,0.9); color:lime; z-index:10001; padding:15px; font-family:monospace; font-size:11px; border-bottom:3px solid #00ff00; max-height:30vh; overflow-y:auto;";
        document.body.prepend(debugDiv);
    }
    
    debugDiv.innerHTML = `<b style="color:white">FINAL DATA HANDOVER (${records.length} records):</b><br>`;
    records.forEach((r, i) => {
        debugDiv.innerHTML += `#${i+1} | [${r.detectedCountry}] | Name: <span style="color:yellow">${r.name}</span> | Company: ${r.company}<br>`;
    });
}
