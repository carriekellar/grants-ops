# Mode: Budget Builder

Read config/profile.yml for all financial data:
- budget_defaults (staff rates, fringe rate, travel per diem, escalation rate, equipment threshold)
- compliance.indirect_cost_rate
- compliance.cognizant_agency
Read evaluation report Grant Summary (funding range, project period, cost share).
Read NOFO from nofos/ for budget-specific restrictions.

## Step 0 — Check NOFO Budget Restrictions

Before building, scan NOFO for:
- Category caps (e.g., "administrative costs limited to 15%", "travel not to exceed $X")
- Participant support cost rules (often cannot be used for indirect)
- Required cost categories (e.g., "must include independent evaluation")
- Prohibited costs (e.g., "no construction", "no food/beverage")
- Budget format requirements (some agencies have their own forms, not SF-424A)

Document any restrictions — they constrain every step below.

## Step 1 — Budget Parameters

From NOFO + profile.yml:

- Award amount: ${ceiling}
- Project period: {N} years
- Cost share required: {X%}
- Indirect cost rate: {X%} ({type}) — from profile.yml
- Annual escalation: {X%} — from profile.yml budget_defaults (default 3% if not set)
- Equipment threshold: ${X} — from profile.yml budget_defaults (default $5,000 if not set)

## Step 2 — Object Class Categories

Build line items interactively with user:

### A. Personnel

| Position | Annual Salary | % FTE | Year 1 | Year 2 | Year 3 | Total |
|----------|--------------|-------|--------|--------|--------|-------|
| Project Director | $X | X% | $X | $X | $X | $X |
| Program Coordinator | $X | X% | $X | $X | $X | $X |

Apply annual escalation rate for Years 2+.

### B. Fringe Benefits

Rate: {X%} of personnel (from profile.yml budget_defaults.fringe_rate).
Itemize: FICA, health, retirement, workers comp.

### C. Travel

| Trip | Purpose | # Trips | Cost/Trip | Total |
|------|---------|---------|-----------|-------|
| Conference | Required by NOFO | 1/yr | $X | $X |
| Site visits | Program delivery | X/yr | $X | $X |

### D. Equipment

Items >= equipment threshold from profile.yml (federal default $5,000 per unit).

### E. Supplies

Items < equipment threshold. Itemize categories.

### F. Contractual

Subcontracts, consultants. Include scope + basis for cost.

### G. Construction

If applicable (usually N/A for project grants).

### H. Other

Anything not above: rent, utilities, printing, participant support costs.

### I. Indirect Costs

{Modified Total Direct Costs} × {indirect rate}%.
Exclude: equipment, participant support, subawards >$25K.

## Step 3 — Cost Share Calculation (if required)

| Source | Type | Amount | Documentation |
|--------|------|--------|---------------|
| Partner X | In-kind (space) | $X | MOU |
| Org funds | Cash | $X | Board resolution |
| Volunteer time | In-kind | $X | Time tracking |

Total match must meet {X%} of federal request.

## Step 4 — Budget Summary (SF-424A Section A)

| Category | Federal | Non-Federal | Total |
|----------|---------|-------------|-------|
| Personnel | $X | $X | $X |
| Fringe | $X | $X | $X |
| ... | ... | ... | ... |
| **Total** | **$X** | **$X** | **$X** |

## Step 5 — Budget Narrative

For each line item generate:

1. **What:** Description of the cost
2. **Why:** Connection to a specific project activity
3. **How calculated:** Show the math
4. **Reasonableness:** Market rate justification

Example:

> **Project Director (0.50 FTE, $75,000/yr)**
> The Project Director will oversee all grant activities, manage staff, and serve as
> primary liaison with the funding agency. At 50% FTE ($37,500 Year 1, $38,625 Year 2,
> $39,784 Year 3 with 3% annual increase), this position is essential for program
> coordination. Salary is consistent with our organization's pay scale and the Bureau
> of Labor Statistics median for this role in our metropolitan area.

## Step 6 — Output

Save:
- output/budget-{agency-slug}-{opp-number}-{date}.md (narrative)
- output/budget-summary-{agency-slug}-{opp-number}-{date}.md (SF-424A tables)
