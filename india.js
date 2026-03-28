/* india.js */
import { fetchPortfolioData } from './loader.js';
import { createPolicyCard } from './component_in.js';

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

async function initIndia() {
    const allData = await fetchPortfolioData();
    const indiaPolicies = allData.filter(p => p.detectedCountry === "India");

    const container = document.getElementById('india-container');
    if (!container) return;
    container.innerHTML = ''; 

    indiaPolicies.forEach(p => {
        const policyData = {
            ...p,
            name: p.name || "Unnamed Policy",
            id: p["Policy No."] || "N/A",
            sumAssured: p["Sum Assured"] || 0,
            // Convert dots to spaces for the component parser
            commenced: (p["Policy Age"] || "01 Jan 2010").replace(/\./g, ' '),
            maturity: (p["Maturity Date"] || "01 Jan 2030").replace(/\./g, ' '),
            premiumEnds: (p["Maturity Date"] || "01 Jan 2030").replace(/\./g, ' '),
            nextDueDate: (p["Last Premium Date"] || "N/A").replace(/\./g, ' '),
            type: p["Category"] || "Insurance",
            color: p["Color_Code"] || "#962524",
            logo: p["Logo_Path"] || "image_4e0b3d.png"
        };

        try {
            const cardHtml = createPolicyCard(policyData, "₹", TODAY, CURRENT_YEAR);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardHtml;
            container.appendChild(wrapper.firstElementChild);
        } catch (e) { console.error("Card Crash:", e); }
    });
    updateSummary(indiaPolicies, "₹");
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
