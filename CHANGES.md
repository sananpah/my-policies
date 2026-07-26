# Nami Portfolio — Complete Fix Bundle

## Files included
- loader.js
- component_in.js
- component_sg.js
- utils.js
- app.js

## All fixes in this bundle

### loader.js
- Withdrawal parsing: "Withdrawal : $9195" or "Withdrawal : $27481.38, $12072.37"
  → sets p.withdrawals = [amount1, amount2, ...]
- Assign date/amount parsing from Other Data column
- PremiumLinked parsing for parent/child policies
- Pipe format for maturity: "BSA + Bonus | 1159095 | 1275974"
- Split fix: split(":").slice(1).join(":") to preserve colons inside values

### component_in.js
- Vibrant dark-gradient IRR and PV badges with glow effect
- Assignment policy IRR from assignee's perspective (assignDate as t=0)
- Endowment assign branch (400296334E type)
- Correct maturity terminal value using p.maturity date directly
- PV tooltip clarifies full cashflow stream vs premiums paid so far
- Full IRR engine: ULIP, Moneyback, Pension, Savings, Endowment branches

### component_sg.js
- LEFT countdown fix: startY + mip - 1 (not startY + mip)
- Vibrant dark-gradient IRR badge with glow
- Exceptional return badge for withdrawals > invested + still holding value
- Correct exceptional condition check (netInvested <= 0)

### utils.js
- Annual Premium total excludes child policies (p.linkedTo)

### app.js
- Child policies filtered from main render loop
- Full list passed to createPolicyCard for parent/child lookup
