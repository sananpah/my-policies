/* component_in.js - v4.1.12 - Emergency Toggle */
import { autoFmt, safeGetYear, monthMap } from './india.js';

// Global Toggle: Pure Logic, No Fluff
window.toggleCard = function(id) {
    const card = document.getElementById(`card-${id}`);
    const content = card.querySelector('.content-area');
    
    if (content.style.display === "block") {
        content.style.display = "none";
        card.classList.remove('active');
    } else {
        content.style.display = "block";
        card.classList.add('active');
    }
};

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const brandColor = p.color || "#6366f1";
    
    return `
    <div class="policy-card" id="card-${p.id}" style="border-left: 15px solid ${brandColor}; margin-bottom: 20px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div class="card-header" onclick="window.toggleCard('${p.id}')" style="padding: 25px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${p.logo}" style="max-height: 40px; width: 100px; object-contain: fit;">
                <span style="font-weight: 900; font-size: 1.2rem;">${p.name}</span>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 10px; color: #94a3b8;">PREMIUM</div>
                <div style="font-weight: 900; color: #059669;">${autoFmt(p.premium, sym)}</div>
            </div>
        </div>

        <div class="content-area" style="display: none; padding: 30px; border-top: 1px solid #f1f5f9;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 15px;">
                <p><strong>Policy Number:</strong> ${p.id}</p>
                <p><strong>Commenced:</strong> ${p.commenced || 'Syncing...'}</p>
                <p><strong>Maturity:</strong> ${p.maturity || 'Syncing...'}</p>
            </div>
            <div style="margin-top: 20px; height: 10px; background: #e2e8f0; border-radius: 10px;"></div>
        </div>
    </div>`;
}
