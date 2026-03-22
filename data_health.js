/* data_health.js - AIA Health Policies */
export const healthData = [
    {
        id: "H237311630",
        owner: "Father",
        name: "HealthShield Gold Max",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Hospitalisation",
        cashAmount:1199,
        cpfAmount:565.47,
        currency: "SGD",       
        totalPaid: 8685.00,
        sumAssured: 1000000, // Hospitalisation limit per year
        expiryDate: "01 Sep 2077",
        benefits: [
            "Hospitalisation: $1,000,000 / year",
            "Ward: Private - Standard room",
            "As-Charged Coverage",
            "MediShield Life Included"
        ],
        nominee: "N/A",
        color: "#d31145"
    },
    {
        id: "E237311630",
        owner: "Father",
        name: "HealthShield Gold Max Rider",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Hospitalisation",
        cashAmount: 1516.84,
        currency: "SGD",
        totalPaid: 13051.06,
        sumAssured: 0, // Rider usually enhances the main plan
        expiryDate: "01 Sep 2077",
        benefits: [
            "Emergency and OutPatient Care: $2000 / year",
            "Cancer Care Booster: 21x Medishield Limit",
            "Non Cancer Drug List: $200,000 / year",
            "Co-insurance cap: $50,000 /year",
            "Public Hospital 5% co-payment (cap at $3,000 / year)",
            "Private Hospital Deductible: $2,000"
        ],
        nominee: "N/A",
        color: "#d31145"
    },
    {
        id: "P565596237",
        owner: "Father",
        name: "Multistage Cancer Cover",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Critical Illness",
        cashAmount: 1268.25,
        currency: "SGD",        
        totalPaid: 3307.14,
        sumAssured: 150000,
        expiryDate: "03 Aug 2043",
        benefits: [
            "Major Critical Illness",
            "Multistage Payout"
        ],
        nominee: "N/A",
        color: "#d31145"
    },
   {
        id: "E5664237",
        owner: "Father",
        name:  "ElderShield Plus",
        company: "SingLife",
        logo: "image_89093e.png",
        category: "ACCIDENT",
        cpfAmount: 598.08,
        currency: "SGD",        
        totalPaid: 5211.42,
        sumAssured: 1300,
        expiryDate: "24.Mar.2075",
        benefits: [
            "Lifetime Monthly Payouts",
        ],
        nominee: "N/A",
        color: "#E60000"
    },
    {
        id: "2470883269",
        owner: "Father",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "ACCIDENT",
        cashAmount: 104.40,
        currency: "SGD",
        totalPaid: 104.40,
        sumAssured: 50000 ,
        expiryDate: "07.Jul.2076",
        benefits: [
            "Accidental Death Benefit : $50,000",
            "Accidental Major Reimbursment(Local/Overseas) : $1,000/$2,000"   
        ],
        nominee: "Mother/Daughter",
        color: "#00a758"
    },
   {
        id: "2470883285",
        owner: "Daughter",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "ACCIDENT",
        cashAmount: 104.40,
        currency: "SGD",
        totalPaid: 104.40,
        sumAssured: 50000 ,
        expiryDate: "07.Jul.2076",
        benefits: [
            "Accidental Death Benefit : $50,000",
            "Accidental Major Reimbursment(Local/Overseas) : $1,000/$2,000"   
        ],
        nominee: "Father/Mother",
        color: "#00a758"
  },
   {
        id: "2452234994",
        owner: "Daughter",
        name:  "ManuInvest Duo",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "Critical Illness",
        cashAmount: 1800,
        currency: "SGD",
        totalPaid: 1800,
        sumAssured: 120000 ,
        expiryDate: "08.Jul.2103",
        benefits: [
            "Terminal Illness to age 99",
            "Total and Permanent Disability to age 70",
            "Early Critical Care Rider"
            
        ],
        nominee: "Father/Mother",
        color: "#00a758"
  },
  {
        id: "93056937",
        owner: "Daughter",
        name:  "Enhanced IncomeShield Preferred",
        company: "INCOME",
        logo: "image_2c7d5fk.png",
        category: "Hospitalisation",
        cashAmount: 739.57,
        currency: "SGD",
        totalPaid: 739.57,
        sumAssured: 1000000 ,
        expiryDate: "09.Jul.2076",
        benefits: [
            "Hospitalisation: $1,000,000 / year",
            "Ward: Private - Standard room",
            "As-Charged Coverage"
        ],
        nominee: "N/A",
        color: "#FD7E14"
  },
  {
        id: "84779015",
        owner: "Mother",
        name: "Great SupremeHealth A +",
        company: "Great Eastern",
        logo: "image_4d3e8m.png",
        category: "Hospitalisation",
        cpfAmount: 883.53, 
        currency: "SGD",
        totalPaid: 8885,
        sumAssured: 1000000, // Hospitalisation limit per year
        expiryDate: "01 May 2075",
        benefits: [
            "Hospitalisation: $1,000,000 / year",
            "Ward: Restructured Hospital Class A",
            "Panel/Restructured Hospital 5% co-payment (cap at $3,000 / year )"
        ],
        nominee: "N/A",
        color: "#ED1C24"
    },
    {
        id: "2856207053065200000",
        owner: "Family",
        name: "Optima Secure",
        company: "HDFC ERGO",
        logo: "image_6h3d9f.png",
        category: "Hospitalisation",
        cashAmount: 48717,
        currency: "INR",
        totalPaid: 146152.06,
        sumAssured: 1500000, // Hospitalisation limit per year
        expiryDate: "22 Dec 2027",
        benefits: [
            "Hospitalisation: ₹ 15 lakh  / year",
            "Pre-Hospitalisation : 60 days",
            "Post-Hospitalisation : 180 days",
            "Renewal every 3 years"
        ],
        nominee: "N/A",
        color: "#E21F26"
    }
];
