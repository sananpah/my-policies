/* loader.js - v4.2.6 - Clean India Maturity Output */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

const autoFmt = (val, sym) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return sym + "0";
    return sym + Math.round(n).toLocaleString('en-IN');
};

const monthMap = { "Jan":0,"Feb":1,"Mar":2,"Apr":3,"May":4,"Jun":5,"Jul":6,"Aug":7,"Sep":8,"Oct":9,"Nov":10,"Dec":11 };

export async function syncWithGoogleSheets(masterList) {
    const TODAY = new Date();
    const CURRENT_YEAR = TODAY.getFullYear();

    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8'); 
        const csvData = decoder.decode(buffer);
        const sheetRecords = processCSV(csvData);

        const insuredMap = {
            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
        };

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
                    
                    const safeCompanyName = p.company.replace(/[\s.]/g, "");
                    p.logo = `logo_${safeCompanyName}.png`;

                    const identity = insuredMap[match["Insured"]];
                    if (identity) {
                        p.avatarPath = identity.img;
                        p.holderType = identity.type;
                    }

                    p.premium = cleanNumeric(match["Premium"]);
                    const rawSA = String(match["Sum Assured"] || "").toLowerCase();
                    p.sumAssured = (rawSA.includes("not") || cleanNumeric(match["Sum Assured"]) === 0) ? 0 : cleanNumeric(match["Sum Assured"]);
                    
                    p.currentUnitValue = match["Current Value"] || "No Value";
                    p.unitValueNumeric = cleanNumeric(p.currentUnitValue); 

                    let rawDate = String(match["Commenced Date"] || "").trim();
                    p.commenced = rawDate.replace(/\./g, ' '); 
                    const rawTermStr = String(match["Term"] || "");
                    let ppt = 0, mat = 0;
                    if (rawTermStr.includes(":")) {
                        const parts = rawTermStr.split(":");
                        ppt = parseInt(parts[0], 10) || 0;
                        mat = parseInt(parts[1], 10) || 0;
                        p.ppt = ppt;
                        const startParts = p.commenced.split(" ");
                        const startY = parseInt(startParts[2], 10);
                        if (!isNaN(startY)) {
                            p.premiumEnds = `${startParts[0]} ${startParts[1]} ${startY + ppt}`;
                            p.maturity = `${startParts[0]} ${startParts[1]} ${startY + mat}`;
                        }
                    }

                    if (country === "india") {
                        const isULIP = (p.type || "").toLowerCase().includes("ulip");
                        if (isULIP) {
                            const accVal = p.unitValueNumeric;
                            const endY = parseInt(p.maturity.split(" ")[2]) || 2050;
                            const startY = parseInt(p.commenced.split(" ")[2]) || 2000;
                            const yearsToMat = Math.max(0, endY - CURRENT_YEAR);
                            const annMonth = monthMap[p.commenced.split(" ")[1]] || 0;
                            const annDay = parseInt(p.commenced.split(" ")[0]) || 1;
                            const hasPassed = (TODAY.getMonth() > annMonth) || (TODAY.getMonth() === annMonth && TODAY.getDate() >= annDay);
                            const yearsToPay = Math.max(0, (startY + ppt) - (hasPassed ? CURRENT_YEAR + 1 : CURRENT_YEAR));
                            const r = 0.04;
                            const fvUnits = accVal * Math.pow(1 + r, yearsToMat);
                            let fvPrems = 0;
                            if (yearsToPay > 0) {
                                fvPrems = p.premium * ((Math.pow(1 + r, yearsToPay) - 1) / r) * (1 + r);
                                if (yearsToMat > yearsToPay) fvPrems *= Math.pow(1 + r, yearsToMat - yearsToPay);
                            }
                            const projected = Math.round(fvUnits + fvPrems);
                            p.maturityAmt = `${autoFmt(projected, "₹")}<br><span style="font-size: 8px; opacity: 0.8; display: block; margin-top: 4px;">* Calculated with 4% annual projection</span>`;
                        } else {
                            const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                            const maturityLine = rawBenefits.split(/\r?\n/).find(l => l.trim().startsWith("Maturity Benefit"));
                            
                            if (maturityLine) {
                                let val = maturityLine.split(":")[1]?.trim() || "";
                                
                                // REPLACEMENT LOGIC: Replaces "30%BSA" with just the "₹ X,XX,XXX" value
                                const bsaRegex = /(\d+)%BSA/gi;
                                val = val.replace(bsaRegex, (matchStr, percentage) => {
                                    const pct = parseFloat(percentage) / 100;
                                    const calcAmt = (p.sumAssured || 0) * pct;
                                    return autoFmt(calcAmt, "₹");
                                });

                                // Replace single "BSA" words with the actual Sum Assured
                                p.maturityAmt = val.toUpperCase().includes("BSA") 
                                    ? val.replace(/BSA/gi, autoFmt(p.sumAssured, "₹")) 
                                    : val;
                            } else {
                                p.maturityAmt = "Policy Maturity";
                            }
                        }
                    }

                    if (country === "singapore") {
                        p.totalPremiumPaid = cleanNumeric(match["Total Premium"] || "0");
                        if (rawTermStr.includes(":")) p.mip = parseInt(rawTermStr.split(":")[2], 10) || 0;
                    }
                }
                return p;
            });
        });
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
