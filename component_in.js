/* component_in.js - v4.1.46 - Dynamic Maturity & Step Logic Integration */
import { checkIsDueSoon, autoFmt, toNum, safeParseDate, safeGetYear, monthMap, getTimeRemaining } from './utils.js';

/* ── LINKED POLICY HELPERS ──────────────────────────────────────────────
 * A child policy (p.linkedTo = parentId) is funded from the parent's CV.
 * It is rendered as a sub-card inside the parent's expanded area, not as
 * a standalone card. The parent's IRR uses combined CV (parent + all children).
 * The child shows only its growth% vs the amount allocated to it.
 * ──────────────────────────────────────────────────────────────────────── */

/** Returns all child policies for a given parent id from the full list */
function getChildren(parentId, allPolicies) {
    return (allPolicies || []).filter(p => p.linkedTo === parentId);
}

/** Combined current value: parent CV + sum of all children's CV */
function combinedCV(p, allPolicies) {
    const children = getChildren(p.id, allPolicies);
    return toNum(p.unitValueNumeric || 0) + children.reduce((s, c) => s + toNum(c.unitValueNumeric || 0), 0);
}

/** Growth % of child vs its allocated premium (not IRR — too early) */
function childGrowthBadge(c) {
    const allocated = toNum(c.totalPremiumPaid || c.premium || 0);
    const cv        = toNum(c.unitValueNumeric || 0);
    if (allocated <= 0 || cv <= 0) return '';
    const pct  = ((cv / allocated) - 1) * 100;
    const isPos = pct >= 0;
    const col   = isPos ? '#059669' : '#dc2626';
    const bg    = isPos ? '#ecfdf5' : '#fff1f2';
    const bd    = isPos ? '#6ee7b7' : '#fca5a5';
    const ar    = isPos ? '▲' : '▼';
    const pfx   = isPos ? '' : '−';
    return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;background:${bg};border:1px solid ${bd};color:${col};transform:skewX(-5deg);white-space:nowrap;"><span style="transform:skewX(5deg)">${ar} ${pfx}${Math.abs(pct).toFixed(1)}% since launch</span></span>`;
}

/** Child sub-card rendered inside the parent's expanded content area */
function childSubCard(c, sym) {
    const allocated = toNum(c.totalPremiumPaid || c.premium || 0);
    const cv        = toNum(c.unitValueNumeric || 0);
    const matDate   = c.maturity || '—';
    return `
    <div style="margin-top:10px;border:1px solid rgba(99,102,241,0.25);border-left:4px solid #6366f1;border-radius:12px;padding:12px 14px;background:#f5f3ff;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
                <img src="${c.logo}" style="height:28px;object-fit:contain;" onerror="this.style.display='none'">
                <div>
                    <div style="font-size:9px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:.08em;">↳ Funded from this policy</div>
                    <div style="font-size:13px;font-weight:900;color:#1e1b4b;">${c.name || c.id}</div>
                    <div style="font-size:10px;color:#6366f1;font-weight:600;">${c.id}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                ${childGrowthBadge(c)}
                ${c.avatarPath ? `<img src="${c.avatarPath}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid white;" onerror="this.style.display='none'">` : ''}
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;">
            <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid rgba(99,102,241,0.15);">
                <div style="font-size:9px;color:#6366f1;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Allocated</div>
                <div style="font-size:14px;font-weight:900;color:#1e1b4b;">${autoFmt(allocated, sym)}</div>
                <div style="font-size:9px;color:#9ca3af;margin-top:2px;">from parent CV</div>
            </div>
            <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid rgba(99,102,241,0.15);">
                <div style="font-size:9px;color:#6366f1;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Current Value</div>
                <div style="font-size:14px;font-weight:900;color:#1e1b4b;">${c.currentUnitValue || autoFmt(cv, sym)}</div>
            </div>
            <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid rgba(99,102,241,0.15);">
                <div style="font-size:9px;color:#6366f1;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Maturity</div>
                <div style="font-size:12px;font-weight:700;color:#1e1b4b;">${matDate}</div>
            </div>
            <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid rgba(99,102,241,0.15);">
                <div style="font-size:9px;color:#6366f1;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Sum Assured</div>
                <div style="font-size:14px;font-weight:900;color:#1e1b4b;">${autoFmt(toNum(c.sumAssured), sym)}</div>
            </div>
        </div>
    </div>`;
}


/* ══════════════════════════════════════════════════════════════════════
   IRR ENGINE — handles ULIP, Moneyback, Savings, Pension
   ══════════════════════════════════════════════════════════════════════

   TIMING RULE (confirmed from policy documents):
   MoneyBack year N is paid ON anniversary N-1 (= commenced + N-1 years).
   So in flows indexed by anniversary:
       flows[N-1] += payoutSchedule[N]
   This means year 11 payout → anniversary 10 → one year after last premium (ppt=10).

   MATURITY TERMINAL VALUE:
   - Pure BSA policies (calculatedMaturity = BSA): use calculatedMaturity
   - Moneyback with bonus (Loyalty/Additional): use sumAssured + calculatedMaturity
     because loader stores only the bonus %, not the BSA return itself
   - Special Surrender Value (undefined): use 0 (conservative)
   - ULIP: use current unit value (exit today)

   DEFERMENT:
   - Policy 54679062: year 7 = deferment, payouts from year 8 → ann 7.
     This falls out naturally from the payoutSchedule mapping (no special code needed).

   YOUNG POLICY (≤ 1 year):
   - Newton-Raphson unreliable with 1-2 data points.
   - Use prorated simple annualisation: (CV/cost − 1) × (12 / months)
   - Badge label changes to "Ann. %" with tooltip explaining it's a projection.
   ══════════════════════════════════════════════════════════════════════ */

function _calcIRR(flows, guess = 0.05, iter = 500, tol = 1e-10) {
    if (!flows || flows.length < 2) return null;
    if (!flows.some(c => c < 0) || !flows.some(c => c > 0)) return null;
    let r = guess;
    for (let i = 0; i < iter; i++) {
        let npv = 0, d = 0;
        for (let t = 0; t < flows.length; t++) {
            const dsc = Math.pow(1 + r, t);
            npv += flows[t] / dsc;
            d   -= t * flows[t] / (dsc * (1 + r));
        }
        if (Math.abs(d) < 1e-14) break;
        const nr = r - npv / d;
        if (Math.abs(nr - r) < tol) { r = nr; break; }
        r = Math.max(-0.99, Math.min(5, nr));
    }
    const pct = Math.round(r * 10000) / 100;
    return (pct > -50 && pct < 100) ? pct : null;
}

/**
 * Determines the correct maturity terminal value for IRR cashflows.
 * The loader's mapProjections stores bonus %s in calculatedMaturity but NOT
 * the BSA return itself. For policies where the maturity includes returning
 * the full BSA (endowment/moneyback/savings), add sumAssured + calculatedMaturity.
 */
function _maturityTerminal(p) {
    const BSA = toNum(p.sumAssured);
    const cal = toNum(p.calculatedMaturity || 0);
    if (!cal && !BSA) return 0;
    // If formula is just "BSA" (calculatedMaturity = BSA already from loader)
    if (p.maturityFormula && p.maturityFormula.toUpperCase() === 'BSA ONLY') return cal;
    // If formula includes bonuses (Loyalty, Additional): cal = bonus only, add BSA
    if (p.maturityFormula && (p.maturityFormula.includes('BSA') || cal > 0) && BSA > 0) {
        // Check if cal already includes BSA (cal >= BSA means BSA was added)
        return cal >= BSA ? cal : BSA + cal;
    }
    // Special Surrender Value or undefined — conservative: use 0
    if (p.maturityLabel) return 0;
    // Fallback: use BSA
    return BSA || cal;
}

/**
 * Build projected cashflows for Moneyback / Savings / Pension policies.
 * These have no daily unit value — IRR is calculated from the full
 * projected cashflow to maturity using contractually guaranteed amounts.
 *
 * Anniversary index (ann):
 *   ann = 0 → inception (first premium)
 *   ann = ppt-1 → last premium
 *   ann = N-1 → receives payoutSchedule[N]  (year N payout)
 *   ann = mat → maturity lump sum
 */
function _buildProjectedFlows(p) {
    const prem     = toNum(p.premium);
    const ppt      = toNum(p.ppt || 0);
    const mat      = safeGetYear(p.maturity) - safeGetYear(p.commenced.split(' ').pop() || '2000');
    const terminal = _maturityTerminal(p);
    if (prem <= 0 || ppt <= 0 || mat <= 0) return null;

    const flows = [];
    for (let ann = 0; ann <= mat; ann++) {
        let cf = ann < ppt ? -prem : 0;
        // payoutSchedule[polYear] paid at anniversary polYear-1
        const polYr = ann + 1;
        if (p.payoutSchedule && p.payoutSchedule[polYr]) {
            cf += toNum(p.payoutSchedule[polYr]);
        }
        if (ann === mat && terminal > 0) cf += terminal;
        flows.push(cf);
    }
    return flows;
}

/**
 * Build ULIP cashflows (to-date only, using current unit value as exit).
 * Handles irregular payments (totalPremiumPaid > regular schedule).
 * For parent policies: uses combined CV (parent + children).
 */
function _buildULIPFlows(p, yearsCompleted, pyi, cvToUse) {
    const prem    = toNum(p.premium);
    const total   = toNum(p.totalPremiumPaid || 0);
    const exitVal = cvToUse || toNum(p.unitValueNumeric || 0);
    const pptYrs  = toNum(p.ppt || pyi);
    const payYrs  = Math.min(pptYrs, pyi);
    if (prem <= 0 || exitVal <= 0 || payYrs < 1) return null;

    const regular  = prem * payYrs;
    const residual = total > 0 ? Math.max(0, total - regular) : 0;
    const isIrreg  = residual > Math.max(total, regular) * 0.05;

    const flows = [];
    for (let y = 0; y <= yearsCompleted; y++) {
        let cf = y < payYrs ? -prem : 0;
        if (isIrreg && y === Math.max(0, payYrs - 1)) cf -= residual;
        if (p.payoutSchedule && p.payoutSchedule[y]) cf += toNum(p.payoutSchedule[y]);
        if (y === yearsCompleted) cf += exitVal;
        flows.push(cf);
    }
    flows._isIrreg  = isIrreg;
    flows._residual = residual;
    flows._isAssign = toNum(p.sumAssured) === 0;
    return flows;
}

/** IRR badge — funky skewed pill with correct colour/arrow/sign rules */
function _irrBadge(irr, lbl = 'IRR p.a.', tip = '') {
    if (irr === null || irr === undefined) return '';
    const isGood = irr >= 6, isNeg = irr < 0;
    const bg  = isGood ? '#ecfdf5' : isNeg ? '#fff1f2' : '#fffbeb';
    const fg  = isGood ? '#059669' : isNeg ? '#dc2626' : '#d97706';
    const bd  = isGood ? '#6ee7b7' : isNeg ? '#fca5a5' : '#fcd34d';
    const ar  = irr >= 8 ? '▲' : isNeg ? '▼' : '◆';
    const pfx = isNeg ? '−' : '';
    const fullTip = tip || 'Annualised IRR on all premiums paid to date';
    return `<div class="irr-badge" style="display:inline-flex;align-items:center;gap:4px;background:${bg};border:1.5px solid ${bd};color:${fg};border-radius:8px;padding:4px 11px;transform:skewX(-7deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;box-shadow:2px 2px 0 ${bd};white-space:nowrap;cursor:default;" title="${fullTip}"><span style="transform:skewX(7deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:.65;">${lbl}</span><span style="font-size:13px;letter-spacing:-.02em;">${ar} ${pfx}${Math.abs(irr).toFixed(1)}%</span></span></div>`;
}

/** PV badge — future inflows discounted to today @ 6% */
function _pvBadge(pv, sym, customTip) {
    if (!pv || pv <= 0) return '';
    const fmt = n => sym + Math.round(n).toLocaleString('en-IN');
    const tip = customTip || `Present value of remaining contractual inflows @ 6% discount`;
    return `<div class="irr-badge" style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border:1.5px solid #93c5fd;color:#1d4ed8;border-radius:8px;padding:4px 11px;transform:skewX(-7deg);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;box-shadow:2px 2px 0 #93c5fd;white-space:nowrap;cursor:default;margin-left:4px;" title="${tip}"><span style="transform:skewX(7deg);display:flex;align-items:center;gap:4px;"><span style="font-size:8px;opacity:.65;">PV@6%</span><span style="font-size:12px;letter-spacing:-.02em;">≈ ${fmt(pv)}</span></span></div>`;
}

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR, allPolicies = []) {
    const isULIP   = (p.type || "").toUpperCase().includes("ULIP");
    const isChild   = !!p.linkedTo;                     // child = funded from another policy
    const children  = getChildren(p.id, allPolicies);  // child policies linked to this parent
    const isParent  = children.length > 0;
    // Combined CV: parent unit value + all children's unit values
    const combCV    = isParent
        ? toNum(p.unitValueNumeric || 0) + children.reduce((s,c) => s + toNum(c.unitValueNumeric||0), 0)
        : toNum(p.unitValueNumeric || 0);
    const commStr = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay = parseInt(startParts[0]);
    const annMonthNum = monthMap[startParts[1]] || 0;
    const startY = parseInt(startParts[2]);

    const anniversaryThisYear = new Date(CURRENT_YEAR, annMonthNum, annDay);
    let yearsCompleted = CURRENT_YEAR - startY;
    if (TODAY < anniversaryThisYear) yearsCompleted--;
    
    const matStr = p.maturity || "01 Jan 2050";
    const matY = safeGetYear(matStr);

    const brandColor = p.color || "#000000";
    const brandBg = `rgba(${parseInt(brandColor.slice(1,3), 16)}, ${parseInt(brandColor.slice(3,5), 16)}, ${parseInt(brandColor.slice(5,7), 16)}, 0.04)`;
    
    const finalPremiumDate = safeParseDate(p.premiumEnds);
    const isStillPaying = TODAY <= finalPremiumDate;
    const scheduledPayout = (p.payoutSchedule && p.payoutSchedule[yearsCompleted + 1]);
    const isIncomePhase = !isStillPaying && !!scheduledPayout;
    const isPaidUp = (p.status === "PAID UP") || (TODAY > finalPremiumDate);

    // --- NOMINEE & ASSIGNED LOGIC ---
    const isAssigned = toNum(p.sumAssured) === 0;
    let nomineeBoxContent = "";
    if (isAssigned) {
        nomineeBoxContent = `<div class="flex items-center gap-2"><span class="text-xl">🛡️</span><div class="flex flex-col text-left"><span class="text-[10px] font-black text-emerald-600 uppercase leading-none">Vested Benefit</span><span class="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1 italic">Policy is Assigned</span></div></div>`;
    } else if (p.nomineeStatus === "EMPTY") {
        nomineeBoxContent = `<span class="text-[11px] font-black text-rose-500 animate-pulse uppercase tracking-widest">Unassigned</span>`;
    } else if (p.nomineeStatus === "NA") {
        nomineeBoxContent = `<span class="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">N/A</span>`;
    } else {
        nomineeBoxContent = `<div class="flex -space-x-3">${(p.nominees || []).map(n => `<img src="${n.img}" class="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100 transition-transform hover:scale-110 hover:z-20">`).join('')}</div>`;
    }

    let middleLabel = "Annual Premium", middleValue = autoFmt(p.premium, sym), middleColor = isStillPaying ? "text-emerald-600 font-black" : "text-slate-700";
    if (isPaidUp && !isIncomePhase) middleColor = "text-slate-400 line-through font-bold";
    else if (isIncomePhase) { middleLabel = "Annual Payout"; middleValue = autoFmt(scheduledPayout, sym); middleColor = "text-[#854d0e] font-black"; }
    
    const badgeText = isIncomePhase ? "Income Phase" : (p.type || "Savings");

    // ── IRR / PV CALCULATION ─────────────────────────────────────────────
    let _irrHtml = '';
    const isPension   = (p.category || '').toLowerCase().includes('retirement') ||
                        ((p.payoutSchedule && Object.keys(p.payoutSchedule).length > 10) && !isULIP);
    const isMoneyback = !isULIP && !isPension &&
                        p.payoutSchedule && Object.keys(p.payoutSchedule).length > 0;

    if (!isChild) {
        if (isULIP) {
            // ULIP: to-date IRR using current unit value (or combined CV for parents)
            const yc  = yearsCompleted;
            const pyi = yc + (TODAY >= new Date(CURRENT_YEAR, annMonthNum, annDay) ? 1 : 0);
            const days = (TODAY - new Date(parseInt(commStr.split(' ')[2]), monthMap[commStr.split(' ')[1]], parseInt(commStr.split(' ')[0]))).valueOf() / 86400000;
            const months = days / 30.44;

            if (yc <= 1 && months > 30) {
                // Prorated for young policies (< ~1yr of full data)
                const costBasis = toNum(p.totalPremiumPaid || 0) || toNum(p.premium);
                if (costBasis > 0 && combCV > 0) {
                    const proratedPct = Math.round(((combCV / costBasis) - 1) * (12 / months) * 10000) / 100;
                    const mo = Math.round(months);
                    _irrHtml = _irrBadge(proratedPct, 'Ann. %',
                        `Policy ${mo} months old. Prorated: (CV/paid−1)×(12/${mo}). Not a full IRR.`);
                }
            } else {
                const flows = _buildULIPFlows(p, yc, pyi, isParent ? combCV : null);
                const irr   = _calcIRR(flows);
                let lbl = 'IRR p.a.', tip = `${Math.min(toNum(p.ppt||pyi), pyi)} premiums → CV today`;
                if (flows && flows._isAssign) { lbl = 'IRR (Assigned)'; tip = 'Policy assigned as collateral.'; }
                else if (flows && flows._isIrreg) { lbl = 'IRR (Top-up)'; tip = `Includes top-up of ${sym}${Math.round(flows._residual).toLocaleString('en-IN')} beyond regular premiums.`; }
                if (isParent) tip += ` Combined with ${children.length} linked child.`;
                _irrHtml = _irrBadge(irr, lbl, tip);
            }

        } else if (isPension) {
            // Pension: full projected cashflow + PV of income stream
            const flows = _buildProjectedFlows(p);
            const irr   = _calcIRR(flows);
            // PV of remaining income (years still in the future)
            const RATE    = 0.06;
            const matYear = safeGetYear(p.maturity);
            const futPays = Object.entries(p.payoutSchedule || {})
                .filter(([yr]) => (parseInt(yr) - 1) > (CURRENT_YEAR - parseInt(commStr.split(' ')[2])))
                .reduce((s, [,v]) => s + toNum(v), 0);
            const futYrs  = Math.max(0, matYear - CURRENT_YEAR);
            const annPmt  = Object.values(p.payoutSchedule || {}).length > 0
                ? Math.max(...Object.values(p.payoutSchedule).map(toNum)) : 0;
            const pvVal   = annPmt > 0 && futYrs > 0
                ? annPmt * (1 - Math.pow(1 + RATE, -futYrs)) / RATE : 0;
            _irrHtml = _irrBadge(irr, 'IRR p.a.', `Full ${safeGetYear(p.maturity)-parseInt(commStr.split(' ')[2])}-yr projected cashflow. Conservative: no terminal SSV.`) +
                       (pvVal > 0 ? _pvBadge(pvVal, sym, `Lump-sum equivalent of ₹${Math.round(annPmt).toLocaleString('en-IN')}/yr pension stream @ 6% discount for ${futYrs} years`) : '');

        } else if (isMoneyback) {
            // Moneyback / Savings: full projected cashflow to maturity + PV of future inflows
            const flows  = _buildProjectedFlows(p);
            const irr    = _calcIRR(flows);
            const matYrs = safeGetYear(p.maturity) - parseInt(commStr.split(' ')[2]);

            // PV of future inflows only (payouts + maturity, discounted @ 6% to today)
            // "What are all remaining contractual receipts worth in today's money?"
            const RATE   = 0.06;
            const yrsNow = (TODAY - new Date(
                parseInt(commStr.split(' ')[2]),
                monthMap[commStr.split(' ')[1]] || 0,
                parseInt(commStr.split(' ')[0])
            )).valueOf() / (365.25 * 86400000);

            const pvInflows = (flows || []).reduce((sum, cf, ann) => {
                // Only future inflows (positive cashflows at anniversaries still to come)
                if (ann > yrsNow && cf > 0) sum += cf / Math.pow(1 + RATE, ann);
                return sum;
            }, 0);

            _irrHtml = _irrBadge(irr, 'IRR p.a.',
                `Full ${matYrs}-yr projected cashflow: premiums + moneyback payouts + maturity benefit.`) +
                (pvInflows > 0 ? _pvBadge(pvInflows, sym,
                    `Present value of all remaining payouts + maturity @ 6% discount = ${sym}${Math.round(pvInflows).toLocaleString('en-IN')} in today's money`) : '');

        } else {
            // ── PURE ENDOWMENT BRANCH ─────────────────────────────────────────
            // No payoutSchedule, no unitValueNumeric — e.g. "Maturity Benefit: BSA + Bonus"
            // These are pure endowment / whole-life savings plans.
            // IRR uses BSA as the conservative terminal value (bonus unknown from sheet).
            // Badge shows IRR clearly labelled as conservative and flags missing bonus.
            const prem    = toNum(p.premium);
            const ppt     = toNum(p.ppt || 0);
            const matYrs  = safeGetYear(p.maturity) - parseInt(commStr.split(' ')[2]);
            const BSA     = toNum(p.sumAssured);
            const hasBonus = (p.maturityLabel || '').toLowerCase().includes('bonus') ||
                             (p.maturityFormula || '').toLowerCase().includes('bonus');

            if (prem > 0 && ppt > 0 && matYrs > 0 && BSA > 0) {
                // Build flows: -prem for ppt years, +BSA at maturity
                const flows = [];
                for (let ann = 0; ann <= matYrs; ann++) {
                    let cf = ann < ppt ? -prem : 0;
                    if (ann === matYrs) cf += BSA;
                    flows.push(cf);
                }
                const irr = _calcIRR(flows);

                // PV of BSA at maturity discounted to today
                const RATE   = 0.06;
                const yrsNow = (TODAY - new Date(
                    parseInt(commStr.split(' ')[2]),
                    monthMap[commStr.split(' ')[1]] || 0,
                    parseInt(commStr.split(' ')[0])
                )).valueOf() / (365.25 * 86400000);
                const pvBSA  = BSA / Math.pow(1 + RATE, matYrs);

                // IRR label and tooltip — clearly flag bonus exclusion
                const irrLbl = 'IRR (BSA)';
                const irrTip = `Conservative IRR using BSA only (₹${BSA.toLocaleString('en-IN')}) at maturity ${start.getFullYear ? '' : ''}${safeGetYear(p.maturity)}.`
                    + (hasBonus ? ` Bonus is NOT included — actual IRR will be higher once bonus formula is added to your sheet.` : '');

                _irrHtml = _irrBadge(irr, irrLbl, irrTip)
                    + (pvBSA > 0 ? _pvBadge(pvBSA, sym,
                        `BSA ₹${BSA.toLocaleString('en-IN')} at maturity (${safeGetYear(p.maturity)}) discounted to today @ 6%. Conservative — excludes bonus.`) : '');
            }
        }
    }
    const nextDueStr = `${annDay} ${startParts[1]} ${TODAY >= anniversaryThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`; 
    const finalDueDate = isPaidUp ? "PAID UP" : nextDueStr;

    // --- TIMELINE LOGIC ---
    let timelineHtml = '';
    const premEndYear = safeGetYear(p.premiumEnds);

    for(let yr = startY; yr < matY; yr++) {
        const loopPolY = yr - startY + 1;
        const isPast = yr < CURRENT_YEAR;
        const isLoopCurrent = yr === CURRENT_YEAR;
        const loopPayout = (p.payoutSchedule && p.payoutSchedule[loopPolY]);
        
        let color = "", phase = "", detail = "";

        if (yr <= premEndYear) {
            const isEffectivelyPaid = isPast || (isPaidUp && yr === premEndYear) || (isLoopCurrent && TODAY >= anniversaryThisYear);
            if (loopPayout) {
                color = isPast ? "bg-emerald-600" : "bg-emerald-400";
                phase = "Premium + Payout";
                detail = `Pay: ${autoFmt(p.premium, sym)} | Get: ${autoFmt(loopPayout, sym)}`;
            } else {
                color = (isLoopCurrent && TODAY < anniversaryThisYear && !isPaidUp) ? "bg-current" : (isEffectivelyPaid ? "bg-prem-past" : "bg-prem-future");
                phase = isEffectivelyPaid ? "Premium Completed" : "Premium Payment";
                detail = `Amt: ${autoFmt(p.premium, sym)}`;
            }
        } else {
            if (loopPayout) {
                color = isPast ? "bg-amber-600" : "bg-amber-400";
                phase = isPast ? "Payout Received" : "Scheduled Payout";
                detail = `Income: ${autoFmt(loopPayout, sym)}`;
            } else {
                color = isPast ? "bg-history-brown" : "bg-future-light-brown";
                phase = isPast ? "Growth (Historical)" : "Growth Phase";
                detail = "Accumulating Value";
            }
        }
        
        timelineHtml += `
            <div class="segment ${color}">
                <div class="tooltip">
                    <b class="${loopPayout ? 'text-amber-300' : 'text-emerald-400'} uppercase tracking-tighter">${phase}</b><br>
                    ${detail}<br>
                    <span class="opacity-40 text-[9px]">Year ${loopPolY} (${yr})</span>
                </div>
                ${loopPayout ? `<div class="payout-dot"></div>` : ''} 
            </div>`;
    }


    // --- DYNAMIC MATURITY HOVER LOGIC ---
    let matHoverDetail = "";
      if (isULIP) {
          matHoverDetail = `<span class="text-[10px] font-black leading-tight text-white">${p.maturityAmt}</span>`;
      } else if (p.maturityLabel) {
         // Handle "Special Surrender Value" or other text-based benefits
          matHoverDetail = `
              <div class="text-[10px] font-black text-orange-300 uppercase leading-tight">${p.maturityLabel}</div>
              <div class="text-[8px] opacity-60 mt-1 italic leading-tight">Refer Policy Doc for Value</div>
            `;
        } else if (p.calculatedMaturity) {
            matHoverDetail = `
              <div class="text-[10px] font-black text-white">${autoFmt(p.calculatedMaturity, sym)}</div>
              <div class="text-[8px] opacity-60 mt-1 italic leading-tight">${p.maturityFormula}</div>
            `;
        } else {
            matHoverDetail = `<div class="text-[10px] font-black text-white">${autoFmt(p.sumAssured, sym)}</div>`;
        }

    timelineHtml += `
        <div class="mat-star">
            ★
            <div class="tooltip" style="min-width: 150px;">
                <b class="text-orange-400 uppercase tracking-widest text-[9px]">${isULIP ? 'Projected Maturity*' : 'Maturity Benefit'}</b><br>
                ${matHoverDetail}
            </div>
        </div>`;

    return `
    <div class="policy-card mb-6" id="card-${p.id}" style="border-left: 16px solid ${brandColor}; border-color: ${brandColor};">
        <div class="card-header transition-colors" style="background: ${brandBg};" onclick="toggleCard('${p.id}')">
            <div class="w-32 flex justify-center"><img src="${p.logo}" class="max-h-12"></div>
            <div class="flex-1 ml-10">
                <h3 class="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                    ${p.name}
                    ${p.avatarPath ? `<img src="${p.avatarPath}" class="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200">` : ''}
                </h3>
            </div>
            <div class="flex gap-12 items-center mr-6">
                <div class="flex items-center w-[260px] -ml-4">
                    <div class="funky-badge-v2" style="border-color:${brandColor}; color:${brandColor}; background:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:6px; border:1.5px solid; text-transform:uppercase;">${badgeText}</div>
                    <div class="ml-6 relative min-w-[140px] flex items-center h-12">
                        <div><p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">${middleLabel}</p><p class="text-lg ${middleColor} leading-none">${middleValue}</p></div>
                    </div>
                </div>
                <div class="text-center border-l-2 border-slate-100 pl-10 min-w-[140px]">
                    ${isAssigned ? `<img src="assigned.png" class="h-10 object-contain mx-auto opacity-95 transform -rotate-3">` : 
                        `<div><p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sum Assured</p><p class="text-lg font-black text-slate-800 leading-none">${autoFmt(p.sumAssured, sym)}</p></div>`
                    }
                </div>
            </div>
            <div class="w-40 text-center flex flex-col justify-center min-h-[60px]">
                ${isPaidUp && !isIncomePhase ? `<img src="paid.jpg" class="paid-logo mx-auto h-12 object-contain">` : 
                    `<div class="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <p class="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">${getTimeRemaining(p.premiumEnds, TODAY) ? 'Left: ' + getTimeRemaining(p.premiumEnds, TODAY) : ''}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Next Due</p>
                        <div class="font-black text-[11px] ${checkIsDueSoon(finalDueDate) ? 'text-red-500 animate-pulse' : 'text-slate-900'}">${finalDueDate}</div>
                    </div>`}
            </div>
        </div>
        <div class="content-area" style="background: linear-gradient(to bottom, ${brandBg}, #ffffff)">
            <div class="detail-grid">
                <div class="detail-item"><p>Policy Number</p><p style="font-family:'Orbitron'; font-weight:700;">${p.id || 'N/A'}</p></div>
                <div class="detail-item"><p>UIN Number</p><p style="font-family:'Orbitron'; font-weight:700;">${p.uin || 'N/A'}</p></div>
                ${isULIP ? `<div class="detail-item" style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; padding: 10px;"><p style="color:#4338ca; font-weight:800; font-size:10px; text-transform:uppercase;">${isParent ? 'Combined Portfolio Value' : 'Portfolio Value'}</p><p style="font-weight:900; color:#1e1b4b; font-size:18px; font-family:'Orbitron';">${isParent ? autoFmt(combCV, sym) : (p.currentUnitValue || 'No Value')}</p>${isParent ? '<p style="font-size:8px;color:#6366f1;margin-top:3px;">Parent + ' + children.length + ' linked policy</p>' : ''}</div>` : 
                `<div class="detail-item"><p>Customer ID</p><p style="font-family:'Orbitron'; font-weight:700;">${p.clientId || 'N/A'}</p></div>`}
            </div>
            
            <div class="mt-4 p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                <div class="flex items-center justify-between gap-4 flex-wrap">
                    <div class="flex flex-col gap-2 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nominee</p>
                        <div class="flex items-center h-10">${nomineeBoxContent}</div>
                    </div>
                    ${_irrHtml ? `<div class="flex flex-col items-end gap-2 flex-shrink-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Returns</p>
                        <div class="flex items-center gap-2 flex-wrap justify-end">${_irrHtml}</div>
                    </div>` : ''}
                </div>
            </div>

            ${isParent ? children.map(c => childSubCard(c, sym)).join('') : ''}
            <div class="timeline-track">
                <div class="absolute -top-8 left-0 text-[11px] font-black text-slate-400 uppercase">${p.commenced}</div>
                ${timelineHtml}
                <div class="absolute -top-8 right-0 text-[11px] font-black text-slate-400 uppercase">${p.maturity}</div>
            </div>
        </div>
    </div>`;
}
