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

/* loader.js - Force-Show All 19 Records */

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

    // Find Header
    const headerIdx = rows.findIndex(r => 
        r.some(cell => cell && cell.toLowerCase().includes("policy_name"))
    );

    if (headerIdx === -1) {
        alert("CRITICAL: Header 'Policy_Name' not found. Check debug console.");
        return [];
    }

    const headers = rows[headerIdx].map(h => h.trim());
    const dataRows = rows.slice(headerIdx + 1);

    // MAPPING ALL DATA (No filtering yet so we can see what's wrong)
    const allParsedData = dataRows.map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if(h) obj[h] = (rowData[i] || "").trim(); });
        return parseInsuranceTab(obj);
    });

    // --- DEBUG: Show EVERY row found (Limit set to 50 just in case) ---
    renderTopDebug(allParsedData.slice(0, 50));

    // Return only valid ones for the actual website
    return allParsedData.filter(r => r["Policy_Name"] && r["Policy_Name"] !== "EMPTY");
}

function renderTopDebug(records) {
    if (typeof document === 'undefined') return;

    let debugDiv = document.getElementById('loader-debug-top');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'loader-debug-top';
        debugDiv.style = "position:fixed; top:0; left:0; width:100%; background:rgba(0,0,0,0.95); color:#00ff00; z-index:10001; padding:20px; font-family:monospace; font-size:11px; border-bottom:4px solid #00ff00; max-height:50vh; overflow-y:auto; width:98vw;";
        document.body.prepend(debugDiv);
    }
    
    debugDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid lime;">
            <b style="font-size:16px; color:white;">🚩 DEBUGGER: SHOWING ALL ${records.length} ROWS FOUND</b>
            <button onclick="location.reload(true)" style="background:yellow; color:black; font-weight:bold; padding:5px;">FORCE REFRESH PAGE</button>
        </div>`;

    records.forEach((r, i) => {
        const isPolicy = r["Policy_Name"] && r["Policy_Name"].includes(":");
        const color = isPolicy ? "#00ff00" : "#ff4444"; // Green for real policies, Red for garbage/empty
        
        debugDiv.innerHTML += `
            <div style="margin-bottom:5px; border-bottom:1px solid #222;">
                <span style="color:#888;">#${i+1}</span> | 
                <span style="color:${color}; font-weight:bold;">Name: [${r.name || '---'}]</span> | 
                <span style="color:#aaa;">Raw: ${r["Policy_Name"] || 'EMPTY'}</span> | 
                <span style="color:cyan;">Country: ${r.detectedCountry}</span>
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


