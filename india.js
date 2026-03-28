/* india.js */
import { fetchPortfolioData } from './loader.js';
import { createPolicyCard } from './component_in.js';

// Global Constants
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

/**
 * Main initializer for the India Portfolio
 */
async function initIndia() {
    const allData = await fetchPortfolioData();
    
    // Filter for India (identified by the currency check in loader)
    const indiaPolicies = allData.filter(p => p.detectedCountry === "India");

    const container = document.getElementById('india-container');
    if (!container) return;
    container.innerHTML = ''; 

    /* india.js - Inside the loop */
    indiaPolicies.forEach(p => {
        const policyData = {
            ...p,
            // CRITICAL: This must match what parseInsuranceTab creates
            name: p.name || "N/A",      
            company: p.company || "N/A", 
            premium: p.premiumNumeric || 0,
            
            // Use the exact headers seen in your Debug Bar
            id: p["Policy No."] || "N/A",
            sumAssured: p["Sum Assured"] || 0,
            commenced: p["Policy Age"] || "01 Jan 2015", 
            maturity: p["Maturity Date"] || "01 Jan 2030",
            nextDueDate: p["Last Premium Date"] || "N/A",
            status: p["Status"] || "Active",
            color: p["Color_Code"] || "#962524",
            logo: p["Logo_Path"] || "image_4e0b3d.png"
        };
    
        // This calls the function that actually builds the HTML
        const cardHtml = createPolicyCard(policyData, "₹", TODAY, CURRENT_YEAR);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = cardHtml;
        container.appendChild(wrapper.firstElementChild);
    });
}

/**
 * Updates the global summary totals
 */
function updateSummary(list, sym) {
    const totalPrem = list.reduce((sum, pol) => sum + (pol.premiumNumeric || 0), 0);
    const premiumElem = document.getElementById('total-premium');
    if (premiumElem) {
        premiumElem.innerText = sym + totalPrem.toLocaleString('en-IN');
    }
}

// --- UTILITY SECTION ---
// These are exported for use by component_in.js to handle timeline and hover logic

export function checkIsDueSoon(dueDateStr) {
    if (!dueDateStr || dueDateStr === "PAID UP") return false;
    const parts = dueDateStr.split(' '); 
    // Format: "DD MMM YYYY"
    const due = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
    const diff = (due - TODAY) / 86400000;
    return diff >= 0 && diff <= 30;
}

export function getTimeLeft(endDateStr) {
    if (!endDateStr || endDateStr === "PAID UP") return null;
    const parts = endDateStr.split(' ');
    const end = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
    let years = end.getFullYear() - TODAY.getFullYear();
    let months = end.getMonth() - TODAY.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years < 0) return null;
    return `${String(years).padStart(2, '0')}y${String(months).padStart(2, '0')}m`;
}

export function autoFmt(val, sym) {
    if (val === undefined || val === null) return sym + "0";
    const clean = String(val).replace(/[₹$,\s]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? val : sym + num.toLocaleString('en-IN');
}

export function raw(val) { 
    return (val === undefined || val === null) ? "" : val; 
}

export function toNum(val) {
    if(!val) return 0;
    const clean = String(val).replace(/[₹$,\s]/g, "");
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
}

// Initialize the dashboard
initIndia();
