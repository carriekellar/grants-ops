# Grants-Ops: Technical Review Document

## Context

Build an AI-powered grant search and application pipeline modeled after the career-ops architecture. The system ingests an organization's profile (entity type, capabilities, past performance) and automates discovering, evaluating, and applying to government grants.

**Primary data source:** Grants.gov (free public API, no auth for search)
**Complementary sources:** RSS feeds, agency portals
**Future iterations:** State-level grant portals, foundation grants (see Roadmap)
**Platform:** Claude Code project with markdown modes, Node.js scripts, Puppeteer PDF generation

---

## Data Sources

### Scope & Iteration Plan

| Iteration          | Sources                                  | Status         |
| ------------------ | ---------------------------------------- | -------------- |
| **v1.0 (initial)** | Grants.gov API + RSS feeds               | Build now      |
| **v1.1**           | State-level grant portals (top 5 states) | Next iteration |
| **v1.2**           | Foundation grants via free 990 data      | Next iteration |

---

### Grants.gov API (v1.0 — Primary)

**Verified live on 2026-04-07.** Free, no authentication required.

| Endpoint                                      | Method | Auth | Purpose                                     |
| --------------------------------------------- | ------ | ---- | ------------------------------------------- |
| `POST api.grants.gov/v1/api/search2`          | POST   | None | Search opportunities                        |
| `POST api.grants.gov/v1/api/fetchOpportunity` | POST   | None | Full opportunity details + NOFO attachments |

**Search request (verified):**

```json
{
  "keyword": "workforce development",
  "oppStatuses": "posted",
  "rows": 25,
  "startRecord": 1
}
```

**Optional filters:** `agencies`, `eligibilities`, `fundingCategories`, `fundingInstruments`, `cfda`

**Search response fields (verified):**

- `hitCount` — total matching results
- `oppHits[]` — array of opportunities, each with:
  - `id` — numeric opportunity ID (use for fetchOpportunity)
  - `number` — opportunity number (e.g., "USDA-NIFA-AFRI-011596")
  - `title` — opportunity title
  - `agencyCode` — hierarchical (e.g., "USDA-NIFA", "HHS-NIH11")
  - `agency` — human-readable agency name
  - `openDate`, `closeDate` — MM/DD/YYYY format
  - `oppStatus` — "posted", "closed", "archived", "forecasted"
  - `cfdaList` — array of CFDA/ALN numbers
- `eligibilities[]` — available filter values with counts
- `fundingCategories[]` — available filter values with counts
- `agencies[]` — available filter values with sub-agencies

**Pagination:** `startRecord` (0-based offset) + `rows` (page size). Max 10,000 results.

**Eligibility codes (verified from live API):**

| Code | Entity Type                                                  |
| ---- | ------------------------------------------------------------ |
| `00` | State governments                                            |
| `01` | County governments                                           |
| `02` | City or township governments                                 |
| `04` | Special district governments                                 |
| `05` | Independent school districts                                 |
| `06` | Public and State controlled institutions of higher education |
| `07` | Native American tribal governments (Federally recognized)    |
| `08` | Public housing authorities/Indian housing authorities        |
| `11` | Native American tribal organizations                         |
| `12` | Nonprofits having a 501(c)(3) status with the IRS            |
| `13` | Nonprofits that do not have a 501(c)(3) status with the IRS  |
| `20` | Private institutions of higher education                     |
| `21` | Individuals                                                  |
| `22` | For profit organizations other than small businesses         |
| `23` | Small businesses                                             |
| `25` | Others (see Additional Information on Eligibility)           |
| `99` | Unrestricted                                                 |

**Funding categories (verified):**

| Code  | Category                            | Active Count |
| ----- | ----------------------------------- | ------------ |
| `HL`  | Health                              | 224          |
| `ST`  | Science and Technology              | 195          |
| `ED`  | Education                           | 100          |
| `O`   | Other                               | 85           |
| `ENV` | Environment                         | 47           |
| `ISS` | Income Security and Social Services | 45           |
| `AG`  | Agriculture                         | 25           |
| `NR`  | Natural Resources                   | 25           |
| `FN`  | Food and Nutrition                  | 22           |
| `EN`  | Energy                              | 16           |
| `ELT` | Employment, Labor and Training      | 15           |
| `T`   | Transportation                      | 11           |
| `CD`  | Community Development               | 9            |
| `CP`  | Consumer Protection                 | 9            |
| `BC`  | Business and Commerce               | 8            |
| `AR`  | Arts                                | 7            |
| `HO`  | Housing                             | 6            |
| `HU`  | Humanities                          | 10           |
| `LJL` | Law, Justice and Legal Services     | 4            |
| `DPR` | Disaster Prevention and Relief      | 3            |
| `RD`  | Regional Development                | 1            |

**fetchOpportunity response (verified):**

Key fields in `data.synopsis`:

- `synopsisDesc` — full HTML description of the opportunity
- `awardCeiling`, `awardFloor` — numeric (dollars)
- `estimatedFunding` — total program funding (numeric)
- `numberOfAwards` — expected number of awards
- `costSharing` — boolean (true/false)
- `postingDate`, `responseDate`, `archiveDate` — date strings
- `applicantTypes[]` — array of `{id, description}` objects
- `fundingInstruments[]` — array of `{id, description}` (Grant, Cooperative Agreement, etc.)
- `fundingActivityCategories[]` — array of `{id, description}`
- `applicantEligibilityDesc` — additional eligibility text
- `agencyContactName`, `agencyContactEmail`, `agencyContactPhone` — program officer info

Key fields in `data`:

- `cfdas[]` — array of `{cfdaNumber, programTitle}`
- `synopsisAttachmentFolders` — NOFO PDF attachments
- `opportunityPkgs` — application packages
- `relatedOpps` — related opportunities

**Fallback if API is down:** Playwright to `grants.gov/search-results-detail/{id}` + browser_snapshot

### RSS Feeds (v1.0 — Complementary)

Agency-specific feeds: `https://www.grants.gov/rss/GG_NewOppByAgency.xml?id={AGENCY_CODE}`

Configured in `config/agencies.yml`. Catches new/modified opportunities between API scans.

**Note:** RSS feed URL format and agency codes have not been independently verified. Should be validated during implementation of scan mode.

---

### State-Level Grant Portals (v1.1 — Next Iteration)

**Problem:** Grants.gov is federal only. Many states run their own grant portals with pass-through federal funds and state-funded grants (typically $5K-$500K, less competitive than federal).

**Major state portals identified:**

| State         | Portal                   | URL                             | Notes                              |
| ------------- | ------------------------ | ------------------------------- | ---------------------------------- |
| California    | California Grants Portal | grants.ca.gov                   | 64+ agencies, $45.1B granted       |
| New York      | Grants Management System | grantsmanagement.ny.gov         | Transitioning to SFS               |
| Texas         | eGrants                  | egrants.gov.texas.gov           | Public Safety programs             |
| Florida       | DOS Grants               | dosgrants.com                   | Dept of State grants               |
| Illinois      | GATA Portal              | grants.illinois.gov/portal      | Grant Accountability Act           |
| Pennsylvania  | PA Grants                | pa.gov/grants                   | Keystone Login required            |
| Maryland      | MD Grants                | grants.maryland.gov             | State + foundation grants          |
| Massachusetts | GrantWell                | Mass.gov                        | AI-powered, includes philanthropic |
| Colorado      | DOLA Grants              | dola.colorado.gov/grants_portal | Local government focus             |

**Integration challenges:**

- **No APIs** — none of these portals expose public APIs
- **Diverse platforms** — eCivis, Salesforce, custom builds
- **Login walls** — many require authentication for search
- **ToS restrictions** — most prohibit automated scraping
- **Fragmented schemas** — every state structures data differently

**Realistic integration strategy for v1.1:**

1. Start with 3-5 states that have public search pages (CA, MD, MA)
2. Use Playwright for respectful scraping (2-5s delays, identify as bot)
3. Cache results (nightly updates, not real-time)
4. Build per-state adapter pattern for data normalization
5. Fallback to WebSearch for uncovered states

**Free aggregators (potential Level 3 fallback):**

- The Grant Portal (thegrantportal.com) — state-by-state search
- GrantWatch (grantwatch.com) — 11,000+ listings, federal + state + private

---

### Foundation Grants (v1.2 — Future Iteration)

**Problem:** Foundation/private grants are a major funding source for nonprofits but Grants.gov doesn't cover them. Commercial databases (Instrumentl, Candid) cost $100-500/month.

**Free data sources identified:**

| Source                                  | Cost | API?                        | What It Provides                                         |
| --------------------------------------- | ---- | --------------------------- | -------------------------------------------------------- |
| ProPublica Nonprofit Explorer           | Free | Yes, no auth                | 501(c) org data, 990 financials, foundation profiles     |
| 990 Data Infrastructure (GivingTuesday) | Free | Yes, no auth (300 req/5min) | Standardized 990 data, grant-making details              |
| IRS Bulk Downloads                      | Free | No (monthly CSV/XML dumps)  | Raw 990 filings, Publication 78 data                     |
| USAspending.gov                         | Free | Yes, no auth                | Federal grant recipients (who got funded, not open opps) |
| Grants & Foundations Finder             | Free | No (web only)               | 990-PF search by state, purpose, foundation type         |

**ProPublica API (most promising for MVP):**

```
GET https://projects.propublica.org/nonprofits/api/v2/search.json?q={keyword}&ntee[id]={category}
GET https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json
```

- Free, no auth, returns JSON with 990 financial data
- Can identify foundations in your sector/geography
- Limitations: shows funder profiles, not open opportunities

**990 Data Infrastructure API:**

```
GET https://990-infrastructure.gtdata.org/api/v1/filings?ein={ein}
```

- Rate limit: 300 requests per 5 minutes
- Returns standardized 990 data including grantee lists from 990-PF filings

**Useful 990-PF fields for finding funders:**

- Grantee lists (recipient org, amount, purpose)
- Total grants paid, geographic focus
- Assets under management (grant-making capacity)
- Officers/trustees (decision-makers)

**Realistic MVP for foundation discovery (free):**

1. Use ProPublica API to find foundations in user's sector/geography
2. Use 990 Data Infrastructure to pull their grantee lists
3. Identify foundations that fund similar orgs
4. User manually checks foundation websites for open opportunities
5. System tracks identified funders in a "prospect list"

**Limitations:** Free sources show who has funded what in the past, not currently open opportunities. Open opportunity data requires either paid tools or monitoring individual foundation websites.

---

## Directory Structure

### v1.0 (initial release)

```
grants-ops/
├── .claude/skills/grants-ops/SKILL.md    # Router skill
├── config/
│   ├── profile.example.yml               # Example org profile
│   └── agencies.yml                       # Federal agencies + RSS URLs
├── data/
│   ├── applications.md                    # Grant application tracker (canonical)
│   ├── pipeline.md                        # URL inbox
│   └── scan-history.tsv                   # Dedup history
├── modes/
│   ├── _shared.md                         # Scoring system, global rules (auto-updatable)
│   ├── _profile.template.md              # User customization template (never auto-updated)
│   ├── auto-pipeline.md                   # Paste URL → full evaluation
│   ├── evaluate.md                        # A-G structured grant evaluation
│   ├── compare.md                         # Side-by-side comparison
│   ├── scan.md                            # Search Grants.gov API + RSS
│   ├── pipeline.md                        # Process queued URLs
│   ├── apply.md                           # SF-424 auto-fill + narrative generation
│   ├── budget.md                          # SF-424A budget builder
│   ├── tracker.md                         # Application status + deadline alerts
│   ├── deep.md                            # Agency/program research
│   ├── outreach.md                        # Program officer communications
│   └── compliance.md                      # SAM.gov + certification readiness
├── narratives/                            # Successful past narrative sections for reuse
├── nofos/                                 # Downloaded NOFOs
├── reports/                               # Evaluation reports
├── output/                                # Generated application docs (markdown)
├── templates/
│   └── states.yml                         # Canonical grant states
├── CLAUDE.md                              # Agent instructions
├── DATA_CONTRACT.md                       # User vs system layer contract
├── VERSION
├── README.md
├── package.json
├── merge-tracker.mjs                      # Merge tracker additions
└── verify-pipeline.mjs                    # Health check
```

### Deferred to v1.1+

| Item | Rationale |
|------|-----------|
| `batch/` (batch-prompt.md, batch-runner.sh, tracker-additions/) | Batch processing not needed until tracker has 50+ entries |
| `modes/batch.md` | Same — defer with batch infrastructure |
| `modes/pdf.md` | Federal grants submit digitally via Grants.gov; PDF generation only needed for state/foundation grants |
| `fonts/` | No custom fonts needed without PDF generation |
| `templates/sf424-template.html`, `budget-template.html`, `narrative-template.html` | PDF templates deferred with pdf mode |
| `generate-pdf.mjs` | Deferred with PDF generation |
| `dedup-tracker.mjs` | Not needed until tracker grows large enough for duplicate issues |
| `normalize-statuses.mjs` | Not needed until status inconsistencies appear at scale |
| `profile-sync-check.mjs` | Nice-to-have validation; manual review sufficient at v1.0 |
| `update-system.mjs` | Self-update mechanism — add once the system is stable and has users |

---

## Mode Specifications

### Mode 1: `_shared.md` — System Context (auto-updatable)

**Purpose:** Global rules, scoring system, grant category detection, tool config. Read by all evaluation modes before `_profile.md`.

**Structure:**

```markdown
# System Context — grants-ops

<!-- AUTO-UPDATABLE. User customizations go in modes/_profile.md -->

## Sources of Truth

| File         | Path               | When                                             |
| ------------ | ------------------ | ------------------------------------------------ |
| profile.yml  | config/profile.yml | ALWAYS (org identity, targets, past performance) |
| _profile.md  | modes/_profile.md  | ALWAYS (user narrative framing, deal-breakers)   |

**RULE: NEVER hardcode org data. Read from profile.yml at evaluation time.**
**RULE: Read _profile.md AFTER this file. User customizations override defaults.**

## Eligibility Gate (Pass/Fail)

Before scoring, check these hard requirements. If ANY fail → score is 0, recommend SKIP:

| Check | Source | How to verify |
|-------|--------|---------------|
| Entity type eligible | NOFO `applicantTypes` vs `profile.yml organization.entity_type` | Match entity code |
| SAM.gov registration active | `profile.yml sam_registration.status` | Must be "active" |
| UEI present | `profile.yml organization.uei` | Must be non-empty |
| Geographic eligibility | NOFO text vs `profile.yml organization.address` | Check if service area matches |
| Deadline not passed | NOFO `responseDate` vs today | Must be in the future |

If all pass → proceed to scoring.

## Scoring System

5 weighted dimensions, 1-5 scale. Only applied AFTER eligibility gate passes:

| Dimension            | Weight | Measures                                                        |
| -------------------- | ------ | --------------------------------------------------------------- |
| Mission Alignment    | 30%    | Grant objectives vs org mission, theory of change, focus areas  |
| Competitive Position | 25%    | Past performance, partnerships, geographic advantage, agency relationship |
| Feasibility          | 20%    | Staff capacity, timeline to deadline, infrastructure to execute |
| Financial Fit        | 15%    | Funding amount vs need, cost share burden, indirect rate coverage |
| Strategic Value      | 10%    | Agency relationship building, pipeline positioning, narrative reusability |

Score interpretation:

- 4.5+ → Prioritize, begin application immediately
- 4.0-4.4 → Strong fit, apply if capacity allows
- 3.5-3.9 → Decent fit, apply only with clear strategic reason
- Below 3.5 → Recommend against (time better spent elsewhere)

## Grant Category Mapping

Map to official Grants.gov `fundingActivityCategories` codes (from API):

| API Code | Category | Signals in NOFO text |
|----------|----------|---------------------|
| `AG` | Agriculture | farming, food systems, rural development, USDA |
| `AR` | Arts | cultural, arts council, NEA, creative |
| `BC` | Business and Commerce | economic growth, trade, SBA, entrepreneurship |
| `CD` | Community Development | housing, infrastructure, neighborhood, CDBG |
| `CP` | Consumer Protection | safety, product, regulation |
| `DPR` | Disaster Prevention and Relief | emergency, FEMA, resilience, preparedness |
| `ED` | Education | school, student, Title I, STEM, curriculum |
| `ELT` | Employment, Labor and Training | workforce, apprenticeship, career pathways, job training |
| `EN` | Energy | clean energy, DOE, grid, efficiency |
| `ENV` | Environment | conservation, climate, EPA, water quality |
| `FN` | Food and Nutrition | SNAP, hunger, food security, nutrition |
| `HL` | Health | public health, NIH, CDC, prevention, health equity |
| `HO` | Housing | affordable housing, HUD, homelessness |
| `HU` | Humanities | NEH, history, philosophy, language |
| `ISS` | Income Security and Social Services | social services, aging, disability, ACL |
| `LJL` | Law, Justice and Legal Services | DOJ, courts, corrections, juvenile justice |
| `NR` | Natural Resources | conservation, fish and wildlife, DOI, forestry |
| `O` | Other | see NOFO for clarification |
| `RD` | Regional Development | Appalachian, delta, economic zones |
| `ST` | Science and Technology | NSF, R&D, innovation, laboratory, clinical trial |
| `T` | Transportation | DOT, transit, highway, aviation |

When the NOFO comes from the API, use the `fundingActivityCategories` field directly.
When evaluating from pasted text, classify by matching signals in the NOFO.

## Report Format

All evaluation reports follow this naming and structure:

**Filename:** `reports/{###}-{agency-slug}-{program-slug}-{YYYY-MM-DD}.md`
- `{###}` = 3-digit zero-padded sequential number (max existing + 1)
- `{agency-slug}` = lowercase, hyphens (e.g., `hhs`, `usda-nifa`)
- `{program-slug}` = lowercase, hyphens, max 40 chars

**Header:**
```
# Evaluation: {Agency} — {Program Title}

**Date:** {YYYY-MM-DD}
**Category:** {API code + label}
**Score:** {X.X/5}
**URL:** {grants.gov URL or "local:nofos/{file}"}
**Opportunity #:** {opportunity number}
**Deadline:** {date} ({N} days remaining)
```

## Tools

| Tool | When to use |
|------|-------------|
| WebFetch | Grants.gov API calls (search2, fetchOpportunity), RSS feed fetching |
| Playwright | Fallback if API is down; agency portal navigation for non-Grants.gov URLs |
| WebSearch | Past awardee research, salary data for budgets, agency strategy research |

Priority order for fetching NOFOs:
1. Grants.gov API (fetchOpportunity by ID) — structured, reliable
2. WebFetch to URL — for non-Grants.gov links
3. Playwright browser_navigate + browser_snapshot — for SPAs or JS-heavy portals
4. WebSearch — last resort discovery

## Global Rules

NEVER:

- Submit an application without user review and approval
- Fabricate past performance, outcomes data, or capabilities
- Auto-generate budgets without user verification
- Recommend applying to grants below 3.5/5 without explicit user override
- Hardcode org metrics — read from profile.yml

ALWAYS:

- Read profile.yml and _profile.md before evaluation
- Check SAM.gov registration status from profile.yml (user self-reported, not API)
- Run eligibility gate before scoring
- Flag compliance gaps before recommending application
- Include deadline urgency in recommendations (days remaining)
- Verify grant is still posted: call fetchOpportunity, check oppStatus === "posted"
```

**Lines:** ~130
**Reads:** Nothing (is read BY other modes)
**Writes:** Nothing

---

### Mode 2: `_profile.template.md` — User Customization (never auto-updated)

**Purpose:** Narrative framing, adaptive pitch strategy, reusable boilerplate, and user-defined filters. Copied to `_profile.md` on first run. This file is *how to pitch the org* — structured data (rates, past performance, capabilities) lives in `profile.yml`.

**Structure:**

```markdown
# Your Organization Profile — grants-ops

<!-- NEVER auto-updated. Your customizations live here. -->
<!-- Structured data (rates, staff costs, past performance) → config/profile.yml -->
<!-- This file is for NARRATIVE strategy — how to pitch, not what the org does. -->

## Your Adaptive Framing

<!-- [CUSTOMIZE] This is the most important section. For each Grants.gov category
     you pursue, describe HOW to pitch your org — not what you do (that's in profile.yml),
     but what angle to emphasize and what language to use. -->

| Grants.gov Category         | Code | Pitch Angle                                                         | Key Proof Points to Lead With       |
| --------------------------- | ---- | ------------------------------------------------------------------- | ----------------------------------- |
| Health (HL)                 |  HL  | Community reach, population-level outcomes, health equity framing    | [list your strongest HL evidence]   |
| Education (ED)              |  ED  | Student outcomes data, curriculum partnerships, measurable gains     | [list your strongest ED evidence]   |
| Income Security (IS)        |  IS  | Job placement rates, employer partnerships, wage progression        | [list your strongest IS evidence]   |
| Science and Technology (ST) |  ST  | Technical capacity, innovation track record, research partnerships  | [list your strongest ST evidence]   |

<!-- Add rows for each category you target. Use codes from _shared.md category table.
     Delete rows for categories you'll never pursue. -->

## Your Mission Narrative

<!-- [CUSTOMIZE] One paragraph (~100 words) used as the opening framing in all
     project narratives. Should be compelling, specific, and jargon-free.
     Copy from profile.yml narrative section, then expand with persuasive detail. -->

[Your mission narrative here]

## Your Cross-cutting Advantage

<!-- [CUSTOMIZE] Your "signature move" — the 2-3 sentences that differentiate you
     from every other applicant. This appears in every application regardless of category.
     Think: what would a reviewer remember about your org after reading 50 proposals? -->

[Your differentiator here]

## Your Geographic Focus

<!-- [CUSTOMIZE] Geographic areas you serve. Important because many federal grants
     prioritize underserved communities, rural areas, or specific regions.
     Include census tract numbers or county FIPS codes if you serve designated areas. -->

- Service area: [city/county/state/multi-state]
- Underserved designations: [e.g., HRSA MUA/MUP, USDA rural, Promise Zone, Opportunity Zone]
- Target populations: [e.g., "rural youth ages 16-24 in Appalachian counties"]

## Your Boilerplate Sections

<!-- Reusable narrative blocks. Include target word counts — federal grants have
     strict page limits, so these need to be tight and expandable. -->

### Organizational Capacity (~250 words)

<!-- [CUSTOMIZE] Who you are, how long you've operated, staff size, key leadership,
     relevant certifications/accreditations. Reviewers want to know you can execute. -->

### Evaluation Plan Framework (~200 words)

<!-- [CUSTOMIZE] Your standard approach to measuring outcomes. Include:
     logic model reference, data collection methods, reporting frequency.
     Most agencies want to see you have an eval strategy, not just good intentions. -->

### Sustainability Plan (~150 words)

<!-- [CUSTOMIZE] How programs continue after the grant period ends. Mention:
     diversified funding, fee-for-service models, institutional commitment,
     partnerships that outlast the grant. This is a top-3 reviewer concern. -->

### Letters of Support Strategy (~100 words)

<!-- [CUSTOMIZE] Who you typically get letters from (elected officials, partner orgs,
     beneficiaries). Having a pre-built list saves days during crunch deadlines. -->

## Your Deal-Breakers

<!-- [CUSTOMIZE] User-defined filters for grants to auto-skip.
     These are DIFFERENT from the eligibility gate in _shared.md:
     - Eligibility gate: "Can we legally apply?" (entity type, CFDA match)
     - Deal-breakers: "Should we bother?" (strategic/practical filters)
     Grants that pass the eligibility gate but hit a deal-breaker get status SKIP. -->

- Cost share / match requirement above X%
- Total funding below $X (not worth the overhead)
- Award period shorter than X months
- Geographic restrictions excluding your service area
- Reporting burden disproportionate to award size (e.g., monthly reporting for <$50K)
- Required partnerships you don't have and can't build in time
```

**Lines:** ~90
**Reads:** Nothing (is read BY other modes)
**Writes:** Nothing

**Design decisions:**
- Structured data (indirect cost rate, fringe rate, hourly rates, past performance) lives in `config/profile.yml` — NOT here. Budget mode reads from `profile.yml`.
- "Your Grant Categories" table removed — that data comes from `profile.yml` `focus_areas`. The Adaptive Framing table here maps *how to pitch* for each category, referencing official Grants.gov codes.
- Geographic Focus added — federal grants heavily weight underserved area designations.
- Word-count guidance added to boilerplate sections for page-limit awareness.
- Deal-breakers explicitly distinguished from the eligibility gate in `_shared.md`.
- Letters of Support Strategy added — a frequently overlooked prep item that saves days during tight deadlines.

---

### Mode 3: `evaluate.md` — Full Grant Evaluation

**Purpose:** Complete structured evaluation of a single grant opportunity. Core mode — equivalent to career-ops `oferta.md`. Answers the question: "Should we apply to this grant?"

**Flow:** Acquire NOFO → Eligibility Gate (pass/fail) → Deal-Breaker Check → Scoring Blocks A-E → Global Score → Recommendation

**Structure:**

```markdown
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

| Check                    | Source                                        | Result |
| ------------------------ | --------------------------------------------- | ------ |
| Entity type eligible     | NOFO eligibilities vs profile.yml entity_type  | ✅/❌  |
| SAM.gov registration     | profile.yml sam_status (self-reported)         | ✅/❌  |
| UEI number present       | profile.yml uei                                | ✅/❌  |
| Geographic match         | NOFO area vs _profile.md service area          | ✅/❌  |
| Deadline not passed      | NOFO deadline vs today                         | ✅/❌  |
| Years operating          | NOFO minimum vs profile.yml founded_year       | ✅/❌  |
| Required certifications  | NOFO requirements vs profile.yml               | ✅/❌  |

**If ANY ❌ → Score: 0/5, Status: SKIP, explain which check failed and why. STOP here — do not proceed to scoring.**

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

| Field                 | Value                                  |
| --------------------- | -------------------------------------- |
| Agency                | {from NOFO}                            |
| Program               | {from NOFO}                            |
| CFDA/ALN              | {from NOFO}                            |
| Opportunity Number    | {from NOFO}                            |
| Grants.gov Category   | {code + name from API or detection}    |
| Funding Range         | ${floor} - ${ceiling} per award        |
| Project Period        | {X years}                              |
| Expected Awards       | {N}                                    |
| Total Program Funding | ${amount}                              |
| Deadline              | {date} (⚠️ {N days remaining})         |
| Cost Share            | {X% match required / None}             |
| Eligible Applicants   | {list from NOFO}                       |
| Funding Instrument    | {grant / cooperative agreement}        |
| Review Type           | {peer review / merit review / formula} |
| TL;DR                 | {one sentence}                         |

## Block B — Mission Alignment (30% weight)

Score 1-5. Quote specific language from NOFO objectives and match to org mission.

| NOFO Objective | Org Alignment            | Evidence                       |
| -------------- | ------------------------ | ------------------------------ |
| {objective 1}  | {how org addresses this} | {proof point from profile.yml} |
| {objective 2}  | ...                      | ...                            |

Use Adaptive Framing from _profile.md to shape the pitch angle for this category.
Narrative: How the org's theory of change maps to the grant's goals.

## Block C — Competitive Position (25% weight)

Score 1-5. Analysis of how likely we are to win.

| Factor                               | Assessment                       | Score |
| ------------------------------------ | -------------------------------- | ----- |
| Past performance in similar programs | {detail}                         | X/5   |
| Geographic advantage                 | {underserved area designations?} | X/5   |
| Partnership strength                 | {letters of support available?}  | X/5   |
| Capacity to execute                  | {staffing, infrastructure}       | X/5   |
| Agency relationship                  | {prior awards from same agency?} | X/5   |

**Past awardee research:**
1. Check USAspending.gov for prior awards under same CFDA/ALN (authoritative source)
2. WebSearch for past awardee announcements from the agency
3. Note: what did winning applicants emphasize? How does our org compare?

## Block D — Feasibility & Strategy (20% weight)

Score 1-5. Can we actually pull this off?

- Days until deadline vs estimated prep time
- Staff availability for writing and implementation
- Review criteria weights from NOFO → map to our strengths

| Review Criterion | Weight  | Our Strength         | Strategy   |
| ---------------- | ------- | -------------------- | ---------- |
| {criterion 1}    | {X pts} | {strong/medium/weak} | {approach} |
| ...              | ...     | ...                  | ...        |

## Block E — Risk Assessment (Financial Fit 15% + Strategic Value 10%)

| Risk                   | Severity | Mitigation                     | Affects         |
| ---------------------- | -------- | ------------------------------ | --------------- |
| Cost share required    | {H/M/L}  | {in-kind from partner X}       | Financial Fit   |
| Budget vs org capacity | {H/M/L}  | {phased approach}              | Financial Fit   |
| Single audit threshold | {H/M/L}  | {auditor on retainer}          | Financial Fit   |
| Tight deadline         | {H/M/L}  | {existing narrative fragments} | Feasibility     |
| New reporting system   | {H/M/L}  | {grants manager experienced}   | Strategic Value |
| Staff capacity         | {H/M/L}  | {hire with grant funds}        | Feasibility     |
| Mission drift risk     | {H/M/L}  | {aligns with strategic plan}   | Strategic Value |

Score Financial Fit (1-5) and Strategic Value (1-5) from this analysis.

## Global Score

| Dimension            | Weight   | Score     |
| -------------------- | -------- | --------- |
| Mission Alignment    | 30%      | X/5       |
| Competitive Position | 25%      | X/5       |
| Feasibility          | 20%      | X/5       |
| Financial Fit        | 15%      | X/5       |
| Strategic Value      | 10%      | X/5       |
| **Global**           | **100%** | **X.X/5** |

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
```

**Lines:** ~150
**Reads:** `_shared.md`, `_profile.md`, `config/profile.yml`, NOFO (via URL, API, or local file)
**Writes:** `reports/{###}-{slug}-{date}.md`, `data/applications.md` (new entry), `nofos/{slug}.md`
**Tools:** Grants.gov API (fetchOpportunity), WebFetch, Playwright (fallback), WebSearch (past awardees), USAspending.gov (prior awards by CFDA)

**Design decisions:**
- Eligibility gate and deal-breaker check run BEFORE any scoring blocks — no wasted effort on ineligible/unwanted grants.
- Old Block B (eligibility) merged into Step 1 gate. Old Block G (narrative outline) moved to apply.md — evaluation answers "should we?", not "how to write it."
- Blocks renumbered A-E (was A-G). Block A is summary, B-E are the four+ scoring dimensions.
- USAspending.gov added as authoritative source for past awardee research (Block C).
- Risk assessment (Block E) now explicitly feeds both Financial Fit and Strategic Value scores.
- Recommendation section added with clear thresholds and action items.
- NOFO acquisition step makes evaluate.md work standalone (not just via auto-pipeline).

---

### Mode 4: `auto-pipeline.md` — Paste URL → Full Pipeline

**Purpose:** Auto-detect when user pastes a Grants.gov URL, opportunity ID, or NOFO text. Thin router that delegates to evaluate.md and handles post-evaluation actions.

**Structure:**

```markdown
# Mode: Auto-Pipeline

## Step 0 — Detect Input Type

Determine what the user provided:
- Grants.gov URL → extract opportunityId from URL
- Grants.gov opportunity number (e.g., HHS-2024-001) → use directly
- Agency portal URL → pass URL to evaluate.md
- Raw NOFO text → pass text to evaluate.md
- Local file path → pass to evaluate.md

## Step 1 — Run Full Evaluation

Delegate entirely to evaluate.md. This runs:
- NOFO acquisition (Step 0)
- Eligibility gate (Step 1)
- Deal-breaker check (Step 2)
- Scoring blocks A-E
- Global score + recommendation

## Step 2 — Post-Evaluation Actions

Based on evaluate.md results:

- **Score >= 4.5 (Strong fit):** "Strong fit. Recommend starting application immediately. Deadline: {date} ({N} days). Want me to run apply mode?"
- **Score 4.0-4.4 (Apply):** "Good fit. Worth applying if you have capacity. Key risk: {top risk from Block E}. Want me to start the application?"
- **Score 3.0-3.9 (Marginal):** "Marginal fit. Only apply if {specific strategic reason}. Deadline: {date}."
- **Score < 3.0 (Don't apply):** "Not recommended. {primary reason}."

If user confirms application → delegate to apply.md.
```

**Lines:** ~35
**Reads:** Nothing directly (delegates to evaluate.md which reads all sources)
**Writes:** Nothing directly (evaluate.md handles report + tracker)
**Tools:** None directly (evaluate.md handles all tool calls)
**Cross-refs:** `evaluate.md` (full evaluation), `apply.md` (if user proceeds)

**Design decisions:**
- This is a thin router, not a second evaluation engine. All evaluation logic lives in evaluate.md.
- No duplicate NOFO extraction — evaluate.md Step 0 handles acquisition.
- No batch/TSV tracker writes — evaluate.md post-evaluation writes directly to applications.md.
- No inline narrative generation — that's apply.md's job if the user decides to proceed.
- Recommendation thresholds match evaluate.md exactly.

---

### Mode 5: `scan.md` — Grant Discovery

**Purpose:** Search Grants.gov for matching opportunities using API-level filters. Equivalent to career-ops `scan.md`.

**Structure:**

```markdown
# Mode: Scan for Grants

Read config/profile.yml for:
- focus_areas (keywords)
- entity_type → map to eligibility code
- target_categories → map to fundingCategories codes
- preferred_agencies → agency codes
- discovery.rss_feeds (if any)

## Entity Type → Eligibility Code Mapping (verified against Grants.gov API)

| profile.yml entity_type | API eligibility code | Grants.gov label                          |
| ----------------------- | -------------------- | ----------------------------------------- |
| nonprofit_501c3         | "12"                 | Nonprofits having a 501(c)(3) status      |
| nonprofit_non501c3      | "13"                 | Nonprofits other than 501(c)(3)           |
| state_govt              | "00"                 | State governments                         |
| county_govt             | "01"                 | County governments                        |
| city_govt               | "02"                 | City or township governments              |
| special_district        | "04"                 | Special district governments              |
| independent_school      | "05"                 | Independent school districts              |
| higher_ed               | "06"                 | Public and State controlled institutions  |
| tribal                  | "07"                 | Native American tribal governments        |
| for_profit              | "22"                 | For-profit organizations other than small  |
| small_business           | "23"                 | Small businesses                          |
| individual              | "21"                 | Individuals                               |
| other                   | "25"                 | Others                                    |

## Level 1 — Grants.gov Search API (Primary)

For each combination of focus_area keyword × preferred_agency:

POST https://api.grants.gov/v1/api/search2
{
  "keyword": "{focus_area}",
  "agencies": "{agency_code}",
  "oppStatuses": "posted",
  "eligibilities": ["{entity_type_code}"],
  "fundingCategories": ["{category_codes}"],
  "rows": 25,
  "startRecord": 1
}

**API-level filtering (done by Grants.gov, reduces noise):**
- `eligibilities` — only grants your entity type can apply to
- `fundingCategories` — only your target categories (from _shared.md codes)
- `oppStatuses: "posted"` — only open opportunities

**Pagination:** Increment startRecord by `rows` until startRecord > hitCount.
**Cap:** Stop at 200 results per query to avoid runaway scans. If hitCount > 200, log a warning and suggest narrowing keywords.

Extract per result: opportunityId, title, agency, closeDateStr, awardCeiling, awardFloor.

## Level 2 — RSS Feeds (Complementary, optional)

Only a few agencies publish usable RSS/XML feeds:
- NIH Guide (grants.nih.gov/funding/searchGuide)
- NSF (nsf.gov/funding/opportunities)
- ED EDGAR (ed.gov/grants)

If profile.yml `discovery.rss_feeds` has entries:
- Fetch RSS XML via WebFetch
- Parse entries posted in last {scan_interval} days (default: 7)
- Extract: title, link, pubDate, description
- Filter by title keywords from profile.yml focus_areas

**Note:** Most agencies do NOT have RSS feeds. Don't assume they exist — only configure feeds that have been verified.

## Filtering (client-side, after API results)

Apply title_filter from profile.yml as secondary pass:
- Positive keywords: focus_areas terms (boost ranking)
- Negative keywords: exclude known bad matches (e.g., specific program types to avoid)

This is a refinement step — the heavy filtering already happened at the API level.

## Deduplication (key on opportunity number)

Check each result's opportunityId against three sources:
1. data/scan-history.tsv → opportunityId already scanned
2. data/applications.md → opportunity number already tracked
3. data/pipeline.md → opportunity number already in queue

**Dedup on opportunityId, NOT URL.** The same grant can have multiple URL formats.

## Output

For each new (non-duplicate) opportunity:
1. Add to data/pipeline.md: `- [ ] https://www.grants.gov/search-results-detail/{opportunityId} | {agency} | {title} | {deadline}`
2. Register in data/scan-history.tsv: `{opportunityId}\t{date}\t{agency}\t{title}\t{deadline}\t{awardCeiling}\tnew`

## Summary

Display:

- Total scanned: {N} results across {N} queries
- New opportunities: {N} (added to pipeline)
- Skipped (duplicate): {N}
- Skipped (filtered out): {N}
- Nearest deadline: {date} ({N} days)

Table of new opportunities:
| # | Agency | Program | Funding Range | Deadline | Days Left |
```

**Lines:** ~130
**Reads:** `config/profile.yml`, `data/scan-history.tsv`, `data/applications.md`, `data/pipeline.md`
**Writes:** `data/pipeline.md`, `data/scan-history.tsv`
**Tools:** Grants.gov API (search2), WebFetch (RSS feeds only)

**Design decisions:**
- Entity type codes corrected to match verified Grants.gov API values (e.g., 501(c)(3) = "12", not "25").
- `config/agencies.yml` removed — RSS feed config folded into `profile.yml` under `discovery.rss_feeds`. One less config file to maintain.
- Level 3 WebSearch removed — unreliable for discovery, and state-level portals are v1.1. The API + RSS covers federal grants comprehensively.
- API-level filtering (eligibilities, fundingCategories) applied first, reducing noise before client-side title filtering.
- Pagination capped at 200 results per query to prevent runaway scans.
- Dedup keys on opportunityId instead of URL — same grant can have different URL formats.
- scan-history.tsv now includes awardCeiling for quick reference.

---

### Mode 6: `pipeline.md` — Process Queued URLs

**Purpose:** Process accumulated grant URLs from `data/pipeline.md`. Equivalent to career-ops `pipeline.md`.

**Structure:**

```markdown
# Mode: Process Pipeline

Read data/pipeline.md → find items marked `- [ ]` under "Pending".

## Processing Order

Sort pending items by deadline (nearest first). A grant closing in 3 days gets evaluated before one closing in 60 days. Items without a deadline go last.

## Workflow

For each pending item (deadline-first order):

1. Delegate to evaluate.md (which handles NOFO acquisition, eligibility gate, scoring, report, and tracker)
2. On success → move to "Processed" section:
   `- [x] #{NNN} | {url} | {agency} | {program} | {score}/5`
3. On failure → mark as failed:
   `- [!] {url} | {agency} | {reason}`
4. Ask user after each: "Continue to next? ({N} remaining)"

## Format

### Pending

- [ ] https://www.grants.gov/search-results-detail/123456 | HHS | Youth Workforce Program | 2026-06-15
- [ ] local:nofos/ed-stem-2026.md | ED | STEM Education Grant

### Processed

- [x] #001 | https://www.grants.gov/... | HHS | Youth Workforce | 4.2/5
- [!] https://agency.gov/... | DOD | Error: NOFO not accessible

## Numbering

Read reports/ folder. Next number = max existing + 1, zero-padded 3 digits.
```

**Lines:** ~40
**Reads:** `data/pipeline.md`, NOFOs via API/URL
**Writes:** `data/pipeline.md` (update statuses). Reports and tracker entries written by evaluate.md.
**Cross-refs:** `evaluate.md` (full evaluation for each item)

**Design decisions:**
- Delegates directly to evaluate.md (not auto-pipeline.md) since pipeline already has the URLs — no need for auto-pipeline's input detection step.
- Deadline-first processing order ensures urgent grants aren't missed.
- Batch mode reference removed (deferred from v1.0).
- Tracker TSV writes removed — evaluate.md writes directly to applications.md.
- Asks user to confirm between items so they can stop/reprioritize mid-queue.

---

### Mode 7: `apply.md` — SF-424 + Narrative Assistant

**Purpose:** Interactive application assistant. Helps complete SF-424 form, generate project narratives, and prepare submission package. This is where narrative drafting happens — evaluate.md decides "should we apply?", this mode does the writing. Equivalent to career-ops `apply.md`.

**Structure:**

```markdown
# Mode: Apply for Grant

## Prerequisites

1. Evaluation report must exist in reports/ for this grant
2. Read full evaluation report (summary, scoring blocks, recommendation)
3. Read NOFO from nofos/ or re-fetch via API if not saved
4. Read config/profile.yml for org data
5. Read modes/_profile.md for adaptive framing + boilerplate sections

## Step 1 — Identify Grant

If user provides:
- Report number → load report from reports/
- Grants.gov URL → match against applications.md → load report
- Agency + program name → search reports/ by filename

Load the NOFO (from nofos/ directory or re-fetch). Check NOFO for:
- Page limits per section (override defaults below)
- Required sections and their names (agencies use different terminology)
- Review criteria and point values (from evaluation Block D)

## Step 2 — SF-424 Auto-Fill

Pre-populate from config/profile.yml:

| SF-424 Field           | Source                             | Value                         |
| ---------------------- | ---------------------------------- | ----------------------------- |
| 1. Type of Submission  | Ask user                           | Application / Pre-application |
| 5a. Legal Name         | organization.legal_name            | {value}                       |
| 5b-f. Address          | organization.address               | {value}                       |
| 6. EIN                 | organization.ein                   | {value}                       |
| 7. Type of Applicant   | organization.entity_type           | {mapped value}                |
| 8a. Federal Agency     | From evaluation Block A            | {value}                       |
| 9. CFDA Number         | From evaluation Block A            | {value}                       |
| 11. Opportunity Number | From evaluation Block A            | {value}                       |
| 14. Project Dates      | From evaluation Block A + user     | {start} - {end}               |
| 15a. Federal Funding   | From budget mode                   | ${amount}                     |
| 15b. Applicant Funding | From budget mode (cost share)      | ${amount}                     |
| 18. Authorized Rep     | contacts.authorized_representative | {value}                       |
| 21. UEI                | organization.uei                   | {value}                       |

Present to user for review. Ask for any fields requiring user input.

## Step 3 — Project Narrative Generation

Generate narrative sections using:
- Evaluation report data (mission alignment evidence, competitive position analysis, risk assessment)
- _profile.md Adaptive Framing for this grant's category (pitch angle + proof points)
- _profile.md boilerplate sections as starting frameworks
- NOFO-specific requirements and review criteria

**Check NOFO for page limits before writing.** Use defaults below only if NOFO doesn't specify.

### Statement of Need (default: 1-2 pages)

- Load Adaptive Framing pitch angle for this grant's category
- Open with target population data from _profile.md Geographic Focus
- Use local/regional statistics (WebSearch if needed)
- Describe the gap in current services
- Connect to NOFO priorities using the funder's own language

### Project Design (default: 3-5 pages)

- Goals and SMART objectives aligned to NOFO priorities
- Activities mapped to objectives (logic model format)
- Timeline table (Year 1 / Year 2 / Year 3)
- Staffing plan with key personnel
- How this design addresses review criteria (from evaluation Block D)

### Organizational Capacity (default: 1-2 pages)

- Start from _profile.md Organizational Capacity boilerplate (~250 words)
- Customize with relevant past_performance from profile.yml
- Name key staff with qualifications
- Partner commitment descriptions
- Reference _profile.md Letters of Support Strategy

### Evaluation Plan (default: 1-2 pages)

- Start from _profile.md Evaluation Plan Framework boilerplate (~200 words)
- Customize metrics to this grant's specific objectives
- Logic model alignment
- Data collection methods and schedule

### Sustainability Plan (default: 0.5-1 page)

- Start from _profile.md Sustainability Plan boilerplate (~150 words)
- Customize to this program's continuation strategy
- Diversified funding sources specific to this program area

Save narrative drafts to narratives/{agency-slug}-{program-slug}/ for reuse in future applications to the same agency or category.

## Step 4 — Attachments Checklist

Generate checklist from NOFO requirements:

- [ ] SF-424 (completed above)
- [ ] SF-424A Budget (→ run budget mode)
- [ ] Project Narrative (generated above)
- [ ] Budget Narrative (→ run budget mode)
- [ ] Letters of Support (see _profile.md strategy)
- [ ] Resumes of Key Personnel
- [ ] Indirect Cost Rate Agreement (rate from profile.yml)
- [ ] SAM.gov registration confirmation
- [ ] Other (from NOFO-specific requirements)

## Step 5 — Review Package

Display all generated documents for user review.
**NEVER submit without explicit user approval.**

## Step 6 — Post-Apply

If user confirms submission:
1. Update status in applications.md → "Applied"
2. Add submission date to notes
3. Suggest: "Set reminder to check for reviewer feedback in {typical_review_period}"
```

**Lines:** ~140
**Reads:** `reports/{matching}`, `nofos/{matching}`, `config/profile.yml`, `modes/_profile.md`
**Writes:** Application documents to `output/`, narrative drafts to `narratives/{slug}/`
**Tools:** WebSearch (local statistics for Statement of Need)
**Cross-refs:** `evaluate.md` (report data), `budget.md` (SF-424A + budget narrative)

**Design decisions:**
- Narrative generation is the primary value of this mode — formerly Block G in evaluate.md, now properly housed here.
- All narrative sections reference _profile.md Adaptive Framing for category-specific pitch angles.
- NOFO page limits checked first; defaults only used when NOFO doesn't specify.
- Narrative drafts saved to narratives/ for reuse — good narratives take hours, and sections like Organizational Capacity and Sustainability Plan are largely reusable across similar grants.
- Status uses canonical "Applied" (not "Submitted") per templates/states.yml.
- Backslash escapes removed from _profile.md references.

---

### Mode 8: `budget.md` — SF-424A Budget Builder

**Purpose:** Build detailed budget with SF-424A compliance and generate budget narrative. Unique to grants-ops (no career-ops equivalent).

**Structure:**

```markdown
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

| Position            | Annual Salary | % FTE | Year 1 | Year 2 | Year 3 | Total |
| ------------------- | ------------- | ----- | ------ | ------ | ------ | ----- |
| Project Director    | $X            | X%    | $X     | $X     | $X     | $X    |
| Program Coordinator | $X            | X%    | $X     | $X     | $X     | $X    |

Apply 3% annual escalation for Years 2+.

### B. Fringe Benefits

Rate: {X%} of personnel. Itemize: FICA, health, retirement, workers comp.

### C. Travel

| Trip        | Purpose          | # Trips | Cost/Trip | Total |
| ----------- | ---------------- | ------- | --------- | ----- |
| Conference  | Required by NOFO | 1/yr    | $X        | $X    |
| Site visits | Program delivery | X/yr    | $X        | $X    |

### D. Equipment

Items >= equipment threshold from profile.yml (federal default $5,000 per unit).

### E. Supplies

Items < $5,000. Itemize categories.

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

| Source         | Type            | Amount | Documentation    |
| -------------- | --------------- | ------ | ---------------- |
| Partner X      | In-kind (space) | $X     | MOU              |
| Org funds      | Cash            | $X     | Board resolution |
| Volunteer time | In-kind         | $X     | Time tracking    |

Total match must meet {X%} of federal request.

## Step 4 — Budget Summary (SF-424A Section A)

| Category  | Federal | Non-Federal | Total  |
| --------- | ------- | ----------- | ------ |
| Personnel | $X      | $X          | $X     |
| Fringe    | $X      | $X          | $X     |
| ...       | ...     | ...         | ...    |
| **Total** | **$X**  | **$X**      | **$X** |

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
```

**Lines:** ~160
**Reads:** `config/profile.yml` (all financial data + budget defaults), evaluation report, NOFO from `nofos/`
**Writes:** Budget docs to `output/`
**Tools:** WebSearch (BLS salary data for reasonableness)

**Design decisions:**
- All financial defaults (rates, thresholds, escalation) live in profile.yml, not _profile.md. Budget mode is data-driven, not narrative-driven.
- Step 0 checks NOFO for budget restrictions before building — avoids rework when a category is capped or prohibited.
- Escalation rate and equipment threshold are configurable in profile.yml with sensible defaults (3%, $5,000).
- SF-424A structure and budget narrative format (What/Why/How/Reasonableness) are solid per 2 CFR 200 standards.

---

### Mode 9: `tracker.md` (was 10) — Application Status Management

**Purpose:** View and manage grant application tracker. Equivalent to career-ops `tracker.md`.

**Structure:**

```markdown
# Mode: Grant Tracker

## Tracker Format (data/applications.md)

| #   | Date | Agency | Program | Opp # | Score | Status | Deadline | Report | Notes |
| --- | ---- | ------ | ------- | ----- | ----- | ------ | -------- | ------ | ----- |

## Canonical States (grants-specific lifecycle)

Source: templates/states.yml

| State          | When to use                                              |
| -------------- | -------------------------------------------------------- |
| Discovered     | Found via scan, added to pipeline, not yet evaluated     |
| Evaluated      | Report completed, pending decision                       |
| Preparing      | Actively writing application (narratives, budget, forms) |
| Applied        | Application submitted to Grants.gov / agency portal      |
| Under Review   | Agency confirmed receipt, in review process               |
| Awarded        | Grant awarded                                             |
| Not Funded     | Application reviewed but not selected                     |
| Withdrawn      | Withdrawn by applicant before review                      |
| SKIP           | Doesn't fit — failed eligibility gate or deal-breaker     |

Flow: Discovered → Evaluated → Preparing → Applied → Under Review → {Awarded / Not Funded}
Side exits: Any state → Withdrawn, Evaluated → SKIP

## Statistics

Display:

- Total opportunities tracked
- By status (count per state)
- Average score of evaluated grants
- Upcoming deadlines (next 30 days)
- Awards won / applied ratio (win rate)
- Total funding requested vs total funding awarded

## Deadline Alerts

⚠️ Flag any "Evaluated" or "Preparing" grants with deadline < 14 days
🔴 Flag any with deadline < 7 days

## Editing Rules

- Can update status and notes of existing entries
- New entries are created by evaluate.md during post-evaluation — do NOT add manually
- Status must be canonical (from states.yml)
- No markdown bold in status field
- No dates in status field (use the Date column)
```

**Lines:** ~50
**Reads:** `data/applications.md`, `templates/states.yml`
**Writes:** Status/notes updates to `data/applications.md`

**Design decisions:**
- Canonical states redesigned for the grant lifecycle (not copied from career-ops which has "Interview"/"Offer" — wrong for grants).
- "Applied" used consistently (not "Submitted") — matches apply.md Step 6.
- "Discovered" added as initial state for scan results before evaluation.
- "Preparing" added to track actively-in-progress applications (writing narratives/budget).
- New entries come from evaluate.md, not batch/TSV system (deferred).

---

### Mode 10: `compare.md` — Side-by-Side Comparison

**Purpose:** Compare multiple grant opportunities to decide which to work on first. Uses existing evaluation scores — does NOT re-score. Equivalent to career-ops `ofertas.md`.

**Structure:**

```markdown
# Mode: Compare Grants

## Process

1. User provides 2+ grants (by report number, opportunity number, or name)
2. Load evaluation reports for each
3. Build comparison table from existing scores
4. Apply prioritization factors for tiebreaking
5. Recommend work order given capacity constraints

## Comparison Table (from existing evaluation scores)

| Dimension            | Weight | Grant A | Grant B | Grant C |
| -------------------- | ------ | ------- | ------- | ------- |
| Mission Alignment    | 30%    | X/5     | X/5     | X/5     |
| Competitive Position | 25%    | X/5     | X/5     | X/5     |
| Feasibility          | 20%    | X/5     | X/5     | X/5     |
| Financial Fit        | 15%    | X/5     | X/5     | X/5     |
| Strategic Value      | 10%    | X/5     | X/5     | X/5     |
| **Global Score**     |        | X.X/5   | X.X/5   | X.X/5   |

These scores come directly from evaluate.md reports — do NOT re-score.

## Prioritization Factors (tiebreakers)

When global scores are close (within 0.5), use these to decide work order:

| Factor                  | Grant A       | Grant B       | Grant C       |
| ----------------------- | ------------- | ------------- | ------------- |
| Deadline                | {date} ({N}d) | {date} ({N}d) | {date} ({N}d) |
| Funding amount          | ${X}          | ${X}          | ${X}          |
| Cost share burden       | {X%}          | {X%}          | {X%}          |
| Narrative reusability   | {H/M/L}       | {H/M/L}       | {H/M/L}       |
| Reporting complexity    | {H/M/L}       | {H/M/L}       | {H/M/L}       |

**Narrative reusability:** Check narratives/ directory — do existing drafts cover this grant's category?
**Reporting complexity:** Estimate from NOFO (monthly > quarterly > annual; programmatic + financial > financial only).

## Output

Ranked recommendation with reasoning:

"Recommended work order:
1. **Grant A** (4.3/5) — deadline in 12 days, requires immediate attention
2. **Grant C** (4.1/5) — highest funding ($500K), existing ED narrative reusable
3. **Grant B** (4.2/5) — strong score but deadline is 60 days out, can wait

Given your team can realistically prepare 1-2 applications simultaneously,
start Grant A now and Grant C next week."
```

**Lines:** ~45
**Reads:** Multiple evaluation reports from `reports/`, `narratives/` (for reusability check)
**Writes:** Nothing

**Design decisions:**
- Uses the SAME 5-dimension scoring from evaluate.md — no separate scoring system that could contradict evaluation results.
- Prioritization factors are tiebreakers for work order, not weighted scores. They answer "which first?" not "which is better?"
- Narrative reusability checks the narratives/ directory for existing drafts — a practical factor since reusing an Organizational Capacity section saves days.
- Output is a capacity-aware recommendation, not just a ranking table.

---

### Mode 11: `deep.md` — Agency/Program Research

**Purpose:** Deep research on a funding agency or program. Reusable across multiple grants from the same agency. Equivalent to career-ops `deep.md`.

**Structure:**

```markdown
# Mode: Deep Research

Read config/profile.yml for org context (entity type, focus areas, geographic area).
Check data/agency-research/{agency-slug}.md — if exists and < 90 days old, update rather than rebuild.

## 6 Research Axes

1. Agency Strategy & Priorities
   - Current strategic plan (WebSearch: "{agency} strategic plan {year}")
   - Secretary/director stated priorities
   - Recent RFIs or NOFOs signaling future direction
   - Agency congressional justification (published annually on agency website)

2. Program History
   - Past awardees via USAspending.gov (search by CFDA/ALN — authoritative source)
   - Supplement with agency award announcements (WebSearch)
   - Typical award sizes and project designs
   - What winning applications emphasized
   - Common rejection reasons (if published in reviewer feedback)

3. Review Process
   - Peer review vs merit review vs formula
   - Review criteria and weights (from recent NOFOs)
   - Reviewer composition (academics, practitioners, agency staff)
   - Timeline from submission to award notification

4. Program Officer Context
   - Name and contact from NOFO
   - Published guidance, FAQ documents, webinar recordings
   - Whether pre-application inquiries are encouraged
   - Prior NOFOs from same program officer (signals preferences)

5. Political & Funding Context
   - Appropriations status: full-year vs continuing resolution (congress.gov)
   - Program authorization status and reauthorization timeline
   - Bipartisan support indicators
   - Administration priorities alignment
   - Sources: CRS reports, agency congressional justifications, committee reports

6. Competitive Landscape
   - Typical applicant pool size (from past NOFO stats if published)
   - Geographic distribution of past awards (USAspending.gov)
   - Types of organizations that win (large vs small, urban vs rural)
   - Your org's positioning within this landscape (from profile.yml)

## Output

Save structured research brief to data/agency-research/{agency-slug}.md with date header.

Format:
- Agency overview (1 paragraph)
- Key findings per axis (bullet points)
- Strategic recommendations for applications to this agency
- Sources cited

This research is reusable — reference it from future evaluations for the same agency.
```

**Lines:** ~60
**Reads:** `config/profile.yml`, `data/agency-research/{agency-slug}.md` (if exists)
**Writes:** `data/agency-research/{agency-slug}.md`
**Tools:** WebSearch, USAspending.gov (past awards by CFDA)

**Design decisions:**
- USAspending.gov is the primary source for past awardees (authoritative, searchable by CFDA/ALN). WebSearch is supplementary.
- LinkedIn lookup removed from Program Officer axis — published guidance and official statements are what matter, not personal profiles.
- Specific source references added for political/funding context (congress.gov, CRS reports, agency congressional justifications).
- Research saved to data/agency-research/ for reuse across grants from the same agency. Checked for staleness (90 days) before rebuilding.
- "Generate prompt for external tools" removed — this IS the research tool.

---

### Mode 12: `outreach.md` — Program Officer Contact

**Purpose:** Draft communications to program officers. Equivalent to career-ops `contacto.md`.

**Structure:**

```markdown
# Mode: Outreach to Program Officers

## Step 1 — Context Gathering

From NOFO: program officer name, email, phone.
Check data/agency-research/{agency-slug}.md if exists — reference findings on:
- Whether pre-application inquiries are encouraged
- Prior NOFOs from same program officer
- Agency communication preferences

If deep.md research says "do not contact" or "no pre-app inquiries" → warn user before proceeding.

## Step 2 — Draft Communication

Four types:

### Pre-Application Inquiry (most common)

Subject: Pre-Application Inquiry — {Opportunity Number}

Body (4 parts):
1. Who we are (1 sentence from profile.yml mission)
2. Specific question about eligibility, scope, or budget
3. Brief context for why this matters to the program
4. Professional close

### Letter of Intent

Check NOFO: LOI may be required, optional, or not accepted.
- **Required:** Must submit by LOI deadline — treat as a hard deadline
- **Optional:** Submitting signals serious intent and helps agency plan reviewer panels — recommend submitting
- **Not mentioned:** Do not submit unless agency specifically requests

If required or submitting: auto-populate org data from profile.yml, structure per NOFO requirements.

### Webinar / Technical Assistance Follow-Up

Many federal programs offer pre-application webinars or TA sessions.
Draft a follow-up question referencing specific webinar content:

1. Reference the webinar date and topic
2. Quote or paraphrase the specific point that raised the question
3. Ask the clarifying question
4. Keep under 200 words

### Post-Submission Follow-Up

Professional check-in on application status.

**Timing guidance:**
- Wait until AFTER the agency's stated review timeline has passed
- If no timeline given, wait at least 90 days after submission
- Check agency website for award announcements before emailing
- One follow-up only — do not send repeated check-ins

## Rules

- Professional, concise (under 300 words for emails)
- Reference specific NOFO sections when asking questions
- NEVER ask questions answered in the NOFO — program officers flag this as a red mark
- One question per email preferred (multi-part questions get partial answers)
- Use the org's official email, not personal accounts
```

**Lines:** ~60
**Reads:** `config/profile.yml`, evaluation report, `data/agency-research/{agency-slug}.md` (if exists), NOFO
**Writes:** Nothing (draft text for user review)
**Tools:** None (all context from existing files)

**Design decisions:**
- WebSearch for program officer background removed — NOFO contact info is sufficient for professional outreach.
- References deep.md agency research when available, especially the "pre-app inquiries encouraged" flag.
- Webinar/TA follow-up added as a template type — common scenario after pre-application events.
- LOI distinguished as required/optional/not accepted — optional LOIs are worth submitting as a signal.
- Post-submission follow-up includes timing guidance to avoid premature or repeated contact.

---

### Mode 13: `compliance.md` — Readiness Checker

**Purpose:** Self-assessment of organizational compliance and registration status. All checks read from profile.yml (self-reported) — this mode reminds users to verify externally. Unique to grants-ops.

**When to run:** During onboarding (first setup), quarterly (catch expiring registrations), and before starting any new application.

**Structure:**

```markdown
# Mode: Compliance Check

Read config/profile.yml (sam_registration, compliance sections).

**Important:** This is a self-assessment based on what you've entered in profile.yml.
It does NOT verify against external systems. You are responsible for confirming
your registration status directly on SAM.gov, Grants.gov, etc.

## Checks

### SAM.gov Registration

- Status: {active/pending/expired/not_registered} (from profile.yml)
- Expiration: {date}
  - ⚠️ if < 90 days → flag for renewal (initiate renewal at least 30 days before expiration)
  - 🔴 if < 30 days or expired → URGENT — renewal can take 2-4 weeks to process
- Action: If expired/not registered → guide to sam.gov/content/entity-registration
- **Verify externally:** Log into SAM.gov to confirm status — profile.yml may be stale

### UEI (Unique Entity Identifier)

- Present: ✅/❌ (from profile.yml)
- If missing → cannot submit federal grant applications
- UEI is assigned through SAM.gov registration — no separate application needed

### Indirect Cost Rate

- Type: negotiated / de_minimis_10 / none (from profile.yml)
- If none → recommend 10% de minimis rate (2 CFR 200.414) — available to all orgs that have never had a negotiated rate
- If negotiated → check agreement expiration date
- If de_minimis → no expiration, but org must consistently apply the rate

### Single Audit (2 CFR 200 Subpart F)

- Required if org spends $750K+ in federal funds in a single fiscal year
- Status: {compliant / needed / not_applicable} (from profile.yml)
- Most recent audit date
- If needed → must be completed within 9 months of fiscal year end

### Required Certifications

These are signed as part of the SF-424 submission — you do NOT file them separately.
The user certifies compliance by signing the application. This checklist confirms
the org can truthfully make these certifications:

- [ ] Non-delinquent on federal debt
- [ ] Drug-free workplace (41 USC 8102)
- [ ] Non-lobbying (31 USC 1352)
- [ ] Civil rights compliance (Title VI, Title IX, Section 504, Age Discrimination Act)
- [ ] Debarment/suspension — not currently excluded (2 CFR 180)

### System Access (Grants.gov)

- [ ] Grants.gov account active
- [ ] Authorized Representative (AOR) linked to org in Grants.gov
- [ ] E-Business POC confirmed

**Dependency note:** The AOR role requires approval from your org's E-Business Point
of Contact (E-Biz POC). If you don't know who your E-Biz POC is, check SAM.gov
entity record or contact the Grants.gov help desk. This is a common blocker —
without E-Biz POC approval, the AOR cannot submit applications.

## Output

Compliance scorecard: {N}/{total} checks passed.
Action items for any failures, prioritized by urgency:
1. 🔴 Blockers (cannot submit without fixing)
2. ⚠️ Warnings (will become blockers soon)
3. ℹ️ Recommendations (best practices)

Remind user: "Update profile.yml with any changes, then re-run compliance check to confirm."
```

**Lines:** ~80
**Reads:** `config/profile.yml`
**Writes:** Nothing (advisory output)

**Design decisions:**
- Explicitly framed as self-assessment — all data from profile.yml, no external API verification (SAM.gov API rate limits make automation impractical).
- SAM.gov renewal window expanded to 90 days with urgency tiers (renewal takes 2-4 weeks).
- E-Business POC dependency documented — this is the #1 surprise blocker for first-time applicants.
- Certifications clarified as SF-424 sign-off, not separate filings — prevents users from searching for documents that don't exist.
- When-to-run guidance added: onboarding + quarterly + pre-application.

---

## SKILL.md — Router

```markdown
# Skill: grants-ops

## Routing

| Input        | Mode          | Mode File        |
| ------------ | ------------- | ---------------- |
| (empty)      | status        | (inline — see below) |
| evaluate     | evaluate      | evaluate.md      |
| scan         | scan          | scan.md          |
| pipeline     | pipeline      | pipeline.md      |
| apply        | apply         | apply.md         |
| budget       | budget        | budget.md        |
| tracker      | tracker       | tracker.md       |
| compare      | compare       | compare.md       |
| deep         | deep          | deep.md          |
| outreach     | outreach      | outreach.md      |
| compliance   | compliance    | compliance.md    |

Each mode file specifies its own context reads (_shared.md, _profile.md, profile.yml, etc.).
The router just picks the mode — it does NOT manage context loading.

## Auto-Detection (when user provides input without a command)

If input contains:
- grants.gov URL → auto-pipeline.md
- Numeric opportunity ID (e.g., "350123") → auto-pipeline.md
- Opportunity number pattern (e.g., "HHS-2026-001") → auto-pipeline.md
- "CFDA", "ALN", "NOFO", "SF-424" keywords → auto-pipeline.md
- Long pasted text with grant keywords ("eligible applicants", "funding amount", "period of performance") → auto-pipeline.md
- Status questions ("how's my pipeline", "what's pending", "upcoming deadlines") → tracker.md

## Status Dashboard (empty command: `/grants-ops`)

When invoked with no arguments, show a quick status overview:

1. Read data/applications.md → count by status
2. Read data/pipeline.md → count pending items
3. Find nearest deadline from Evaluated/Preparing grants
4. Display:

   "**Grants Pipeline Status**
   - Tracked: {N} opportunities
   - Pending evaluation: {N} in pipeline
   - In progress: {N} Preparing
   - Applied: {N} submitted, awaiting results
   - Nearest deadline: {grant name} — {date} ({N} days)

   Commands: evaluate · scan · pipeline · apply · budget · tracker · compare · deep · outreach · compliance"

## Unknown Command

If user types an unrecognized command → show the commands list above with one-line descriptions.
```

---

## Data Contract

| Layer                         | Files                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User (NEVER auto-updated)** | `config/profile.yml`, `modes/_profile.md`, `data/applications.md`, `data/pipeline.md`, `data/scan-history.tsv`, `data/agency-research/*`, `reports/*`, `output/*`, `nofos/*`, `narratives/*` |
| **System (auto-updatable)**   | `modes/_shared.md`, all other `modes/*.md`, `CLAUDE.md`, `*.mjs`, `templates/*`, `.claude/skills/*`, `VERSION` |

---

## Canonical States (`templates/states.yml`)

```yaml
states:
  - id: discovered
    label: Discovered
    aliases: [found, new, scanned]
    description: Found via scan, not yet evaluated
    dashboard_group: discovered
  - id: evaluated
    label: Evaluated
    aliases: [reviewed, assessed]
    description: Full evaluation completed
    dashboard_group: evaluated
  - id: preparing
    label: Preparing
    aliases: [drafting, in_progress, writing]
    description: Application in progress
    dashboard_group: preparing
  - id: applied
    label: Applied
    aliases: [submitted, sent]
    description: Application submitted to Grants.gov or agency portal
    dashboard_group: applied
  - id: under_review
    label: Under Review
    aliases: [pending_review, in_review]
    description: Agency confirmed receipt, in review
    dashboard_group: under_review
  - id: awarded
    label: Awarded
    aliases: [funded, approved, won]
    description: Grant awarded
    dashboard_group: awarded
  - id: not_funded
    label: Not Funded
    aliases: [rejected, declined, unfunded]
    description: Application not selected
    dashboard_group: not_funded
  - id: withdrawn
    label: Withdrawn
    aliases: [cancelled, retracted]
    description: Application withdrawn by org
    dashboard_group: withdrawn
  - id: skip
    label: SKIP
    aliases: [no_apply, pass, ineligible]
    description: Does not fit, do not apply
    dashboard_group: skip
```

---

## Tracker Format

```markdown
| #   | Date       | Agency | Program         | Opp #        | Score | Status    | Deadline   | Report                                               | Notes              |
| --- | ---------- | ------ | --------------- | ------------ | ----- | --------- | ---------- | ---------------------------------------------------- | ------------------ |
| 001 | 2026-04-07 | HHS    | Youth Workforce | HHS-2026-001 | 4.2/5 | Evaluated | 2026-06-15 | [001](reports/001-hhs-youth-workforce-2026-04-07.md) | Strong mission fit |
```

---

## Onboarding Flow

Triggered when `config/profile.yml` or `modes/_profile.md` is missing. Run these checks silently at session start.

### Step 1 — Organization Profile (required)

If `config/profile.yml` is missing, copy from `config/profile.example.yml` and ask:

> "I need some details about your organization:
> - Legal name, EIN, and UEI
> - Entity type (nonprofit 501(c)(3), state govt, university, small business, etc.)
> - Location and service area
> - What types of grants are you targeting? (e.g., health, education, workforce)
> - Your SAM.gov registration status (active/pending/expired/not registered)
>
> I'll set up your profile."

Fill in `config/profile.yml` with answers. Map entity type to Grants.gov eligibility code.

### Step 2 — Customization File (required)

If `modes/_profile.md` is missing, copy from `modes/_profile.template.md` silently.

### Step 3 — Tracker (required)

If `data/applications.md` doesn't exist, create it with the header row from Tracker Format section.

### Step 4 — Compliance Check (recommended)

Run compliance.md checks against the new profile.yml. Flag any blockers (missing SAM, missing UEI) before the user wastes time evaluating grants they can't apply to.

### Step 5 — Get to Know the Org (important for quality)

> "The basics are ready. The system works much better when it understands your organization deeply:
> - What's your org's biggest competitive advantage in grant applications?
> - What past federal/state grants have you won? (agency, program, amount)
> - Any deal-breakers? (e.g., no cost share above 25%, no grants under $50K)
> - Key partnerships that strengthen applications?
> - Published outcomes data, reports, or evaluations?
>
> The more context you give me, the better I evaluate and write."

Store insights in `config/profile.yml` and `modes/_profile.md` adaptive framing.

### Step 6 — Ready

> "You're all set! You can now:
> - Paste a Grants.gov URL to evaluate it
> - Run `/grants-ops scan` to search for matching opportunities
> - Run `/grants-ops compliance` to check your registration status
> - Run `/grants-ops` to see all commands
>
> Everything is customizable — just ask me to change anything."

---

## Implementation Order (v1.0)

1. **Scaffold:** repo, CLAUDE.md, DATA_CONTRACT.md, profile.example.yml, states.yml, .gitignore, package.json, VERSION
2. **Core modes:** _shared.md, _profile.template.md, evaluate.md, auto-pipeline.md, scan.md, pipeline.md, tracker.md
3. **Application modes:** apply.md, budget.md
4. **Supporting modes:** compare.md, deep.md, outreach.md, compliance.md
5. **Scripts:** verify-pipeline.mjs, normalize-statuses.mjs, update-system.mjs
6. **Skill + polish:** SKILL.md, README.md

## Deferred to v1.1+

- **Batch system:** batch.md, batch-prompt.md, batch-runner.sh, batch/ directory, merge-tracker.mjs, dedup-tracker.mjs
- **PDF generation:** pdf.md, generate-pdf.mjs, HTML templates, fonts/
- **Additional scripts:** profile-sync-check.mjs
- **State portal scanning:** state-specific Playwright adapters
- **Foundation discovery:** ProPublica/990 integration

## Verification

1. `node verify-pipeline.mjs` — tracker integrity (report links resolve, statuses canonical, no duplicate opp numbers)
2. Test scan: verify Grants.gov search2 API returns results for sample keywords with eligibility filter
3. Test evaluate: paste real Grants.gov URL, confirm eligibility gate + blocks A-E generate correctly
4. Test onboarding: start with empty config/, verify guided setup creates profile.yml and _profile.md
5. Test apply: verify SF-424 auto-populates from profile.yml
6. Test compliance: verify scorecard reads from profile.yml and flags missing SAM/UEI
7. Test dedup: run scan twice with same keywords, verify no duplicate pipeline entries (keyed on opportunityId)
