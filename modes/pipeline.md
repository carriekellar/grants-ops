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
