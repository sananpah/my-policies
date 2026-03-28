/* india.js - Utility Section */

/* india.js */
import { fetchPortfolioData } from './loader.js';

async function initIndia() {
    const allData = await fetchPortfolioData();
    
    // Filter rows that belong to India Life Insurance
    const indiaPolicies = allData.filter(row => 
        row.Country === "India" && row.Category === "Life Insurance"
    );

    const container = document.getElementById('india-container');
    container.innerHTML = ''; 

    indiaPolicies.forEach(p => {
        // Use your existing rendering logic here
        // Ensure the mapping matches your Google Sheet column names
        const card = createPolicyCard({
            policyName: p["Policy Name"],
            premiumAmount: parseFloat(p["Premium"]),
            nextDueDate: p["Due Date"]
            // ... add other fields
        });
        container.appendChild(card);
    });
}

initIndia();

const TODAY = new Date();

      export function checkIsDueSoon(dueDateStr) {
            if (!dueDateStr || dueDateStr === "PAID UP") return false;
            const parts = dueDateStr.split(' '); 
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
            return isNaN(num) ? val : sym + num.toLocaleString();
        }

        export function raw(val) { return (val === undefined || val === null) ? "" : val; }

        export function toNum(val) {
            if(!val) return 0;
            const clean = String(val).replace(/[₹$,\s]/g, "");
            const n = parseFloat(clean);
            return isNaN(n) ? 0 : n;
        }
