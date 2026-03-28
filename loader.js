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
    
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { currentRow.push(''); }
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else { currentRow[currentRow.length-1] += char; }
    }
    rows.push(currentRow);

    const headerIdx = rows.findIndex(r => 
        r.some(cell => cell && cell.toLowerCase().includes("policy_name"))
    );

    if (headerIdx === -1) return [];

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    const finalData = dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { 
            if(h) obj[h] = (rowData[i] || "").trim(); 
        });
        
        if (!obj["Policy_Name"] || obj["Policy_Name"] === "EMPTY") return null;

        return parseInsuranceTab(obj);
    }).filter(r => r !== null);

    // --- CHANGE: Showing all records (up to 20) ---
    renderTopDebug(finalData.slice(0, 20));

    return finalData;
}

function renderTopDebug(records) {
    if (typeof document === 'undefined') return;

    let debugDiv = document.getElementById('loader-debug-top');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'loader-debug-top';
        // Style updated for scrolling through many records
        debugDiv.style = "position:fixed; top:0; left:0; width:100%; background:rgba(0,0,0,0.9); color:lime; z-index:10000; padding:15px; font-family:monospace; font-size:11px; border-bottom:3px solid #00ff00; max-height:40vh; overflow-y:auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5);";
        document.body.prepend(debugDiv);
    }
    
    debugDiv.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <b style="font-size:14px;">🔍 RAW DATA DIAGNOSTIC: ${records.length} TOTAL RECORDS</b>
        <button onclick="this.parentElement.parentElement.remove()" style="background:red; color:white; border:none; padding:2px 8px; cursor:pointer;">CLOSE DEBUG</button>
    </div>`;

    records.forEach((record, index) => {
        const color = record.detectedCountry === "India" ? "#ff9933" : "#38bdf8";
        debugDiv.innerHTML += `
            <div style="border-bottom:1px solid #333; padding:4px 0;">
                <span style="color:#888;">#${index+1}</span> | 
                <span style="color:${color}; font-weight:bold;">[${record.detectedCountry}]</span> | 
                <b>${record.company}</b> : ${record.name} | 
                <span style="color:#aaa;">Prem: ${record.premiumNumeric}</span>
            </div>`;
    });
}

function parseInsuranceTab(item) {
    // FIXED: Using 'item' consistently here
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
    // Detect Country
    item.detectedCountry = (prem.includes("₹") || prem.includes("â") || prem.includes("INR")) ? "India" : "Singapore";
    
    // Clean numeric premium
    item.premiumNumeric = parseFloat(prem.replace(/[^\d.]/g, "")) || 0;

    return item;
}


