/* loader.js - v4.1.9 - Full Value Display + Surgical Maturity Extraction */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

// Updated: No more shrinking to L/K/Cr. Shows full formatted number.
const autoFmt = (val, sym) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return sym + "0";
    // Using en-IN to ensure Indian comma placement (2,00,000)
    return sym + Math.round(n).toLocaleString('en-IN');
};

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        const sheetRecords = processCSV(csvData);

        const cleanNumeric = (raw) => {
            if (!raw || raw === "No Value") return 0;
            let str = String(raw).trim().replace(/[^\x00-\x7F]/g, "").replace(/[^\d.]/g, "");       
            return parseFloat(str) || 0;
        };

        ["india", "singapore"].forEach(country => {
            if (!masterList[country]) return;
            masterList[country] = masterList[country].map(p => {
                const match = sheetRecords.find(row => String(row["Policy No."]).trim() === String(p.id).trim());
                if (match) {
                    p.name = match.name || p.name;
                    p.company = match.company || p.company;
                    p.type = match.type || p.type;
                    
                    // Core Financials
                    p.premium = cleanNumeric(match["Premium"]);
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    p.sumAssured = (rawSA.includes("not") || cleanNumeric(match["Sum Assured"]) === 0) ? 0 : cleanNumeric(match["Sum Assured"]);
                    
                    // --- INDIA MATURITY MIGRATION (Surgical Extraction) ---
                    if (country === "india") {
                        const isULIP = (p.type || "").toLowerCase().includes("ulip");
                        if (isULIP) {
                            p.maturityAmt = match["Current Value"] || "₹0";
                        } else {
                            const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                            const lines = rawBenefits.split(/\r?\n/);
                            
                            // Find line starting with "Maturity Benefit"
                            const maturityLine = lines.find(l => l.trim().startsWith("Maturity Benefit"));

                            if (maturityLine) {
                                // Extract everything after the first ":"
                                let val = maturityLine.split(":")[1]?.trim() || "";
                                
                                // Surgical BSA Swap with FULL NUMBER
                                if (val.toUpperCase().includes("BSA")) {
                                    const fullSA = autoFmt(p.sumAssured, "₹");
                                    p.maturityAmt = val.replace(/BSA/gi, fullSA);
                                } else {
                                    p.maturityAmt = val; 
                                }
                            } else {
                                p.maturityAmt = "Policy Maturity";
                            }
                        }
                    }

                    // --- SINGAPORE SYNC ---
                    if (country === "singapore") {
                        p.totalPremiumPaid = cleanNumeric(match["Total Premium"] || "0");
                        const rawTerm = String(match["Term"] || ""); 
                        if (rawTerm.includes(":")) {
                            const parts = rawTerm.split(":");
                            p.ppt = parseInt(parts[0], 10) || 0;
                            p.mip = parseInt(parts[2], 10) || 0;
                        }
                    }

                    // Date & Term Logic
                    let rawDate = String(match["Commenced Date"] || "").trim();
                    p.commenced = rawDate.replace(/\./g, ' '); 
                    const rawTermFull = String(match["Term"] || "");
                    if (rawTermFull.includes(":") && p.commenced.includes(" ")) {
                        const parts = rawTermFull.split(":");
                        const startYear = parseInt(p.commenced.split(" ")[2], 10);
                        if (!isNaN(startYear)) {
                            p.premiumEnds = `${p.commenced.split(" ")[0]} ${p.commenced.split(" ")[1]} ${startYear + parseInt(parts[0], 10)}`;
                            p.maturity = `${p.commenced.split(" ")[0]} ${p.commenced.split(" ")[1]} ${startYear + parseInt(parts[1], 10)}`;
                        }
                    }
                    p.currentUnitValue = match["Current Value"] || "No Value";
                    p.unitValueNumeric = cleanNumeric(p.currentUnitValue);
                }
                return p;
            });
        });
        console.log("✅ v4.1.9: Surgical Extraction & Full Number Sync Active.");
        return masterList;
    } catch (e) { console.warn("⚠️ Sync failed:", e); return masterList; }
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
    const headerIdx = rows.findIndex(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (headerIdx === -1) return [];
    const headers = rows[headerIdx].map(h => h.trim());
    return rows.slice(headerIdx + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        if (!obj["Policy_Name"] && rowData[0]?.includes(":")) obj["Policy_Name"] = rowData[0];
        return parseInsuranceTab(obj);
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}

function parseInsuranceTab(item) {
    const rawFullName = item["Policy_Name"] || "";
    if (rawFullName.includes(":")) {
        const parts = rawFullName.split(":");
        item.company = parts[0].trim();
        item.name = parts[1].trim(); 
    } else {
        item.company = "Insurance";
        item.name = rawFullName;
    }
    const rawCategory = item["Category"] || "";
    item.type = rawCategory.includes(":") ? rawCategory.split(":")[1].trim() : (rawCategory || "Savings");
    return item;
}
