/* loader.js - v4.6.7 - FULL RESTORATION of India Logic + UIN Routing */
import { toNum, autoFmt, monthMap, getColorMap, getTimeRemaining } from './utils.js?v=1.0.3';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";
const githubLogo = "https://raw.githubusercontent.com/sananpah/my-policies/main/assets/logo/";

export async function syncWithGoogleSheets() {
    const TODAY = new Date();
    let masterList = { india: [], singapore: [] };

    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const buffer = await response.arrayBuffer();
        const csvData = new TextDecoder('utf-8').decode(buffer);
        const sheetRecords = processCSV(csvData);

        const insuredMap = {
            "Suhail Nami": { type: "Self", img: "avatar_self.png" },
            "Saima Suhail": { type: "Wife", img: "avatar_wife.png" },
            "Sulmas Nami": { type: "Daughter", img: "avatar_daughter.png" }
        };

        sheetRecords.forEach(match => {
            const otherDataRaw = String(match["Other Data"] || "").trim();
            const lowerOtherData = otherDataRaw.toLowerCase();
            
            // --- UIN ROUTING: India if UIN exists, else Singapore ---
            const isIndia = lowerOtherData.includes("uin:");
            const countryKey = isIndia ? "india" : "singapore";
            const sym = isIndia ? "₹" : "$";

            if (masterList[countryKey]) {
                let p = {};
                p.id = String(match["Policy No."]).trim();
                p.name = match.name;
                p.company = match.company;
                p.type = match.type;
                p.color = getColorMap(p.company);
                p.logo = `${githubLogo}logo_${p.company.replace(/[\s.]/g, "")}.png`;

                const identity = insuredMap[match["Insured"]];
                if (identity) { 
                    p.avatarPath = identity.img; 
                    p.holderType = identity.type; 
                }

                // Financials
                p.premium = toNum(match["Premium"]);
                p.totalPremiumPaid = toNum(match["Total Premium"]); // For Net Invested calculation
                p.sumAssured = toNum(match["Sum Assured"]);
                p.unitValueNumeric = toNum(match["Current Value"]);
                p.currentUnitValue = match["Current Value"] || "No Value";

                // --- STATUS & DUE DATE ---
                p.dueDate = String(match["Due Date"] || "").trim().toUpperCase();
                p.isPaidUp = (p.dueDate === "PAID UP" || p.dueDate === "FULLY PAID");

                // --- DATES & TERM ---
                let rawDate = String(match["Commenced Date"] || "").trim().replace(/\./g, ' '); 
                p.commenced = rawDate;
                const dateParts = rawDate.split(" ");
                const startY = parseInt(dateParts[2]);

                const termParts = String(match["Term"] || "").split(":");
                const ppt = parseInt(termParts[0]) || 0;
                const mat = parseInt(termParts[1]) || 0;
                p.mip = termParts[2] ? parseInt(termParts[2]) : ppt; 
                p.ppt = ppt;

                if (!isNaN(startY)) {
                    p.maturity = `${dateParts[0]} ${dateParts[1]} ${startY + mat}`;
                    
                    // RESTORED: India Specific Next Due / Time Remaining
                    if (countryKey === "india") {
                        if (p.isPaidUp) {
                            p.nextDue = "PAID UP";
                            p.timeRemaining = "Fully Paid";
                        } else {
                            // Calculate next anniversary based on current month
                            const currentYear = TODAY.getFullYear();
                            const annivMonthStr = dateParts[1]; 
                            const annivMonthIdx = monthMap[annivMonthStr] || 0;
                            const annivYear = (TODAY.getMonth() > annivMonthIdx) ? currentYear + 1 : currentYear;
                            
                            p.nextDue = `${dateParts[0]} ${annivMonthStr} ${annivYear}`;
                            p.timeRemaining = getTimeRemaining(p.nextDue);
                        }
                    }
                }

                // Nominee Mapping
                const nomineeRaw = String(match["Nominee"] || "").trim();
                p.nominees = []; 
                if (nomineeRaw && nomineeRaw.toLowerCase() !== "n/a") {
                    p.nomineeStatus = "ASSIGNED";
                    nomineeRaw.split(/,|\band\b|&|\n/).forEach(name => {
                        const cleanN = name.replace(/[^\x20-\x7E]/g, "").trim();
                        if (!cleanN) return;
                        const matchName = cleanN.toLowerCase();
                        let img = "avatar_unknown.png"; 
                        const mapped = Object.entries(insuredMap).find(([fn]) => matchName.includes(fn.toLowerCase()));
                        p.nominees.push({ name: cleanN, img: mapped ? mapped[1].img : img });
                    });
                } else {
                    p.nomineeStatus = nomineeRaw.toLowerCase() === "n/a" ? "NA" : "EMPTY";
                }

                // Other Data Parsing
                p.uin = "N/A"; p.clientId = "N/A";
                p.surrenderCharges = null; p.surrenderBase = "VALUATION";
                if (lowerOtherData !== "n/a") {
                    otherDataRaw.split(/\n|\r/).forEach(line => {
                        const cleanLine = line.trim();
                        if (cleanLine.toLowerCase().startsWith("uin:")) p.uin = cleanLine.split(":")[1]?.trim().toUpperCase();
                        else if (cleanLine.toLowerCase().startsWith("clientid:")) p.clientId = cleanLine.split(":")[1]?.trim().toUpperCase();
                        else if (cleanLine.toLowerCase().startsWith("surrender:")) {
                            const content = cleanLine.split(":")[1] || "";
                            p.surrenderBase = content.includes("[av]") ? "VALUATION" : "PREMIUM";
                            p.surrenderCharges = {};
                            content.replace(/\[.*?\]/g, "").split(",").forEach((val, idx) => {
                                const v = parseInt(val.trim());
                                if (!isNaN(v)) p.surrenderCharges[idx + 1] = v;
                            });
                        }
                    });
                }

                // Multi-Withdrawal Parser
                const rawBenefits = String(match["Other Coverage & Benefits"] || "");
                const benefitsLines = rawBenefits.split(/\r?\n/);
                const withdrawLine = benefitsLines.find(l => l.toLowerCase().includes("withdraw"));
                p.withdrawals = [];
                if (withdrawLine) {
                    (withdrawLine.split(":")[1] || "").split(",").forEach(seg => {
                        const val = parseFloat(seg.replace(/[$\s,]/g, ""));
                        if (!isNaN(val)) p.withdrawals.push(val);
                    });
                }

                // Moneyback & Projections
                if (countryKey === "india") {
                    const mbLine = benefitsLines.find(l => l.toLowerCase().includes("moneyback"));
                    p.payoutSchedule = {}; 
                    if (mbLine && mbLine.includes(":")) {
                        const content = mbLine.substring(mbLine.indexOf(":") + 1).trim();
                        content.split(",").forEach(seg => {
                            const parts = seg.split(":").map(s => s.trim());
                            if (parts.length >= 2) {
                                const range = parts[0];
                                const baseVal = parts[1].toLowerCase().includes("%bsa") ? (p.sumAssured * (toNum(parts[1]) / 100)) : toNum(parts[1]);
                                if (range.includes("-")) {
                                    const [s, e] = range.split("-").map(Number);
                                    for (let y = s; y <= e; y++) p.payoutSchedule[y] = baseVal;
                                } else if (!isNaN(parseInt(range))) { 
                                    p.payoutSchedule[parseInt(range)] = baseVal; 
                                }
                            }
                        });
                    }
                }

                // ULIP Projections
                if ((p.type || "").toUpperCase().includes("ULIP")) {
                    const calculateProjection = (rate) => {
                        let projected = p.unitValueNumeric;
                        const targetYear = (startY + p.mip + (countryKey === "singapore" ? 2 : 0));
                        for (let yr = TODAY.getFullYear(); yr < targetYear; yr++) {
                            if (yr < (startY + ppt)) projected += p.premium;
                            projected = projected * (1 + rate);
                        }
                        return projected;
                    };
                    p.maturityAmt = `Est. @4%: ${autoFmt(calculateProjection(0.04), sym)}<br>Est. @8%: ${autoFmt(calculateProjection(0.08), sym)}*`;
                }
                
                masterList[countryKey].push(p);
            }
        });
        return masterList;
    } catch (e) { console.warn("Sync failed:", e); return masterList; }
}

// ... processCSV remains same ...
