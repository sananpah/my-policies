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
    // 1. Fetch all rows from Google Sheets via loader.js
    const allData = await fetchPortfolioData();
    
    // 2. Filter for Indian Policies 
    // Logic: loader.js detects 'India' if the Premium attribute contains '₹'
    const indiaPolicies = allData.filter(row => row.detectedCountry === "India");

    const container = document.getElementById('india-container');
    if (!container) return;
    
    // Clear existing static content
    container.innerHTML = ''; 

    // 3. Render each policy card using the parsed data from the Sheet
    indiaPolicies.forEach(p => {
        /**
         * Mapping the Sheet data to the format expected by component_in.js
         * Uses the 'p.name' and 'p.company' that were parsed from 
         * "Insurance [Investment].Name of the policy" in loader.js
         */
        const policyData = {
            ...p,
            name: p.name || p["Policy_Name"] || "Unnamed Policy", 
            company: p.company || "Insurance",
            premium: p.premiumNumeric,   // Numeric value for calculations
            
            // Explicitly mapping Excel headers to component attributes
            id: p["Policy Number"],
            sumAssured: p["Sum Assured"],
            commenced: p["Commencement Date"],
            premiumEnds: p["Premium End Date"],
            maturity: p["Maturity Date"],
            nextDueDate: p["Next Due Date"],
            status: p["Status"] || "Active",
            color: p["Color Code"] || "#962524",
            logo: p["Logo Path"] || "default-logo.png"
        };

        // Generate the HTML using the existing component logic
        // Passing "₹" as the currency symbol
        const cardHtml = createPolicyCard(policyData, "₹", TODAY, CURRENT_YEAR);
        
        // Inject into the container
        const wrapper = document.createElement('div');
        wrapper.innerHTML = cardHtml;
        container.appendChild(wrapper.firstElementChild);
    });

    // Update Top Summary
    updateSummary(indiaPolicies, "₹");
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
