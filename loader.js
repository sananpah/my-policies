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
    const lines = csv.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => {
            row[header] = values[i];
    });

        // Step-by-step Parsing Logic requested:
        const fullName = row["Insurance [Investment].Name of the policy"] || "";
        if (fullName.includes(":")) {
            const parts = fullName.split(":");
            row.parsedCompany = parts[0].trim();
            row.parsedName = parts[1].trim();
        } else {
            row.parsedCompany = "Unknown";
            row.parsedName = fullName;
        }

        // Determine Country by Currency
        const curr = row["Premium Currency"] || ""; // Adjust header name to match your sheet
        row.detectedCountry = curr.includes("₹") ? "India" : (curr.includes("$") ? "Singapore" : "Other");

        return row;
    });
}

