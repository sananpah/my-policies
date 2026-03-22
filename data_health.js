/* data_health.js - AIA Health Policies */
export const healthData = [
    {
        id: "H237311630",
        owner: "Suhail",
        name: "HealthShield Gold Max",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Hospitalisation",
        premium: 1764.47, // $565.47 (CPF) + $1199 (Cash)
        currency: "SGD",
        paymentMode: "CPF + ANNUAL",
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
        owner: "Suhail",
        name: "HealthShield Gold Max Rider",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Hospitalisation",
        premium: 1516.84,
        currency: "SGD",
        paymentMode: "ANNUAL",
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
        owner: "Suhail",
        name: "Multistage Cancer Cover",
        company: "AIA",
        logo: "image_4b9b3f.png",
        category: "Critical Illness",
        premium: 1268.25,
        currency: "SGD",
        paymentMode: "ANNUAL",
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
        owner: "Suhail",
        name:  "ElderShield Plus",
        company: "SingLife",
        logo: "image_89093e.png",
        category: "ACCIDENT",
        premium: 598.08,
        currency: "SGD",
        paymentMode: "CPF",
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
        owner: "Suhail",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "ACCIDENT",
        premium: 104.40,
        currency: "SGD",
        paymentMode: "ANNUAL",
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
        id: "2470883285",
        owner: "Sulmas",
        name:  "Ready Protect Head Start",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "ACCIDENT",
        premium: 104.40,
        currency: "SGD",
        paymentMode: "ANNUAL",
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
        owner: "Sulmas",
        name:  "ManuInvest Duo",
        company: "MANULIFE SINGAPORE",
        logo: "image_d1e382.png",
        category: "Critical Illness",
        premium: 1800,
        currency: "SGD",
        paymentMode: "ANNUAL",
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
        owner: "Sulmas",
        name:  "Enhanced IncomeShield Preferred",
        company: "INCOME",
        logo: "image_2c7d5fk.png",
        category: "Hospitalisation",
        premium: 739.57,
        currency: "SGD",
        paymentMode: "ANNUAL",
        totalPaid: 739.57,
        sumAssured: 0 ,
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
        owner: "Saima",
        name: "Great SupremeHealth A +",
        company: "Great Eastern",
        logo: "image_4d3e8m.png",
        category: "Hospitalisation",
        premium: 883.53, 
        currency: "SGD",
        paymentMode: "CPF + ANNUAL",
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
    }
];
