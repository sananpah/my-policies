// loader.js
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThDQvcwmWKs2UwOfG57DQBOBnJX-9hsRKOQTUgALiM3uxs-VGzD2KN8JoWNAQltH6IkgAGhPTNFEvb/pub?output=csv";

export async function fetchPortfolioData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error("Error fetching sheet:", error);
        return [];
    }
}

function parseCSV(csv) {
    const lines = csv.split("\n");
    const headers = lines[0].split(",");
    
    return lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, header, i) => {
            obj[header.trim()] = values[i]?.trim();
            return obj;
        }, {});
    });
}
