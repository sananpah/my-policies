/* data_health.js - AIA Health Policies */
export const healthData = [
    {
        id: "H237311630",
        owner: "Self",
        name: "HealthShield Gold Max",
        company: "AIA",
        logo: "logo_AIA.png",
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
        owner: "Self",
        name: "HealthShield Gold Max Rider",
        company: "AIA",
        logo: "logo_AIA.png",
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
        id: "33401114",
        owner: "Self",
        name: "PruLink Protection",
        company: "Prudential",
        logo: "logo_Prudential.png",
        category: "Critical Illness",
        cashAmount: 2849.28,
        currency: "SGD",        
        totalPaid: 72835.86,
        sumAssured: 139000,
        expiryDate: "04 Jul 2086",
        benefits: [
            "Total and Permanent Disabilty : $139,000",
            "Terminal Illness : $139,000",
            "Critical Illness: S$100,000",
            "Critical Illness: Premium Waiver",
            "Lifetime Cover: Protection active until 2086"
        ],
        nominee: "Wife/Daughter",
        color: "#ED1B2E",
        isOverlap: true
    },
    {
        id: "P565596237",
        owner: "Self",
        name: "Multistage Cancer Cover",
        company: "AIA",
        logo: "logo_AIA.png",
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
        owner: "Self",
        name:  "ElderShield Plus",
        company: "SingLife",
        logo: "logo_SingLife.png",
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
        owner: "Self",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "logo_ManuLife.png",
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
        nominee: "Wife/Daughter",
        color: "#00a758"
    },
    {
        id: "84779015",
        owner: "Wife",
        name: "Great SupremeHealth A +",
        company: "Great Eastern",
        logo: "logo_GreatEastern.png",
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
        id: "34874419",
        owner: "Daughter",
        name: "PruSave",
        company: "Prudential",
        logo: "logo_Prudential.png",
        category: "Critical Illness",
        cashAmount: 3557.55,
        currency: "SGD",        
        totalPaid: 69176.18,
        sumAssured: 40000,
        expiryDate: "31 Jan 2029",
        benefits: [
            "Daughter Permanent Disabilty : $40,000",
            "Father Death/Disability Waiver : Premium Waiver",
            "Father Critical Illness Waiver: Premium Waiver"
        ],
        nominee: "N/A",
        color: "#ED1B2E",
        isOverlap: true
    },
    {
        id: "2470883285",
        owner: "Daughter",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "logo_ManuLife.png",
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
        nominee: "Self/Wife",
        color: "#00a758"
  },
   {
        id: "2452234994",
        owner: "Daughter",
        name:  "ManuInvest Duo",
        company: "MANULIFE SINGAPORE",
        logo: "logo_ManuLife.png",
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
        nominee: "Self/Wife",
        color: "#00a758"
  },
  {
        id: "93056937",
        owner: "Daughter",
        name:  "Enhanced IncomeShield Preferred",
        company: "INCOME",
        logo: "logo_NTUC.png",
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
        id: "2856207053065200000",
        owner: "Family",
        name: "Optima Secure",
        company: "HDFC ERGO",
        logo: "logo_HDFCErgo.png",
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
