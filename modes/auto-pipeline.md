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
