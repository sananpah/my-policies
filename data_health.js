// data_health.js — Health insurance policies
// Populate with real data from your sheet.
// Structure mirrors what your health.js component expects.
export const healthData = [
    // --- Singapore health policies ---
    {
        id: "H-SG-001",
        name: "Integrated Shield Plan",
        company: "Great Eastern",
        category: "Hospital & Surgical",
        type: "Hospitalisation",
        currency: "SGD",
        coverage: 500000,
        sumAssured: 500000,
        cashAmount: 1800,
        cpfAmount: 900,
        expiryDate: "Annual Renewal",
        status: "Active",
        owner: "Self",
        assignedTo: "Self",
        color: "#00a758"
    },
    {
        id: "H-SG-002",
        name: "CareShield Life",
        company: "Government / CPF",
        category: "Long Term Care",
        type: "Disability",
        currency: "SGD",
        coverage: 0,
        sumAssured: 0,
        cashAmount: 0,
        cpfAmount: 206,
        expiryDate: "Lifelong",
        status: "Active",
        owner: "Self",
        assignedTo: "Self",
        color: "#005a9c"
    },
    // --- India health policies ---
    {
        id: "H-IN-001",
        name: "Health Insurance Policy",
        company: "Star Health",
        category: "Health",
        type: "Mediclaim",
        currency: "INR",
        coverage: 1000000,
        sumAssured: 1000000,
        cashAmount: 22000,
        expiryDate: "Annual Renewal",
        status: "Active",
        owner: "Family",
        assignedTo: "Family",
        color: "#d31145"
    }
];
