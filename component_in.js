/* component_in.js - v4.1.13 - The Nuclear Option */
import { autoFmt } from './india.js';

export function createPolicyCard(p, sym, TODAY, CURRENT_YEAR) {
    const brandColor = p.color || "#6366f1";
    
    return `
    <div class="policy-card" id="card-${p.id}" style="border-left: 15px solid ${brandColor}; margin-bottom: 20px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif;">
        
        <div class="card-header" 
             onclick="const c = this.parentElement.querySelector('.content-area'); c.style.display = (c.style.display === 'none' ? 'block' : 'none');" 
             style="padding: 25px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${p.logo}" style="max-height: 40px; width: 100px; object-fit: contain;">
                <span style="font-weight: 900; font-size: 1.2rem; color: #1e293b;">${p.name}</span>
            </div>
            
            <div style="text-align: right;">
                <div style="font-size: 10px; color: #94a3b8; font-weight: bold;">ANNUAL PREMIUM</div>
                <div style="font-weight: 900; color: #059669; font-size: 1.1rem;">${autoFmt(p.premium, sym)}</div>
            </div>
        </div>

        <div class="content-area" style="display: none; padding: 30px; border-top: 1px solid #f1f5f9; background: #fafafa;">
            <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Policy Number:</strong> ${p.id}</p>
                <p style="margin: 5px 0;"><strong>Commenced:</strong> ${p.commenced || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Maturity:</strong> ${p.maturity || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${p.type || 'Insurance'}</p>
            </div>
            
            <div style="margin-top: 25px;">
                <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Policy Timeline</div>
                <div style="height: 12px; background: #e2e8f0; border-radius: 10px; width: 100%; overflow: hidden;">
                    <div style="width: 40%; height: 100%; background: ${brandColor};"></div>
                </div>
            </div>
        </div>
    </div>`;
}
