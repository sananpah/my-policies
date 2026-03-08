// data.js
export const POLICY_DATA = {
    india: [
        { 
            name: "Nishchit Ace", company: "IndusInd Nippon Life",
            logo: "image_4e0b3d.png", id: "54751949", uin: "128N171V01", clientId: "60938507", type: "SAVINGS", 
            premium: 209000, sumAssured: 2626948, dueDate: "17 Nov 2026", 
            commenced: "17 Nov 2025", premiumEnds: "17 Nov 2034", maturity: "17 Nov 2055", 
            color: "#8b1d1d", maturityAmt: "₹ 2,626,948",
            payoutSchedule: { 11: 133974, 12: 133974, 13: 133974, 14: 133974, 15: 133974, 16: 160769, 17: 160769, 18: 160769, 19: 160769, 20: 160769, 21: 187564, 22: 187564, 23: 187564, 24: 187564, 25: 187564, 26: 214359, 27: 214359, 28: 214359, 29: 214359, 30: 214359 }
        },
        { 
            name: "Nishchit Pension SL", company: "IndusInd Nippon Life",
            logo: "image_4e0b3d.png", id: "54679062", uin: "128N161V04", clientId: "60938507", type: "RETIREMENT", 
            premium: 200000, sumAssured: 2000000, dueDate: "30 May 2026", 
            commenced: "30 May 2025", premiumEnds: "30 May 2030", maturity: "30 May 2077", 
            color: "#8b1d1d", annualPayout: 89830, maturityAmt: "Special Surrender Value", defermentYear: 2031
        },
        { 
            name: "Nishchit Samrudhi Income Limited", company: "IndusInd Nippon Life",
            logo: "image_4e0b3d.png", id: "54040166", uin: "128N154V02", clientId: "60938507", type: "SAVINGS", 
            premium: 200000, sumAssured: 1750854, dueDate: "10 Jan 2027", 
            commenced: "10 Jan 2022", premiumEnds: "10 Jan 2028", maturity: "10 Jan 2050", 
            color: "#8b1d1d", maturityAmt: "₹ 1,750,854",
            payoutSchedule: { 8: 100000, 9: 100000, 10: 100000, 11: 100000, 12: 100000, 13: 100000, 14: 100000, 15: 100000, 16: 100000, 17: 100000, 18: 100000, 19: 100000, 20: 100000, 21: 100000, 22: 100000, 23: 100000, 24: 100000, 25: 100000, 26: 100000, 27: 100000, 28: 100000 }
        },
        { 
            name: "Guaranteed Moneyback", company: "IndusInd Nippon Life",
            logo: "image_4e0b3d.png", id: "53044042", uin: "128N053V02", clientId: "60938507", type: "SAVINGS", 
            premium: 14400, sumAssured: 123940, dueDate: "08 Sep 2026", 
            commenced: "08 Sep 2017", premiumEnds: "08 Sep 2026", maturity: "08 Sep 2032", 
            color: "#8b1d1d", maturityAmt: "Loyalty: ₹ 37,170 + Mat: ₹ 18,591", 
            payoutSchedule: { 11: 18591, 12: 18591, 13: 18591, 14: 18591, 15: 49576 } 
        },
        { 
            name: "Retirement Savings", company: "KOTAK",
            logo: "image_5d7f80.png", id: "79079094", uin: "107N105V02", clientId: "61491746", type: "RETIREMENT", 
            premium: 50000, sumAssured: 323695, dueDate: "13 Mar 2026", 
            commenced: "13 Mar 2025", premiumEnds: "13 Mar 2031", maturity: "13 Mar 2040", 
            color: "#e63946", maturityAmt: "₹ 3,23,695 + Bonus", isULIP: true 
        },
        { 
            name: "Fortune Maximiser", company: "KOTAK",
            logo: "image_5d7f80.png", id: "79425536", uin: "107N124V01", clientId: "61491746", type: "SAVINGS", 
            premium: 70000, sumAssured: 711994, dueDate: "14 Aug 2026", 
            commenced: "14 Aug 2025", premiumEnds: "14 Aug 2034", maturity: "14 Aug 2089", 
            color: "#e63946", bonusAmount: 22050, bonusStartYear: 2, income: "Est. Yearly: ₹ 23,140", maturityAmt: "₹ 7,11,994 + Bonus" 
        },
        { 
            name: "Wealth Pro", company: "BHARTI AXA",
            logo: "image_86c684.png", id: "503-9562771", uin: "130A012V02", type: "ULIP", 
            premium: 50000, sumAssured: 0, dueDate: "28 Sep 2026", 
            commenced: "28 Sep 2023", premiumEnds: "28 Sep 2029", maturity: "28 Sep 2038", 
            color: "#005a9c", maturityAmt: "Unit Value", isULIP: true
        },
        { 
            name: "Fast Track Super", company: "Axis Max Life",
            logo: "image_7a80d9.png", id: "608480927", uin: "104L082V02", type: "ULIP", 
            premium: 50000, sumAssured: 0, dueDate: "PAID UP", 
            commenced: "04 Feb 2022", premiumEnds: "04 Feb 2026", maturity: "04 Feb 2032", 
            color: "#ae125d", maturityAmt: "Unit Value", isULIP: true
        },
        { 
            name: "Life Assure Goal", company: "BAJAJ LIFE",
            logo: "image_349b41.png", id: "425335400", uin: "116L153V02", type: "ULIP", 
            premium: 60000, sumAssured: 600000, dueDate: "PAID UP", 
            commenced: "06 Nov 2020", premiumEnds: "06 Oct 2025", maturity: "05 Nov 2030", 
            color: "#005a9c", maturityAmt: "Unit Value", isULIP: true
        },
        { 
            name: "Life Future Gain II", company: "BAJAJ LIFE",
            logo: "image_349b41.png", id: "378816898", uin: "116L181V01", type: "ULIP", 
            premium: 30000, sumAssured: 300000, dueDate: "PAID UP", 
            commenced: "28 Nov 2019", premiumEnds: "28 Oct 2024", maturity: "27 Nov 2029", 
            color: "#005a9c", maturityAmt: "Unit Value", isULIP: true
        }
    ],
    wife: [
        { 
            name: "Signature", company: "ICICI PRUDENTIAL",
            logo: "image_d82175.png", id: "K7639543", uin: "N/A", clientId: "N/A", type: "ULIP", 
            premium: 500000, sumAssured: 5000000, dueDate: "29 Nov 2026", 
            commenced: "29 Nov 2025", premiumEnds: "29 Nov 2032", maturity: "29 Nov 2052", 
            color: "#9b2226", maturityAmt: "Unit Value", isULIP: true 
        },
        { 
            name: "Smart Privilege Plus LP Plan P", company: "SBI LIFE",
            logo: "image_cda45c.png", id: "3N307267702", uin: "N/A", clientId: "N/A", type: "ULIP", 
            premium: 600000, sumAssured: 4200000, dueDate: "23 Apr 2026", 
            commenced: "23 Apr 2025", premiumEnds: "23 Apr 2029", maturity: "23 Apr 2040", 
            color: "#2563eb", maturityAmt: "Unit Value", isULIP: true 
        }
    ],
    singapore: [
        { 
            name: "Pro-Achiever 2.0", company: "AIA SINGAPORE",
            logo: "image_4b9b3f.png", id: "U126327913", uin: "N/A", clientId: "N/A", type: "ILP", 
            premium: 5000, sumAssured: 0, dueDate: "30 Dec 2026", 
            commenced: "30 Dec 2021", premiumEnds: "30 Dec 2031", maturity: "30 Dec 2077", 
            color: "#d31145", currency: "$", maturityAmt: "Unit Value", isULIP: true 
        }
    ]
};
