// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function fetchPortfolioData() {
    try {
        console.log("FETCH STARTING...");
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
    
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);

    // NUCLEAR LOGIC: Ignore headers. Just find rows that have a ":" in the first column
    const validDataRows = rows.filter(r => r[0] && r[0].includes(":"));

    // --- EMERGENCY NOTIFICATION ---
    if (validDataRows.length === 0) {
        alert("DATA ERROR: Found " + rows.length + " rows but none contain a ':' symbol. Check your Google Sheet data.");
    }

    const finalData = validDataRows.map(rowData => {
        const obj = {
            rawName: rowData[0],
            premium: rowData[6] || "", // Based on your debug, Premium was index 6
            policyNo: rowData[2] || ""
        };
        return parseInsuranceTab(obj);
    });

    // FORCE DEBUG OVERLAY
    renderTopDebug(finalData.slice(0, 3));
    return finalData;
}

function renderTopDebug(records) {
    const debugDiv = document.createElement('div');
    debugDiv.style = "position:fixed; top:0; left:0; width:100%; background:red; color:white; z-index:10000; padding:20px; font-weight:bold; border:5px solid yellow;";
    debugDiv.innerHTML = "DEBUG DATA DETECTED: " + records.length + " items.<br>";
    records.forEach(r => {
        debugDiv.innerHTML += `NAME: ${r.name} | COUNTRY: ${row.detectedCountry}<br>`;
    });
    document.body.appendChild(debugDiv);
}

function parseInsuranceTab(row) {
    const rawFullName = row.rawName || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        row.company = parts[0].trim();
        row.name = parts[1].trim();
    } else {
        row.company = "Insurance";
        row.name = rawFullName;
    }

    const prem = row.premium || "";
    // Detection for India (Rupee/INR/Mojibake)
    row.detectedCountry = (prem.includes("₹") || prem.includes("â") || prem.includes("INR")) ? "India" : "Singapore";
    row.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;

    return row;
}
