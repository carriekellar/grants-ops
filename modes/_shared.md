# Grants-Ops: Shared Context

<!-- SYSTEM FILE — auto-updatable. User customizations go in _profile.md -->

## Scoring System

### Eligibility Gate (pass/fail — runs BEFORE scoring)

| Check | Source | Pass Condition |
|-------|--------|----------------|
| Entity type eligible | NOFO eligibilities vs profile.yml entity_type | Org's type in NOFO list |
| SAM.gov registration | profile.yml sam_status (self-reported) | Status = active |
| UEI present | profile.yml uei | Non-empty |
| Geographic match | NOFO area vs _profile.md service area | Org in eligible area |
| Deadline not passed | NOFO deadline vs today | Deadline > today |

**If ANY check fails → Score: 0/5, Status: SKIP. Do not proceed to scoring.**

### Scoring Dimensions (only if eligibility passes)

| Dimension | Weight | What to assess |
|-----------|--------|----------------|
| Mission Alignment | 30% | How closely org's mission maps to grant objectives |
| Competitive Position | 25% | Likelihood of winning (past performance, geographic advantage, partnerships) |
| Feasibility | 20% | Can the org execute? (timeline, staff, capacity) |
| Financial Fit | 15% | Budget alignment, cost share burden, indirect rate |
| Strategic Value | 10% | Agency relationship building, mission advancement |

**Global Score** = weighted average, 1.0–5.0 scale.

## Official Grants.gov Funding Activity Categories

Use these codes when classifying grants. For API results, use `fundingActivityCategories` directly.
For pasted text, classify by matching signals.

| Code | Category | Signals |
|------|----------|---------|
| AG | Agriculture | farming, rural development, USDA, food systems, conservation |
| AR | Arts | NEA, humanities, cultural, museums, NEH |
| BC | Business and Commerce | SBA, trade, economic development, entrepreneurship |
| CD | Community Development | HUD, housing, neighborhood, urban renewal, CDBG |
| CP | Consumer Protection | FTC, product safety, consumer rights |
| DPR | Disaster Prevention and Relief | FEMA, emergency, hurricane, flood, resilience |
| ED | Education | K-12, higher ed, STEM, Title I, Pell, curriculum |
| ELT | Employment, Labor and Training | DOL, workforce, apprenticeship, job training |
| EN | Energy | DOE, renewable, efficiency, grid, clean energy |
| ENV | Environment | EPA, climate, water quality, air, remediation |
| FN | Food and Nutrition | SNAP, WIC, school lunch, food security |
| HL | Health | NIH, CDC, HRSA, mental health, substance abuse, public health |
| HO | Housing | HUD, Section 8, homelessness, affordable housing |
| HU | Humanities | NEH, libraries, archives, history, preservation |
| IS | Income Security and Social Services | ACF, TANF, child welfare, aging, disability |
| ISS | Information and Statistics | census, data collection, research methodology |
| LJL | Law, Justice and Legal Services | DOJ, crime prevention, courts, legal aid |
| NR | Natural Resources | DOI, BLM, fish, wildlife, forestry, parks |
| O | Other | does not fit other categories |
| RD | Regional Development | ARC, EDA, rural, tribal, Appalachian |
| ST | Science and Technology | NSF, NASA, R&D, innovation, SBIR/STTR |
| T | Transportation | DOT, highway, transit, aviation, rail |

## Report Format

Filename: `reports/{###}-{agency-slug}-{program-slug}-{YYYY-MM-DD}.md`

Header template:
```
# {Agency} — {Program Title}
**Score:** {X.X}/5
**URL:** {grants.gov URL or agency URL}
**Category:** {code} — {category name}
**Deadline:** {date} ({N} days remaining)
**Funding:** ${floor}–${ceiling}
**Status:** {canonical state}
```

## Tools (priority order)

1. **Grants.gov API** — `fetchOpportunity` to verify status and get full details
2. **WebFetch** — fallback for non-Grants.gov URLs
3. **Playwright** — fallback for JavaScript-heavy agency portals
4. **WebSearch** — supplementary research (past awardees, agency priorities)
5. **USAspending.gov** — authoritative source for past awards by CFDA/ALN

## ALWAYS Rules

1. Read `modes/_shared.md`, then `modes/_profile.md`, then `config/profile.yml` before evaluating
2. Run eligibility gate BEFORE scoring — do not waste effort on ineligible grants
3. Check `_profile.md` deal-breakers after eligibility gate
4. Verify grant is still posted: call `fetchOpportunity`, check `oppStatus === 'posted'`
5. Check SAM.gov registration status from `profile.yml` (user self-reported, not API)
6. NEVER submit an application without explicit user approval
7. If score < 3.0/5, explicitly recommend against applying
8. Use official Grants.gov category codes, not invented categories

## Post-Evaluation Steps

1. Save report to `reports/{###}-{agency-slug}-{program-slug}-{YYYY-MM-DD}.md`
2. Add entry to `data/applications.md` (do NOT add if company+program already exists — update instead)
3. Display score, recommendation, and next steps to user
4. If processing from pipeline, update `data/pipeline.md`
