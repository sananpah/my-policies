/* loader.js - v5.0.0 - Modular Refactor with Dynamic Country Detection */
import { toNum, autoFmt, getColorMap, githubLogo, insuredMap } from './utils.js?v=1.0.5';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

/**
 * Main Sync Function
 * Decommissions hardcoded category IDs and classifies data row-by-row
 */
export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        // Initialize new structure
        const updatedList = { india: [], singapore: [], health: masterList.health || [] };

        sheetRecords.forEach(match => {
            const policyId = String(match["Policy No."]).trim();
            if (!policyId || policyId === "undefined") return;

            // Find existing baseline if available
            const existing = [...(masterList.india || []), ...(masterList.singapore || [])]
                .find(p => String(p.id).trim() === policyId) || {};

            let p = { ...existing, id: policyId };

            // 1. Basic Info & Identity
            mapBasicInfo(p, match);
            mapIdentity(p, match);

            // 2. Financials & Nominees
            mapFinancials(p, match);
            mapNominees(p, match);

            // 3. Technical Data & Country Detection (UIN Logic)
            mapTechnicalData(p, match);
            const country = (p.uin !== "N/A") ? "india" : "singapore";

            // 4. MoneyBack Logic
            if (country === "india") mapMoneyBack(p, match);

            // 5. Dates & Projections
            mapDatesAndTerms(p, match);
            mapProjections(p, match, country);

            // Push to detected category
            updatedList[country].push(p);
        });

        return updatedList;
    } catch (e) {
        console.warn("Sync failed:", e);
        return masterList;
    }
}

/* --- HELPER FUNCTIONS --- */

function mapBasicInfo(p, match) {
    p.name = match.name || p.name;
    p.company = match.company || p.company;
    p.color = getColorMap(p.company);
    p.type = match.type || p.type;
    p.logo = `${githubLogo}logo_${p.company.replace(/[\s.]/g, "")}.png`;
}

function mapIdentity(p, match) {
    const identity = insuredMap[match["Insured"]];
    if (identity) {
        p.avatarPath = identity.img;
        p.holderType = identity.type;
    }
}

function mapFinancials(p, match) {
    p.premium = toNum(match["Premium"]);
    p.totalPremiumPaid = toNum(match["Total Premium"]);
    p.sumAssured = toNum(match["Sum Assured"]);
    p.unitValueNumeric = toNum(match["Current Value"]);
    p.currentUnitValue = match["Current Value"] || "No Value";
}

function mapNominees(p, match) {
    const raw = String(match["Nominee"] || "").trim();
    p.nominees = [];
    if (!raw || raw.toLowerCase() === "n/a") {
        p.nomineeStatus = raw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
    } else {
        p.nomineeStatus = "ASSIGNED";
        const names = raw.split(/,|\band\b|&|\n|\r/).map(n => n.trim());
        names.forEach(name => {
            const clean = name.replace(/[^\x20-\x7E]/g, "").trim();
            if (!clean) return;
            let img = "avatar_unknown.png";
            const mapped = Object.entries(insuredMap).find(([full]) => clean.toLowerCase().includes(full.toLowerCase()));
            if (mapped) img = mapped[1].img;
            p.nominees.push({ name: clean, img: img });
        });
    }
}

function mapTechnicalData(p, match) {
    const raw = String(match["Other Data"] || "").trim();
    p.uin = "N/A"; p.clientId = "N/A";
    p.surrenderCharges = null; p.surrenderBase = "VALUATION";

    if (raw && raw.toLowerCase() !== "n/a") {
        const lines = raw.split(/\n|\r/);
        lines.forEach(line => {
            const cleanLine = line.trim().toLowerCase();
            if (cleanLine.startsWith("uin:")) p.uin = line.split(":")[1]?.trim() || "N/A";
            else if (cleanLine.startsWith("clientid:")) {
                if (!(p.type || "").toUpperCase().includes("ULIP")) p.clientId = line.split(":")[1]?.trim() || "N/A";
            } else if (cleanLine.startsWith("premiumlinked:")) {
                p.linkedTo = line.split(":")[1]?.trim() || null;

            } else if (cleanLine.startsWith("assign date:")) {
                // Assignment date: when the policy was assigned TO the user.
                // This becomes the user's effective "commenced date" for IRR purposes.
                // All cashflows (IRR, PV) are computed from this date, not the
                // original policy commencement date.
                p.assignDate = line.split(":").slice(1).join(":").trim();

            } else if (cleanLine.startsWith("assign amt:")) {
                // Assignment amount: the discounted price paid to acquire the policy.
                // This is the user's t=0 outflow for IRR — NOT the original premium history.
                const rawAmt = line.split(":").slice(1).join(":").trim();
                // Strip currency symbols, commas, spaces
                p.assignAmt = parseFloat(rawAmt.replace(/[^\d.]/g, "")) || 0;
            } else if (cleanLine.startsWith("surrender:")) {
                const content = line.split(":")[1] || "";
                p.surrenderBase = content.includes("[pp]") ? "PREMIUM" : "VALUATION";
                p.surrenderCharges = {};
                content.replace(/\[.*?\]/g, "").split(",").forEach((val, idx) => {
                    const cleanVal = parseInt(val.trim());
                    if (!isNaN(cleanVal)) p.surrenderCharges[idx + 1] = cleanVal;
                });
            }
        });
    }
    if (!p.surrenderCharges) p.surrenderCharges = { 1: 0 };
}

function mapDatesAndTerms(p, match) {
    let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' ');
    p.commenced = rawDate;
    const parts = rawDate.split(" ");
    const startY = parseInt(parts[2]);

    const rawTerm = String(match["Term"] || "");
    const termParts = rawTerm.includes(":") ? rawTerm.split(":") : [0, 0, 0];
    const ppt = parseInt(termParts[0], 10) || 0;
    const mat = parseInt(termParts[1], 10) || 0;

    p.mip = termParts[2] ? parseInt(termParts[2], 10) : ppt;
    p.ppt = ppt;

    if (!isNaN(startY)) {
        p.premiumEnds = `${parts[0]} ${parts[1]} ${startY + ppt - 1}`;
        p.maturity = `${parts[0]} ${parts[1]} ${startY + mat}`;
    }
}

function mapProjections(p, match, country) {
    const isULIP = (p.type || "").toUpperCase().includes("ULIP") || (country === "singapore");
    const sym = (country === "singapore") ? "$" : "₹";
    const TODAY = new Date();

    if (isULIP) {
        const calc = (rate) => {
            let projected = p.unitValueNumeric;
            const startY = parseInt(p.commenced.split(" ")[2]);
            let targetYear = (country === "india") ? (startY + (p.maturity.split(" ")[2] - startY)) : (startY + p.ppt + 2);
            let stopYear = (country === "india") ? (startY + p.ppt - 1) : (startY + p.mip);
            

            if (country === "singapore" && p.ppt === (p.maturity.split(" ")[2] - startY)) {
                targetYear = stopYear = parseInt(p.maturity.split(" ")[2]);
            }

            for (let yr = TODAY.getFullYear(); yr < targetYear; yr++) {
                if (yr < stopYear) projected += p.premium;
                projected *= (1 + rate);
            }
            return { v: projected, t: targetYear, s: stopYear };
        };

        const r4 = calc(0.04);
        const r8 = calc(0.08);
        const disclaimer = `<div style="font-size:0.55rem; opacity:0.6; margin-top:4px; font-style:italic;">*Pay till ${r4.s}, Grow till ${r4.t}</div>`;
        
        p.maturityAmt = `Est. @4%: ${autoFmt(r4.v, sym)}<br>Est. @8%: ${autoFmt(r8.v, sym)}${disclaimer}`;
    } else {
        const rawBenefits = String(match["Other Coverage & Benefits"] || "");
        const mbLine = rawBenefits.split(/\r?\n/).find(l => l.toLowerCase().includes("maturity benefit"));
        
        if (mbLine && mbLine.includes(":")) {
            const formula = mbLine.split(":").slice(1).join(":").trim();  // everything after the first colon, colons inside values preserved
            let totalMaturity = 0;
            let componentsFound = 0;

            // 1. Base Sum Assured check
            if (formula.toLowerCase().includes("bsa")) {
                totalMaturity += (p.sumAssured || 0);
            }
            
            // 2. Percentage of BSA check (e.g., 30%BSA)
            const bsaMatches = formula.match(/(\d+)%BSA/gi);
            if (bsaMatches) {
                componentsFound += bsaMatches.length;
                bsaMatches.forEach(m => {
                    totalMaturity += ((p.sumAssured || 0) * (parseInt(m) / 100));
                });
            }

            // 3. Total MoneyBack check
            if (formula.toLowerCase().includes("total moneyback")) {
                componentsFound++;
                const totalMB = Object.values(p.payoutSchedule || {}).reduce((a, b) => a + b, 0);
                totalMaturity += totalMB;
            }

            // 4. PIPE FORMAT — simple human-readable maturity values
            // ──────────────────────────────────────────────────────────────
            // Guaranteed Addition (GA): internal credit, paid as lump sum at maturity
            //   Sheet entry: "BSA + GA | 699120"
            //   Old format still supported: "BSA + GA(699120)"
            //
            // Non-guaranteed Bonus — single scenario (conservative):
            //   Sheet entry: "BSA + Bonus | 1159095"
            //
            // Non-guaranteed Bonus — two scenarios (conservative + optimistic):
            //   Sheet entry: "BSA + Bonus | 1159095 | 1275974"
            //   IRR uses first (conservative). Star shows both.
            //
            // Pipe format is simpler to type and read in the sheet.
            // Old parenthesis format (e.g. GA(699120)) still works for backward compat.

            const pipeValues = formula.split("|").map(s => s.trim());
            // pipeValues[0] = type label (e.g. "BSA + GA", "BSA + Bonus")
            // pipeValues[1] = first/conservative total
            // pipeValues[2] = second/optimistic total (optional)

            const isGAPipe    = pipeValues[0].toUpperCase().includes("GA");
            const isBonusPipe = pipeValues[0].toUpperCase().includes("BONUS");

            if (pipeValues.length >= 2 && (isGAPipe || isBonusPipe) && parseFloat(pipeValues[1]) > 0) {
                componentsFound++;
                const lowTotal  = parseFloat(pipeValues[1]);
                const highTotal = pipeValues[2] ? parseFloat(pipeValues[2]) : null;
                const BSA       = toNum(p.sumAssured);

                if (isGAPipe) {
                    // GA: bonus amount = total − BSA (exact, guaranteed)
                    const gaAmt         = lowTotal - BSA;
                    p.maturityBonus     = gaAmt > 0 ? gaAmt : lowTotal;
                    p.maturityBonusType = "GA";
                    p.maturityLabel     = "BSA + GA";
                    totalMaturity       = lowTotal;
                } else {
                    // Bonus: non-guaranteed, show conservative + optimistic
                    p.maturityBonus          = lowTotal - BSA;  // bonus portion
                    p.maturityBonusTotal     = lowTotal;
                    p.maturityBonusHigh      = highTotal ? highTotal - BSA : null;
                    p.maturityBonusTotalHigh = highTotal;
                    p.maturityBonusType      = "Bonus";
                    p.maturityLabel          = "BSA + Bonus";
                    totalMaturity            = lowTotal;        // IRR uses conservative total
                }
            }

            // Backward-compat: old GA(amount) parenthesis format
            const gaMatchOld = !isGAPipe && formula.match(/GA\((\d+(?:\.\d+)?)\)/i);
            if (gaMatchOld) {
                componentsFound++;
                const gaAmt         = parseFloat(gaMatchOld[1]);
                const BSA           = toNum(p.sumAssured);
                totalMaturity      += gaAmt;
                p.maturityBonus     = gaAmt;
                p.maturityBonusType = "GA";
                p.maturityLabel     = "BSA + GA";
            }

            // 5. Fixed Value addition (plain number, not caught above)
            const flatValues = formula.match(/(?:\+|\s|^)(\d+(?:\.\d+)?)(?!%|BSA)/g);
            if (flatValues && pipeValues.length < 2 && !gaMatchOld) {
                componentsFound += flatValues.length;
                flatValues.forEach(val => {
                    totalMaturity += parseFloat(val.trim().replace('+', ''));
                });
            }

            // --- SURGICAL LOGIC FOR NON-NUMERIC USE CASES ---
            if (totalMaturity === 0 && componentsFound === 0) {
                // If no math was triggered, treat the formula as a descriptive label
                p.calculatedMaturity = null;
                p.maturityLabel = formula; 
            } else {
                p.calculatedMaturity = totalMaturity;
                p.maturityFormula = (componentsFound === 0 && formula.toUpperCase() === "BSA") 
                    ? "BSA Only" 
                    : formula;
            }
        }
    }
}
function mapMoneyBack(p, match) {
    const rawBenefits = String(match["Other Coverage & Benefits"] || "");
    const benefitsLines = rawBenefits.split(/\r?\n/);
    const mbLine = benefitsLines.find(l => l.toLowerCase().includes("moneyback"));
    
    p.payoutSchedule = {}; 
    
    if (mbLine && mbLine.includes(":")) {
        const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
        
        content.split(",").forEach(seg => {
            const parts = seg.split(":").map(s => s.trim());
            if (parts.length < 2) return;
            
            const range = parts[0];
            const rawVal = parts[1];
            let currentVal = rawVal.toLowerCase().includes("%bsa") 
                ? (p.sumAssured * (toNum(rawVal) / 100)) 
                : toNum(rawVal);
            
            // Check for STEP logic: Range:Value:STEP:Interval:Percent
            // e.g. 11-30:133974:STEP:5:20
            if (parts[2] && parts[2].toUpperCase() === "STEP") {
                const interval = parseInt(parts[3]) || 1;
                const percentIncrease = (parseInt(parts[4]) || 0) / 100;
                const [start, end] = range.split("-").map(Number);
                
                let stepsTaken = 0;
                for (let y = start; y <= end; y++) {
                    // Every time we hit the interval, increase the value
                    if (stepsTaken > 0 && stepsTaken % interval === 0) {
                        currentVal = currentVal * (1 + percentIncrease);
                    }
                    p.payoutSchedule[y] = currentVal;
                    stepsTaken++;
                }
            } 
            // Standard Range Logic (e.g., 5-10: 5000)
            else if (range.includes("-")) {
                const [s, e] = range.split("-").map(Number);
                for (let y = s; y <= e; y++) p.payoutSchedule[y] = currentVal;
            } 
            // Single Year Logic (e.g., 5: 5000)
            else if (!isNaN(parseInt(range))) { 
                p.payoutSchedule[parseInt(range)] = currentVal; 
            }
        });
    }
}

function processCSV(csv) {
    const rows = [];
    let currentRow = [''], inQuote = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"' && csv[i+1] === '"') { currentRow[currentRow.length-1] += '"'; i++; }
        else if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) currentRow.push('');
        else if (char === '\n' && !inQuote) { rows.push(currentRow); currentRow = ['']; }
        else currentRow[currentRow.length-1] += char;
    }
    rows.push(currentRow);
    const headerIdx = rows.findIndex(r => r.some(c => c && c.toLowerCase().includes("policy_name")));
    if (headerIdx === -1) return [];
    const headers = rows[headerIdx].map(h => h.trim());
    return rows.slice(headerIdx + 1).map(rowData => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = (rowData[i] || "").trim(); });
        const rawName = obj["Policy_Name"] || "";
        if (rawName.includes(":")) {
            const pts = rawName.split(":");
            obj.company = pts[0].trim();
            obj.name = pts[1].trim();
        }
        const rawCat = obj["Category"] || "";
        obj.type = rawCat.includes(":") ? rawCat.split(":")[1].trim() : (rawCat || "Savings");
        return obj;
    }).filter(item => item && item["Policy_Name"] !== "EMPTY");
}
