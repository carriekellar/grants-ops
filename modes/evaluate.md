# Mode: Evaluate Grant

Read modes/_shared.md, then modes/_profile.md, then config/profile.yml.

## Step 0 — Acquire NOFO + Category Detection

**NOFO acquisition (priority order):**
1. If user provides Grants.gov opportunity ID or URL → call fetchOpportunity API, check oppStatus === 'posted'
2. If user provides agency portal URL → Playwright browser_navigate + browser_snapshot
3. If user provides other URL → WebFetch
4. If user pastes raw text → use directly
5. If NOFO has PDF attachment → download and read

Save full NOFO text to nofos/{agency-slug}-{opp-number}.md for reference.

**Category detection:**
- If from Grants.gov API → use fundingActivityCategories field directly
- If from pasted text → classify into 1-2 categories from _shared.md table by matching signals
- Load matching Adaptive Framing row(s) from _profile.md

## Step 1 — Eligibility Gate (pass/fail)

Check each requirement against profile.yml. ALL must pass to continue.

| Check | Source | Result |
|-------|--------|--------|
| Entity type eligible | NOFO eligibilities vs profile.yml entity_type | ✅/❌ |
| SAM.gov registration | profile.yml sam_status (self-reported) | ✅/❌ |
| UEI number present | profile.yml uei | ✅/❌ |
| Geographic match | NOFO area vs _profile.md service area | ✅/❌ |
| Deadline not passed | NOFO deadline vs today | ✅/❌ |
| Years operating | NOFO minimum vs profile.yml founded_year | ✅/❌ |
| Required certifications | NOFO requirements vs profile.yml | ✅/❌ |

**If ANY ❌ → Score: 0/5, Status: SKIP, explain which check failed and why. STOP here.**

**If all ✅ but with gaps** (e.g., certification expires soon, SAM renewal pending) → note gaps with mitigation strategy, continue to Step 2.

## Step 2 — Deal-Breaker Check

Check _profile.md deal-breakers. These are user-defined strategic filters — the grant may be eligible but not worth pursuing.

For each deal-breaker in _profile.md, check:
- Cost share / match requirement vs user's threshold
- Funding amount vs user's minimum
- Award period vs user's minimum
- Reporting burden vs award size
- Required partnerships vs available partners

**If ANY deal-breaker triggered → Score: 0/5, Status: SKIP, explain which deal-breaker and why. STOP here.**

## Block A — Grant Summary

| Field | Value |
|-------|-------|
| Agency | {from NOFO} |
| Program | {from NOFO} |
| CFDA/ALN | {from NOFO} |
| Opportunity Number | {from NOFO} |
| Grants.gov Category | {code + name from API or detection} |
| Funding Range | ${floor} - ${ceiling} per award |
| Project Period | {X years} |
| Expected Awards | {N} |
| Total Program Funding | ${amount} |
| Deadline | {date} (⚠️ {N days remaining}) |
| Cost Share | {X% match required / None} |
| Eligible Applicants | {list from NOFO} |
| Funding Instrument | {grant / cooperative agreement} |
| Review Type | {peer review / merit review / formula} |
| TL;DR | {one sentence} |

## Block B — Mission Alignment (30% weight)

Score 1-5. Quote specific language from NOFO objectives and match to org mission.

| NOFO Objective | Org Alignment | Evidence |
|----------------|---------------|----------|
| {objective 1} | {how org addresses this} | {proof point from profile.yml} |
| {objective 2} | ... | ... |

Use Adaptive Framing from _profile.md to shape the pitch angle for this category.
Narrative: How the org's theory of change maps to the grant's goals.

## Block C — Competitive Position (25% weight)

Score 1-5. Analysis of how likely we are to win.

| Factor | Assessment | Score |
|--------|-----------|-------|
| Past performance in similar programs | {detail} | X/5 |
| Geographic advantage | {underserved area designations?} | X/5 |
| Partnership strength | {letters of support available?} | X/5 |
| Capacity to execute | {staffing, infrastructure} | X/5 |
| Agency relationship | {prior awards from same agency?} | X/5 |

**Past awardee research:**
1. Check USAspending.gov for prior awards under same CFDA/ALN (authoritative source)
2. WebSearch for past awardee announcements from the agency
3. Note: what did winning applicants emphasize? How does our org compare?

## Block D — Feasibility & Strategy (20% weight)

Score 1-5. Can we actually pull this off?

- Days until deadline vs estimated prep time
- Staff availability for writing and implementation
- Review criteria weights from NOFO → map to our strengths

| Review Criterion | Weight | Our Strength | Strategy |
|-----------------|--------|--------------|----------|
| {criterion 1} | {X pts} | {strong/medium/weak} | {approach} |
| ... | ... | ... | ... |

## Block E — Risk Assessment (Financial Fit 15% + Strategic Value 10%)

| Risk | Severity | Mitigation | Affects |
|------|----------|------------|---------|
| Cost share required | {H/M/L} | {in-kind from partner X} | Financial Fit |
| Budget vs org capacity | {H/M/L} | {phased approach} | Financial Fit |
| Single audit threshold | {H/M/L} | {auditor on retainer} | Financial Fit |
| Tight deadline | {H/M/L} | {existing narrative fragments} | Feasibility |
| New reporting system | {H/M/L} | {grants manager experienced} | Strategic Value |
| Staff capacity | {H/M/L} | {hire with grant funds} | Feasibility |
| Mission drift risk | {H/M/L} | {aligns with strategic plan} | Strategic Value |

Score Financial Fit (1-5) and Strategic Value (1-5) from this analysis.

## Global Score

| Dimension | Weight | Score |
|-----------|--------|-------|
| Mission Alignment | 30% | X/5 |
| Competitive Position | 25% | X/5 |
| Feasibility | 20% | X/5 |
| Financial Fit | 15% | X/5 |
| Strategic Value | 10% | X/5 |
| **Global** | **100%** | **X.X/5** |

## Recommendation

- If score < 3.0 → **Don't apply.** Explain why.
- If score 3.0-3.9 → **Marginal.** Apply only if deadline > 30 days and capacity exists.
- If score >= 4.0 AND deadline > 14 days → **Apply.** Suggest starting application.
- If score >= 4.5 → **Strong fit.** Prioritize this grant.

## Post-Evaluation

1. Save report: reports/{###}-{agency-slug}-{program-slug}-{YYYY-MM-DD}.md
2. Add entry to data/applications.md tracker
3. If score >= 4.0 → suggest running apply mode
4. Update pipeline.md if processing from queue
