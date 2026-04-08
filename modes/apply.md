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

| SF-424 Field | Source | Value |
|-------------|--------|-------|
| 1. Type of Submission | Ask user | Application / Pre-application |
| 5a. Legal Name | organization.legal_name | {value} |
| 5b-f. Address | organization.address | {value} |
| 6. EIN | organization.ein | {value} |
| 7. Type of Applicant | organization.entity_type | {mapped value} |
| 8a. Federal Agency | From evaluation Block A | {value} |
| 9. CFDA Number | From evaluation Block A | {value} |
| 11. Opportunity Number | From evaluation Block A | {value} |
| 14. Project Dates | From evaluation Block A + user | {start} - {end} |
| 15a. Federal Funding | From budget mode | ${amount} |
| 15b. Applicant Funding | From budget mode (cost share) | ${amount} |
| 18. Authorized Rep | contacts.authorized_representative | {value} |
| 21. UEI | organization.uei | {value} |

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

Save narrative drafts to narratives/{agency-slug}-{program-slug}/ for reuse in future applications.

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
