// component_sg.js — Singapore policy card v4.2
import { autoFmt, toNum } from './india.js';

export function createSGCard(p, sym, TODAY, CURRENT_YEAR) {
    const commDate  = new Date(p.commenced);
    const matDate   = new Date(p.maturity);
    const startY    = commDate.getFullYear();
    const endY      = matDate.getFullYear();
    const commMonth = commDate.getMonth();
    const commDay   = commDate.getDate();

    const mip = p.mip !== undefined ? p.mip : 0;
    const ppt = p.ppt !== undefined ? p.ppt : 0;
    const isPaidUp = (p.dueDate === "PAID UP");

    const thisYearAnn  = new Date(CURRENT_YEAR, commMonth, commDay);
    const hasPassed    = TODAY >= thisYearAnn;
    let yearsPassed    = CURRENT_YEAR - startY;
    if (TODAY < thisYearAnn) yearsPassed--;
    const policyYearIdx = yearsPassed + 1;

    const accountValue     = Math.round(toNum(p.currentUnitValue || 0));
    const annualPremium    = toNum(p.premium || 0);
    const totalPremiumsPaid = p.totalPremiumPaid
        ? toNum(p.totalPremiumPaid)
        : (annualPremium * policyYearIdx);

    const totalWithdrawn  = (p.withdrawals || []).reduce((a, b) => a + toNum(b), 0);
    const netInvested     = totalPremiumsPaid - totalWithdrawn;

    const chargePct       = (p.surrenderCharges && p.surrenderCharges[policyYearIdx]) || 0;
    const surrenderValue  = Math.round(Math.max(0, accountValue - (chargePct / 100 * (isPaidUp ? accountValue : totalPremiumsPaid))));
    const locked          = accountValue - surrenderValue;

    // Projection
    const r              = 0.04;
    const targetExitYear = Math.min(startY + ppt + 2, endY);
    const projYears      = Math.max(0, targetExitYear - CURRENT_YEAR);
    const yearsToPay     = isPaidUp ? 0 : Math.max(0, Math.min(startY + ppt, targetExitYear) - (hasPassed ? CURRENT_YEAR + 1 : CURRENT_YEAR));
    const totalProjected = Math.round(
        (accountValue * Math.pow(1 + r, projYears)) +
        (yearsToPay > 0
            ? (annualPremium * ((Math.pow(1 + r, yearsToPay) - 1) / r) * (1 + r))
              * Math.pow(1 + r, Math.max(0, projYears - yearsToPay))
            : 0)
    );

    const nextDueDate    = new Date(hasPassed ? CURRENT_YEAR + 1 : CURRENT_YEAR, commMonth, commDay);
    const nextDueDisplay = nextDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isDueSoon      = Math.ceil((nextDueDate - TODAY) / 86400000) <= 30;

    // Vesting
    let vestingStr = "";
    if (mip === 0 || (new Date(startY + mip, commMonth, commDay) <= TODAY)) {
        vestingStr = "Vested";
    } else {
        const targetV = new Date(startY + mip, commMonth, commDay);
        let vy = targetV.getFullYear() - TODAY.getFullYear();
        let vm = targetV.getMonth() - TODAY.getMonth();
        if (targetV.getDate() < TODAY.getDate()) vm--;
        if (vm < 0) { vy--; vm += 12; }
        vestingStr = `${String(vy).padStart(2,'0')}Y ${String(vm).padStart(2,'0')}M left`;
    }
    const isVested = vestingStr === "Vested";

    // Timeline
    const yearsToMat = endY - startY;
    const maxYears   = yearsToMat <= 25 ? yearsToMat : Math.min(Math.max(15, policyYearIdx + 5), yearsToMat);
    let tlHtml = '';
    for (let polY = 1; polY <= maxYears; polY++) {
        const yr = startY + polY - 1;
        const isPast = yr < CURRENT_YEAR || (yr === CURRENT_YEAR && hasPassed);
        const isCurr = yr === CURRENT_YEAR && !hasPassed;
        let cls = isPast ? 'bg-tl-past' : isCurr ? 'bg-tl-curr' :
                  polY <= mip ? 'bg-tl-lock' : polY <= ppt ? 'bg-tl-flexi' : 'bg-tl-vest';
        const lbl = isPast ? 'Completed' : isCurr ? 'Current' :
                    polY <= mip ? 'Lock-in' : polY <= ppt ? 'Flexi' : 'Vested';
        tlHtml += `<div class="tl-seg ${cls} h-full"><div class="tl-tip"><b>Year ${polY} (${yr})</b>${lbl}</div></div>`;
    }

    const bc       = p.color || "#1a1916";
    const brandAlpha = `${bc}18`;

    return `
<div class="sg-card" id="card-${p.id}" style="border-left: 6px solid ${bc};">
    <div class="sg-card-header" style="background: ${brandAlpha};" onclick="window.toggleCard('${p.id}')">
        <div class="sg-logo-wrap">
            <img class="card-logo" src="${p.logo || 'logo_default.png'}" onerror="this.src='logo_default.png'" alt="">
        </div>
        <div class="sg-main">
            <div class="sg-name">${p.name || p.id}</div>
            <div class="sg-type-badge">${p.type || 'Investment'}</div>
            <div style="margin-top:8px">
                <span class="vesting-pill ${isVested ? 'vested' : 'locked'}">${vestingStr}</span>
            </div>
        </div>
        <div class="sg-metrics">
            <div class="sg-metric">
                <span class="metric-lbl">Sum Assured</span>
                <span class="metric-val">${autoFmt(toNum(p.sumAssured) === 0 ? accountValue : p.sumAssured, sym)}</span>
            </div>
            <div class="sg-metric">
                <span class="metric-lbl">Annual Premium</span>
                <span class="metric-val emerald">${autoFmt(p.premium, sym)}</span>
            </div>
            <div class="sg-metric">
                <span class="metric-lbl">Next Due</span>
                <span class="due-val ${isDueSoon ? 'due-soon' : ''}" style="font-family:var(--font-mono);font-size:12px;">${nextDueDisplay}</span>
            </div>
            <div class="sg-metric" style="min-width:60px;">
                <div class="proj-star-wrap">
                    <div class="proj-star">★</div>
                    <div class="proj-tooltip">
                        <div class="proj-tooltip-title">Exit Strategy (4% p.a.)</div>
                        <div class="proj-row"><span>Target Exit</span><span>${targetExitYear}</span></div>
                        <div class="proj-row"><span>Future Premiums</span><span>${autoFmt(yearsToPay * annualPremium, sym)}</span></div>
                        <div class="proj-row proj-total"><span>Est. Surrender</span><span>${autoFmt(totalProjected, sym)}</span></div>
                        <div class="proj-footnote">*Capped at maturity ${endY}. Illustrative only.</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
    </div>

    <div class="sg-body" id="content-${p.id}">
        <div class="sg-value-grid" style="margin-bottom:12px;">
            <div class="sg-stat">
                <div class="sg-stat-lbl">Policy No.</div>
                <div class="sg-stat-val" style="font-family:var(--font-mono);font-size:16px;">#${p.id}</div>
            </div>
            <div class="sg-stat">
                <div class="sg-stat-lbl">Current Valuation</div>
                <div class="sg-stat-val">${p.currentUnitValue || '—'}</div>
            </div>
        </div>
        <div class="sg-value-grid three">
            <div class="sg-stat">
                <div class="sg-stat-lbl">Net Invested</div>
                <div class="sg-stat-val">${autoFmt(netInvested, sym)}</div>
                <div class="sg-stat-sub">After withdrawals of ${autoFmt(totalWithdrawn, sym)}</div>
            </div>
            <div class="sg-stat green">
                <div class="sg-stat-lbl">Surrender Value</div>
                <div class="sg-stat-val">${autoFmt(surrenderValue, sym)}</div>
            </div>
            <div class="sg-stat red">
                <div class="sg-stat-lbl">Locked</div>
                <div class="sg-stat-val">-${autoFmt(locked, sym)}</div>
            </div>
        </div>

        <div style="margin-top:20px;">
            <div class="timeline-labels">
                <span class="timeline-label">${p.commenced || ''}</span>
                <span class="timeline-label">${p.maturity || ''}</span>
            </div>
            <div class="timeline-track" style="height:32px;margin-top:6px;">${tlHtml}</div>
            <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">
                <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:var(--ink-3);">
                    <span style="width:10px;height:10px;border-radius:2px;background:#475569;display:inline-block;"></span>Paid
                </span>
                <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:var(--ink-3);">
                    <span style="width:10px;height:10px;border-radius:2px;background:#818cf8;display:inline-block;"></span>Lock-in
                </span>
                <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:var(--ink-3);">
                    <span style="width:10px;height:10px;border-radius:2px;background:#f472b6;display:inline-block;"></span>Flexi
                </span>
                <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:var(--ink-3);">
                    <span style="width:10px;height:10px;border-radius:2px;background:#34d399;display:inline-block;"></span>Vested
                </span>
            </div>
        </div>
    </div>
</div>`;
}
