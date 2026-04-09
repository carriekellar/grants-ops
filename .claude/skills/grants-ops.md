---
name: grants-ops
description: AI grant search command center -- discover, evaluate, and apply to government grants
user_invocable: true
---

# Skill: grants-ops

AI grant search command center -- discover, evaluate, and apply to government grants

## Routing

| Input | Mode | Mode File |
|-------|------|-----------|
| (empty) | status | (inline — see below) |
| evaluate | evaluate | evaluate.md |
| scan | scan | scan.md |
| pipeline | pipeline | pipeline.md |
| apply | apply | apply.md |
| budget | budget | budget.md |
| tracker | tracker | tracker.md |
| compare | compare | compare.md |
| deep | deep | deep.md |
| outreach | outreach | outreach.md |
| compliance | compliance | compliance.md |

All mode files live in `modes/` at the project root (e.g., `modes/evaluate.md`).
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
