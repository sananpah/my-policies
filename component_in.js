// component_in.js — India policy card v4.2
import { checkIsDueSoon, toNum, monthMap, safeGetYear } from './india.js';

const roundFmt = (v, s) => s + Math.round(toNum(v)).toLocaleString('en-IN');

function buildTimeline(p, TODAY, CURRENT_YEAR, sym) {
    const commStr    = p.commenced || "01 Jan 2000";
    const startParts = commStr.split(' ');
    const annDay     = parseInt(startParts[0]);
    const annMonth   = monthMap[startParts[1]] || 0;
    const startY     = parseInt(startParts[2]);
    const annThisYear = new Date(CURRENT_YEAR, annMonth, annDay);

    let yearsComp = CURRENT_YEAR - startY;
    if (TODAY < annThisYear) yearsComp--;
    const polYear = yearsComp + 1;

    const premEndYear = safeGetYear(p.premiumEnds);
    const matY        = safeGetYear(p.maturity);
    const isPaying    = (CURRENT_YEAR < premEndYear) || (CURRENT_YEAR === premEndYear && TODAY < annThisYear);

    let html = '';
    for (let y = startY; y < matY; y++) {
        const lpY        = y - startY + 1;
        const curPayout  = p.payoutSchedule ? p.payoutSchedule[lpY] : null;
        const past       = y < CURRENT_YEAR || (y === CURRENT_YEAR && TODAY >= annThisYear);
        let colorClass   = 'tl-growth';
        let phase        = 'Growth';
        let detail       = 'Accumulating value';

        if (y < premEndYear) {
            const isCurr   = (y === CURRENT_YEAR && TODAY < annThisYear);
            colorClass     = isCurr ? 'tl-prem-curr' : (past ? 'tl-prem-past' : 'tl-prem-future');
            phase          = 'Premium';
            detail         = roundFmt(p.premium, sym);
        } else if (curPayout) {
            colorClass     = past ? 'tl-payout-past' : 'tl-payout-fut';
            phase          = 'Payout';
            detail         = roundFmt(curPayout, sym);
        }

        html += `<div class="tl-seg ${colorClass}"><div class="tl-tip"><b>${phase} — Year ${lpY} (${y})</b>${detail}</div></div>`;
    }

    const matAmt = roundFmt(toNum(p.maturityAmt || p.sumAssured), sym);
    html += `<div class="tl-maturity"><div class="tl-tip"><b>Maturity (${matY})</b>${matAmt}</div>★</div>`;

    return { html, startY, matY, polYear, isPaying, premEndYear, annThisYear };
}

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const commStr      = p.commenced || "01 Jan 2000";
    const startParts   = commStr.split(' ');
    const annDay       = parseInt(startParts[0]);
    const annMonth     = monthMap[startParts[1]] || 0;
    const startY       = parseInt(startParts[2]);
    const annThisYear  = new Date(CURRENT_YEAR, annMonth, annDay);

    let yearsComp = CURRENT_YEAR - startY;
    if (TODAY < annThisYear) yearsComp--;
    const polYear = yearsComp + 1;

    const premEndYear  = safeGetYear(p.premiumEnds);
    const matY         = safeGetYear(p.maturity);
    const isPaying     = (CURRENT_YEAR < premEndYear) || (CURRENT_YEAR === premEndYear && TODAY < annThisYear);
    const payoutVal    = p.payoutSchedule ? p.payoutSchedule[polYear] : null;
    const isIncome     = !isPaying && !!payoutVal;

    const isPaidUp     = (p.status === "PAID UP") || (CURRENT_YEAR >= premEndYear && TODAY >= annThisYear);
    const dueStr       = isPaidUp
        ? "PAID UP"
        : `${annDay} ${startParts[1]} ${TODAY >= annThisYear ? CURRENT_YEAR + 1 : CURRENT_YEAR}`;

    const isDue        = checkIsDueSoon(dueStr);
    const isULIP       = (p.type || "").toUpperCase().includes("ULIP");
    const bc           = p.color || "#1a1916";
    const brandAlpha   = `${bc}18`;

    // Mid metric
    let midLbl = "Sum Assured", midVal = roundFmt(p.sumAssured, sym), midClass = "";
    if (isPaying)      { midLbl = "Annual Premium"; midVal = roundFmt(p.premium, sym);   midClass = "emerald"; }
    else if (isIncome) { midLbl = "Annual Payout";  midVal = roundFmt(payoutVal, sym);   midClass = "amber"; }

    const { html: tlHtml } = buildTimeline(p, TODAY, CURRENT_YEAR, sym);

    return `
<div class="policy-card" id="card-${p.id}" style="border-left: 6px solid ${bc};">
    <div class="card-header" style="background: ${brandAlpha};" onclick="window.toggleCard('${p.id}')">
        <div class="card-logo-wrap">
            <img class="card-logo" src="${p.logo || 'logo_default.png'}" onerror="this.src='logo_default.png'" alt="">
        </div>
        <div class="card-main">
            <div class="card-name">
                ${p.name || p.id}
                ${p.avatarPath ? `<img class="card-avatar" src="${p.avatarPath}" alt="" onerror="this.style.display='none'">` : ''}
            </div>
            <div class="card-company">${p.company || ''}</div>
            <span class="type-badge" style="color:${bc};">${isIncome ? 'Income Phase' : (p.type || 'Life')}</span>
        </div>
        <div class="card-metrics">
            <div class="card-metric">
                <span class="metric-lbl">${midLbl}</span>
                <span class="metric-val ${midClass}">${midVal}</span>
            </div>
            <div class="card-metric">
                <span class="metric-lbl">Sum Assured</span>
                <span class="metric-val">${roundFmt(p.sumAssured, sym)}</span>
            </div>
            <div class="card-metric">
                <span class="metric-lbl">Next Due</span>
                <span class="due-val ${isDue ? 'due-soon' : ''}">${dueStr}</span>
            </div>
        </div>
        <div class="card-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
    </div>

    <div class="card-body" id="content-${p.id}">
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-lbl">Policy No.</div>
                <div class="detail-val">${p.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-lbl">UIN</div>
                <div class="detail-val">${p.uin || 'N/A'}</div>
            </div>
            ${isULIP
                ? `<div class="detail-item highlight">
                       <div class="detail-lbl">Portfolio Value</div>
                       <div class="detail-val">${p.currentUnitValue || '—'}</div>
                   </div>`
                : `<div class="detail-item">
                       <div class="detail-lbl">Customer ID</div>
                       <div class="detail-val">${p.clientId || 'N/A'}</div>
                   </div>`
            }
            <div class="detail-item">
                <div class="detail-lbl">Commenced</div>
                <div class="detail-val">${p.commenced || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-lbl">Premium Ends</div>
                <div class="detail-val">${p.premiumEnds || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-lbl">Maturity</div>
                <div class="detail-val">${p.maturity || '—'}</div>
            </div>
        </div>

        <div class="timeline-wrap">
            <div class="timeline-labels">
                <span class="timeline-label">${p.commenced || ''}</span>
                <span class="timeline-label">${p.maturity || ''}</span>
            </div>
            <div class="timeline-track">${tlHtml}</div>
        </div>
    </div>
</div>`;
}
