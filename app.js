// app.js — Main orchestrator v4.2
import { POLICY_DATA }           from './data.js';
import { healthData }            from './data_health.js';
import { toNum, safeGetYear }    from './india.js';
import { syncWithGoogleSheets }  from './loader.js';
import { createPolicyCard }      from './component_in.js';
import { createSGCard }          from './component_sg.js';
import { createHealthCard }      from './health.js';

const TODAY        = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const APP_VERSION  = "4.2.0";

document.getElementById('version-tag').textContent = `v${APP_VERSION}`;
window.currentCategory = 'india';

/* ── Toggle card expand ───────────────────────────────── */
window.toggleCard = (id) => {
    const card = document.getElementById(`card-${id}`);
    if (!card) return;
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.policy-card, .sg-card, .health-card').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
};

/* ── Tab switch ───────────────────────────────────────── */
window.switchTab = (cat) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-cat="${cat}"]`)?.classList.add('active');
    document.getElementById('sort-group').style.visibility = cat === 'health' ? 'hidden' : 'visible';
    render(cat);
};

/* ── Date parser for sorting ──────────────────────────── */
const parseDate = (str) => {
    if (!str || str === "PAID UP") return new Date(9999, 0, 1);
    const p = str.toString().replace(/\./g, ' ').split(' ');
    return new Date(`${p[1]} ${p[0]}, ${p[2]}`);
};

/* ── Main render ──────────────────────────────────────── */
window.render = function(cat) {
    window.currentCategory = cat;
    const sortBy   = document.getElementById('sort-trigger').value;
    const container = document.getElementById('container');

    let list = cat === 'health' ? [...healthData] : [...(POLICY_DATA[cat] || [])];
    const sym = cat === 'singapore' ? "$" : "₹";

    // Sorting
    if (cat !== 'health') {
        if (sortBy === 'premium') list.sort((a, b) => toNum(b.premium) - toNum(a.premium));
        else if (sortBy === 'due') list.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
        else if (sortBy === 'time') list.sort((a, b) => parseDate(a.premiumEnds) - parseDate(b.premiumEnds));
    }

    // Cards HTML
    container.innerHTML = list.map(p => {
        if (cat === 'health')     return createHealthCard(p);
        if (cat === 'singapore')  return createSGCard(p, sym, TODAY, CURRENT_YEAR);
        return createPolicyCard(p, sym, TODAY, CURRENT_YEAR);
    }).join('');

    // Summary bar
    updateSummary(cat, list, sym);
};

/* ── Summary update ───────────────────────────────────── */
function updateSummary(cat, list, sym) {
    const saEl  = document.getElementById('total-sa');
    const premEl = document.getElementById('total-premium');
    const valEl  = document.getElementById('total-unit-value');
    const famRow = document.getElementById('family-row');
    const summaryInner = document.getElementById('summary-inner');

    if (cat === 'health') {
        const sgTotal  = list.filter(p => p.currency === "SGD")
                             .reduce((a, p) => a + parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0), 0);
        const inCash   = list.filter(p => p.currency === "INR")
                             .reduce((a, p) => a + parseFloat(p.cashAmount || 0), 0);

        summaryInner.innerHTML = `
            <div class="summary-item">
                <span class="summary-lbl">Health Portfolio</span>
                <span class="summary-val" style="font-size:18px;color:rgba(255,255,255,0.7);">Active Policies</span>
            </div>
            <div class="summary-sep"></div>
            <div class="summary-item">
                <img src="https://flagcdn.com/w40/sg.png" style="width:18px;border-radius:2px;margin:0 auto 4px;" alt="">
                <span class="summary-lbl">SG Premium</span>
                <span class="summary-val clr-emerald">$${Math.round(sgTotal).toLocaleString()}</span>
            </div>
            <div class="summary-sep"></div>
            <div class="summary-item">
                <img src="https://flagcdn.com/w40/in.png" style="width:18px;border-radius:2px;margin:0 auto 4px;" alt="">
                <span class="summary-lbl">India Premium</span>
                <span class="summary-val clr-indigo">₹${Math.round(inCash).toLocaleString('en-IN')}</span>
            </div>`;
        famRow.innerHTML = '';
        return;
    }

    // Restore normal layout
    summaryInner.innerHTML = `
        <div class="summary-item">
            <span class="summary-lbl">Sum Assured</span>
            <span class="summary-val clr-emerald" id="total-sa">—</span>
        </div>
        <div class="summary-sep"></div>
        <div class="summary-item">
            <span class="summary-lbl">Annual Premium</span>
            <span class="summary-val clr-indigo" id="total-premium">—</span>
        </div>
        <div class="summary-sep"></div>
        <div class="summary-item">
            <span class="summary-lbl">Portfolio Value</span>
            <span class="summary-val clr-rose" id="total-unit-value">—</span>
        </div>`;

    const tSA        = list.reduce((acc, p) => acc + toNum(p.sumAssured), 0);
    const tUnitValue = list.reduce((acc, p) => acc + (p.unitValueNumeric || 0), 0);
    const tAnn       = list.reduce((acc, p) => {
        const pEndYear    = safeGetYear(p.premiumEnds);
        const isPaid      = (p.status || "").toUpperCase() === "PAID UP" || CURRENT_YEAR > pEndYear;
        return isPaid ? acc : acc + toNum(p.premium || 0);
    }, 0);

    document.getElementById('total-sa').textContent       = sym + Math.round(tSA).toLocaleString('en-IN');
    document.getElementById('total-premium').textContent  = sym + Math.round(tAnn).toLocaleString('en-IN');
    document.getElementById('total-unit-value').textContent = sym + Math.round(tUnitValue).toLocaleString('en-IN');

    // Family breakdown (India only)
    if (cat === 'india') {
        const hSA = list.filter(p => !p.holderType || p.holderType === "Self")
                        .reduce((a, p) => a + toNum(p.sumAssured), 0);
        const wSA = list.filter(p => p.holderType === "Wife")
                        .reduce((a, p) => a + toNum(p.sumAssured), 0);
        const dSA = list.filter(p => p.holderType === "Daughter")
                        .reduce((a, p) => a + toNum(p.sumAssured), 0);

        const chips = [
            { img: 'avatar_self.png',     label: sym + Math.round(hSA).toLocaleString('en-IN'), show: hSA > 0 },
            { img: 'avatar_wife.png',     label: sym + Math.round(wSA).toLocaleString('en-IN'), show: wSA > 0 },
            { img: 'avatar_daughter.png', label: sym + Math.round(dSA).toLocaleString('en-IN'), show: dSA > 0 }
        ];

        famRow.innerHTML = chips.filter(c => c.show).map(c => `
            <div class="family-chip">
                <img src="${c.img}" onerror="this.style.display='none'" alt="">
                <span>${c.label}</span>
            </div>`).join('');
    } else {
        famRow.innerHTML = '';
    }
}

/* ── CSS for SG timeline colours ─────────────────────── */
const style = document.createElement('style');
style.textContent = `
.bg-tl-past  { background: #475569; }
.bg-tl-curr  { background: #0f172a; box-shadow: inset 0 0 0 2px #fff; }
.bg-tl-lock  { background: #818cf8; }
.bg-tl-flexi { background: #f472b6; }
.bg-tl-vest  { background: #34d399; }
`;
document.head.appendChild(style);

/* ── Boot sequence ───────────────────────────────────── */
(async () => {
    const syncEl  = document.getElementById('sync-status');
    const syncDot = syncEl.querySelector('.sync-dot');
    const syncLbl = syncEl.querySelector('.sync-label');

    render('india');   // render immediately with local data

    try {
        await syncWithGoogleSheets(POLICY_DATA);
        syncDot.classList.add('live');
        syncLbl.textContent = 'Live';
        render(window.currentCategory);  // re-render with sheet data
    } catch {
        syncDot.classList.add('error');
        syncLbl.textContent = 'Offline';
    }
})();
