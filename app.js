/* app.js - v4.1.35 - Dynamic Asset Loading & Health Avatar Injection */

// We define these as placeholders to be populated during initDashboard
let syncWithGoogleSheets, createPolicyCard, createSGCard, createHealthCard;
let healthData, POLICY_DATA;
let toNum, parseDate, autoFmt, calculatePortfolioTotals, calculateFamilyBreakdown, calculateHealthTotals, insuredMap;

window.currentCategory = 'india';
let localPolicyData = {};

/**
 * Entry point called by index.html
 * @param {string} version - The version string from index.html
 */
export async function initDashboard(version) {
    console.log("Nami Portfolio Engine [Build " + version + "]");
    
    try {
        // --- STEP 1: DYNAMIC ASSET LOADING ---
        const [loader, compIn, compSg, health, dataH, dataP, utils] = await Promise.all([
            import(`./loader.js?v=${version}`),
            import(`./component_in.js?v=${version}`),
            import(`./component_sg.js?v=${version}`),
            import(`./health.js?v=${version}`),
            import(`./data_health.js?v=${version}`),
            import(`./data.js?v=${version}`),
            import(`./utils.js?v=${version}`)
        ]);

        // --- STEP 2: ASSIGN IMPORTS TO LOCAL SCOPE ---
        syncWithGoogleSheets = loader.syncWithGoogleSheets;
        createPolicyCard = compIn.createPolicyCard;
        createSGCard = compSg.createSGCard;
        createHealthCard = health.createHealthCard;
        healthData = dataH.healthData;
        POLICY_DATA = dataP.POLICY_DATA;
        
        // Destructure Utils
        ({ toNum, parseDate, autoFmt, calculatePortfolioTotals, calculateFamilyBreakdown, calculateHealthTotals, insuredMap } = utils);

        // --- STEP 3: INITIALIZE DATA ---
        localPolicyData = await syncWithGoogleSheets(POLICY_DATA);
        
        // Initial Render
        render('india');

    } catch (e) {
        console.error("Critical Load Failure:", e);
        if (POLICY_DATA) {
            localPolicyData = POLICY_DATA;
            render('india');
        }
    }
}

export function render(cat) {
    window.currentCategory = cat;
    const sortBy = document.getElementById('sort-trigger').value;
    const container = document.getElementById('container');
    const statusBadge = document.getElementById('portfolio-status');
    const sortContainer = document.getElementById('sort-container');
    const summaryBar = document.getElementById('summary-bar');

    const TODAY = new Date();
    const CURRENT_YEAR = TODAY.getFullYear();
  
    if (cat === 'health') {
        sortContainer.classList.add('invisible');
        statusBadge.innerHTML = '<span class="material-symbols-outlined text-xs align-middle mr-1">medical_services</span> HEALTH PORTFOLIO';
        updateHealthSummary(summaryBar);
    } else {
        sortContainer.classList.remove('invisible');
        const flagSrc = (cat === 'india') ? 'in' : 'sg';
        statusBadge.innerHTML = `<img src="https://flagcdn.com/w40/${flagSrc}.png" class="w-5 h-auto inline-block align-middle mr-2 rounded-sm">${cat.toUpperCase()} PORTFOLIO`;
        updatePolicySummary(summaryBar, cat);
    }

    let list = cat === 'health' ? [...healthData] : [...(localPolicyData[cat] || [])];
    const sym = (cat === 'singapore') ? "$" : "₹";

    // Sorting logic preserved for India/Singapore
    if (cat !== 'health') {
        if (sortBy === 'premium') list.sort((a, b) => toNum(b.premium) - toNum(a.premium));
        else if (sortBy === 'due') list.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
        else if (sortBy === 'time') list.sort((a, b) => parseDate(a.premiumEnds) - parseDate(b.premiumEnds));
    }

    // Child policies (p.linkedTo set) render inside their parent card — skip at top level
    const renderList = (cat === 'india') ? list.filter(p => !p.linkedTo) : list;

    container.innerHTML = renderList.map(p => {
     if (cat === 'health') {
            // Inject avatar and type into the health policy object before rendering
            const identity = insuredMap[p.owner] || { type: "Other", img: null };
            
            // --- NEW: Parse Health Nominees using insuredMap ---
            const rawNom = String(p.nominee || "").trim();
            let parsedNominees = [];
            let nomStatus = "ASSIGNED";
            
            if (!rawNom || rawNom.toLowerCase() === "n/a") {
                nomStatus = rawNom.toLowerCase() === "n/a" ? "NA" : "EMPTY";
            } else {
                const names = rawNom.split(/,|\/|\band\b|&|\n|\r/).map(n => n.trim());
                names.forEach(name => {
                    const clean = name.replace(/[^\x20-\x7E]/g, "").trim();
                    if (!clean) return;
                    let img = "avatar_unknown.png";
                    const mapped = Object.entries(insuredMap).find(([full]) => clean.toLowerCase().includes(full.toLowerCase()));
                    if (mapped) img = mapped[1].img;
                    parsedNominees.push({ name: clean, img: img });
                });
            }

            const healthPolicy = { 
                ...p, 
                avatar: identity.img, 
                holderType: identity.type,
                nominees: parsedNominees,
                nomineeStatus: nomStatus
            };
            return createHealthCard(healthPolicy);
        }
        
        if (cat === 'singapore') return createSGCard(p, sym, TODAY, CURRENT_YEAR);
        
        // India logic
        return createPolicyCard(p, sym, TODAY, CURRENT_YEAR, list);
    }).join('');
}

export function handleToggle(id) {
    const card = document.getElementById('card-' + id);
    if (!card) return;
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.policy-card, .health-card').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
}

function updateHealthSummary(bar) {
    bar.className = "flex items-center justify-between bg-slate-900 p-6 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500";
    
    // Filter out policies that are also covered in the Singapore portfolio
    const uniqueHealthData = healthData.filter(p => !p.isOverlap);
    const totals = calculateHealthTotals(uniqueHealthData);
    
    bar.innerHTML = `
        <div class="flex items-center gap-2 pl-4">
            <span class="material-symbols-outlined text-emerald-500 text-3xl">medical_services</span>
            <span class="text-sm font-black uppercase tracking-widest ml-2">Health Portfolio</span>
        </div>
        <div class="flex gap-6 pr-4">
            <div class="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <img src="https://flagcdn.com/w40/sg.png" class="w-4 h-auto rounded-sm">
                <span class="text-lg font-black text-white">${autoFmt(totals.sg, "$")}</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
                <img src="https://flagcdn.com/w40/in.png" class="w-4 h-auto rounded-sm">
                <span class="text-lg font-black text-white">${autoFmt(totals.inr, "₹")}</span>
            </div>
        </div>`;
}

function updatePolicySummary(bar, cat) {
    const list = localPolicyData[cat] || [];
    const sym = (cat === 'singapore') ? "$" : "₹";
    const totals = calculatePortfolioTotals(list);
    
    bar.className = "grid grid-cols-[1.2fr_1fr_1fr] gap-6 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500";

    let familyHtml = '';
    if (cat === 'india') {
        const fam = calculateFamilyBreakdown(list);
        familyHtml = `
            <div class="flex justify-center gap-4 mt-4 pt-3 border-t border-slate-800/50">
                <div class="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full border border-slate-700/30">
                    <img src="avatar_self.png" class="w-5 h-5 rounded-full object-cover border border-slate-500">
                    <span class="text-[11px] font-black">${autoFmt(fam.self, sym)}</span>
                </div>
                <div class="flex items-center gap-2 bg-pink-900/20 px-3 py-1.5 rounded-full border border-pink-700/30">
                    <img src="avatar_wife.png" class="w-5 h-5 rounded-full object-cover border border-pink-500">
                    <span class="text-[11px] font-black text-pink-200">${autoFmt(fam.wife, sym)}</span>
                </div>
                <div class="flex items-center gap-2 bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-700/30">
                    <img src="avatar_daughter.png" class="w-5 h-5 rounded-full object-cover border border-indigo-500">
                    <span class="text-[11px] font-black text-indigo-200">${autoFmt(fam.daughter, sym)}</span>
                </div>
            </div>`;
    }

    bar.innerHTML = `
        <div class="border-r border-slate-700 text-center pr-6">
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Total Sum Assured</p>
            <p class="text-4xl font-black text-emerald-400">${autoFmt(totals.sa, sym)}</p>
            ${familyHtml}
        </div>
        <div class="border-r border-slate-700 text-center">
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Annual Premium</p>
            <p class="text-4xl font-black text-indigo-400">${autoFmt(totals.premium, sym)}</p>
        </div>
        <div class="text-center">
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Portfolio Value</p>
            <p class="text-4xl font-black text-pink-500">${autoFmt(totals.unitValue, sym)}</p>
        </div>`;
}
