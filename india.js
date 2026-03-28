/* india.js */
import { fetchPortfolioData } from './loader.js';
import { createPolicyCard } from './component_in.js';

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

async function initIndia() {
    const allData = await fetchPortfolioData();
    
    // Filter for India
    const indiaPolicies = allData.filter(p => p.detectedCountry === "India");

    const container = document.getElementById('india-container');
    if (!container) return;
    container.innerHTML = ''; 

    indiaPolicies.forEach(p => {
        // --- DEBUG: Open your F12 Console to see this ---
        console.log("Raw row from loader:", p);

        const policyData = {
            // 1. Copy everything from the loader first
            ...p, 
            
            // 2. DEEP SCAN for the Name. 
            // We check: parsed name, then raw column name, then first value in object.
            name: p.name || p["Policy_Name"] || p["Policy Name"] || Object.values(p)[0] || "Name Error",
            
            // 3. Mapping other fields with fallbacks
            id: p["Policy No."] || p["Policy No"] || "N/A",
            sumAssured: p["Sum Assured"] || 0,
            
            // Convert dots to spaces (e.g., 31.Jan.2024 -> 31 Jan 2024)
            commenced: (p["Policy Age"] || p["Commencement Date"] || "01 Jan 2010").toString().replace(/\./g, ' '),
            maturity: (p["Maturity Date"] || "01 Jan 2030").toString().replace(/\./g, ' '),
            premiumEnds: (p["Premium Ends"] || p["Maturity Date"] || "01 Jan 2030").toString().replace(/\./g, ' '),
            nextDueDate: (p["Last Premium Date"] || "N/A").toString().replace(/\./g, ' '),
            
            type: p["Category"] || p["Type"] || "Insurance",
            color: p["Color_Code"] || "#962524",
            logo: p["Logo_Path"] || "image_4e0b3d.png"
        };

        try {
            // Pass the newly built policyData
            const cardHtml = createPolicyCard(policyData, "₹", TODAY, CURRENT_YEAR);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardHtml;
            
            if (wrapper.firstElementChild) {
                container.appendChild(wrapper.firstElementChild);
            }
        } catch (e) { 
            console.error("Card Crash for policy:", policyData.name, e); 
        }
    });
    
    if (typeof updateSummary === "function") {
        updateSummary(indiaPolicies, "₹");
    }
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
