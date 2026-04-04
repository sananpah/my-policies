/* loader.js - v6.5.0 - The Date Restoration */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?gid=866869416&single=true&output=csv";

export async function syncWithGoogleSheets(masterList) {
    try {
        const response = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const csvData = await response.text();
        const sheetRecords = processCSV(csvData);

        const cleanNumeric = (n) => n ? parseInt(String(n).replace(/[^\d]/g, ""), 10) || 0 : 0;

        ["india", "singapore", "health"].forEach(region => {
            if (!masterList[region]) return;
            masterList[region] = masterList[region].map(p => {
                const match = sheetRecords.find(row => String(row["Policy No."] || "").trim() === String(p.id).trim());
                if (match) {
                    // CRITICAL: Mapping the exact column name from your sheet
                    p.commenced = match["Commenced Date"] || p.commenced;
                    p.premium = cleanNumeric(match["Premium"]);
                    p.sumAssured = cleanNumeric(match["Sum Assured"]);
                    p.type = match["Category"] || match["Type"] || p.type;

                    // PPT:MAT:MIP logic for Timeline
                    const rawTerm = String(match["Term"] || "");
                    if (rawTerm.includes(":") && p.commenced.includes(" ")) {
                        const matYears = parseInt(rawTerm.split(":")[1], 10);
                        const startY = parseInt(p.commenced.split(" ")[2]);
                        p.maturity = p.commenced.replace(startY, startY + matYears);
                    }
                }
                return p;
            });
        });
        return masterList;
    } catch (e) { return masterList; }
}

function processCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim().replace(/"/g, '') : "");
        return obj;
    });
}
