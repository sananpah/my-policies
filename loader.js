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
        alert("CRITICAL ERROR: " + error.message);
        return [];
    }
}

function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    
    // Robust CSV parsing
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);

    // Find the header row (Case-insensitive search)
    const headerIdx = rows.findIndex(r => 
        r.some(cell => cell && cell.toLowerCase().includes("policy_name"))
    );

    if (headerIdx === -1) {
        console.error("Header 'Policy_Name' not found in CSV.");
        return [];
    }

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    const finalData = dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { 
            if(h) obj[h] = (rowData[i] || "").trim(); 
        });
        
        // Skip empty fragments
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;

        return parseInsuranceTab(obj);
    }).filter(r => r !== null);

    // --- FIXED DEBUG OVERLAY ---
    renderTopDebug(finalData.slice(0, 3));

    return finalData;
}

function renderTopDebug(records) {
    // Check if we are in a browser environment
    if (typeof document === 'undefined') return;

    let debugDiv = document.getElementById('loader-debug-top');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'loader-debug-top';
        debugDiv.style = "position:fixed; top:0; left:0; width:100%; background:black; color:lime; z-index:9999; padding:10px; font-family:monospace; font-size:12px; border-bottom:2px solid lime;";
        document.body.prepend(debugDiv);
    }
    
    debugDiv.innerHTML = `<b>DEBUG: FOUND ${records.length} VALID RECORDS</b><br>`;
    records.forEach((r, i) => {
        // FIXED: Using 'r' instead of 'row'
        debugDiv.innerHTML += `REC ${i+1}: Name: [${r.name}] | Country: [${r.detectedCountry}]<br>`;
    });
}

function parseInsuranceTab(row) {
    // Extract name from "Policy_Name" header
    const rawFullName = row["Policy_Name"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim();
    } else {
        row.company = "Insurance";
        row.name = rawFullName;
    }

    const prem = row["Premium"] || "";
    // Detect Country
    row.detectedCountry = (prem.includes("₹") || prem.includes("â") || prem.includes("INR")) ? "India" : "Singapore";
    // Clean numeric premium
    row.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;

    return row;
}
