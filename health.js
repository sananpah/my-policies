// health.js — Health card component v4.2

export function createHealthCard(p) {
    const currency = p.currency === "SGD" ? "$" : "₹";
    const totalPrem = (parseFloat(p.cashAmount || 0) + parseFloat(p.cpfAmount || 0));
    const coverage  = parseFloat(p.coverage || p.sumAssured || 0);

    const ownerIcon = () => {
        const o = (p.owner || p.assignedTo || "").toLowerCase();
        if (o.includes("daughter")) return "👧";
        if (o.includes("wife") || o.includes("woman") || o.includes("mother")) return "👩";
        if (o.includes("family")) return "👨‍👩‍👧";
        return "👨";
    };

    const statusColor = (p.status || "Active").toLowerCase() === "active"
        ? "color:var(--emerald);background:var(--emerald-bg);"
        : "color:var(--rose);background:var(--rose-bg);";

    const cpfBadge = p.cpfAmount && parseFloat(p.cpfAmount) > 0
        ? `<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:4px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;letter-spacing:0.06em;text-transform:uppercase;">CPF: ${currency}${parseFloat(p.cpfAmount).toLocaleString()}</span>`
        : '';

    return `
<div class="health-card" id="card-${p.id}">
    <div class="health-card-inner">
        <div class="health-accent" style="background:${p.color || 'var(--emerald)'}"></div>
        <div class="health-main">
            <div style="font-size:24px;flex-shrink:0;">${ownerIcon()}</div>
            <div class="health-info">
                <div class="health-plan">${p.category || p.type || 'Health'}</div>
                <div class="health-name">${p.name || 'Policy'}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
                    <span class="health-company">${p.company || ''}</span>
                    ${cpfBadge}
                </div>
            </div>
            <div class="health-metas">
                ${coverage > 0 ? `
                <div class="health-meta">
                    <div class="health-meta-lbl">Coverage</div>
                    <div class="health-meta-val">${currency}${coverage > 0 ? Math.round(coverage).toLocaleString('en-IN') : '—'}</div>
                </div>` : ''}
                ${totalPrem > 0 ? `
                <div class="health-meta">
                    <div class="health-meta-lbl">Premium p.a.</div>
                    <div class="health-meta-val" style="color:var(--indigo);">${currency}${Math.round(totalPrem).toLocaleString('en-IN')}</div>
                </div>` : ''}
                <div class="health-meta">
                    <div class="health-meta-lbl">Renewal</div>
                    <div class="health-meta-val" style="font-size:13px;font-family:var(--font-mono);">${p.expiryDate || '—'}</div>
                </div>
                <div>
                    <span style="font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;${statusColor}">${p.status || 'Active'}</span>
                </div>
            </div>
        </div>
    </div>
</div>`;
}
