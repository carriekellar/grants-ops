# Mode: Grant Tracker

## Tracker Format (data/applications.md)

| # | Date | Agency | Program | Opp # | Score | Status | Deadline | Report | Notes |
|---|------|--------|---------|-------|-------|--------|----------|--------|-------|

## Canonical States (grants-specific lifecycle)

Source: templates/states.yml

| State | When to use |
|-------|-------------|
| Discovered | Found via scan, added to pipeline, not yet evaluated |
| Evaluated | Report completed, pending decision |
| Preparing | Actively writing application (narratives, budget, forms) |
| Applied | Application submitted to Grants.gov / agency portal |
| Under Review | Agency confirmed receipt, in review process |
| Awarded | Grant awarded |
| Not Funded | Application reviewed but not selected |
| Withdrawn | Withdrawn by applicant before review |
| SKIP | Doesn't fit — failed eligibility gate or deal-breaker |

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
