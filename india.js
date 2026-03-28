/* india.js */
import { fetchPortfolioData } from './loader.js';
import { createPolicyCard } from './component_in.js';

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

async function initIndia() {
    console.log("1. initIndia started...");
    const allData = await fetchPortfolioData();
    
    console.log("2. Total rows received from loader:", allData.length);
    if (allData.length === 0) {
        alert("DIAGNOSTIC: Loader returned 0 records. Check your Google Sheet URL.");
        return;
    }

    // --- TEMPORARY: REMOVE FILTER TO SEE EVERYTHING ---
    const indiaPolicies = allData; 
    console.log("3. Showing ALL records (Filter temporarily disabled)");

    const container = document.getElementById('india-container');
    if (!container) {
        console.error("4. ERROR: Could not find 'india-container' in your HTML.");
        return;
    }
    container.innerHTML = ''; 

    indiaPolicies.forEach((p, index) => {
        console.log(`5. Processing Record #${index + 1}:`, p);

        const policyData = {
            ...p,
            // Grab name from literally anywhere in the object if p.name is missing
            name: p.name || p["Policy_Name"] || Object.values(p)[0] || "Unknown",
            id: p["Policy No."] || "N/A",
            sumAssured: p["Sum Assured"] || 0,
            commenced: (p["Policy Age"] || "01 Jan 2010").toString().replace(/\./g, ' '),
            maturity: (p["Maturity Date"] || "01 Jan 2030").toString().replace(/\./g, ' '),
            type: p["Category"] || "Insurance",
            color: p["Color_Code"] || "#962524",
            logo: p["Logo_Path"] || "image_4e0b3d.png"
        };

        try {
            const cardHtml = createPolicyCard(policyData, "₹", TODAY, CURRENT_YEAR);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardHtml;
            container.appendChild(wrapper.firstElementChild);
        } catch (e) { 
            console.error("6. Card Rendering Failed:", e); 
        }
    });
}

function updateSummary(list, sym) {
    const totalPrem = list.reduce((sum, pol) => sum + (pol.premiumNumeric || 0), 0);
    const elem = document.getElementById('total-premium');
    if (elem) elem.innerText = sym + totalPrem.toLocaleString('en-IN');
}

// Utility exports for the component
export const autoFmt = (v, s) => (isNaN(parseFloat(String(v).replace(/[^\d.]/g, "")))) ? v : s + parseFloat(String(v).replace(/[^\d.]/g, "")).toLocaleString('en-IN');
export const toNum = (v) => parseFloat(String(v).replace(/[^\d.]/g, "")) || 0;
export const raw = (v) => v || "";
export const checkIsDueSoon = (d) => {
    if (!d || d === "PAID UP" || d === "N/A") return false;
    const parts = d.split(' ');
    const due = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
};

initIndia();
