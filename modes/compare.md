# Mode: Compare Grants

## Process

1. User provides 2+ grants (by report number, opportunity number, or name)
2. Load evaluation reports for each
3. Build comparison table from existing scores
4. Apply prioritization factors for tiebreaking
5. Recommend work order given capacity constraints

## Comparison Table (from existing evaluation scores)

| Dimension | Weight | Grant A | Grant B | Grant C |
|-----------|--------|---------|---------|---------|
| Mission Alignment | 30% | X/5 | X/5 | X/5 |
| Competitive Position | 25% | X/5 | X/5 | X/5 |
| Feasibility | 20% | X/5 | X/5 | X/5 |
| Financial Fit | 15% | X/5 | X/5 | X/5 |
| Strategic Value | 10% | X/5 | X/5 | X/5 |
| **Global Score** | | X.X/5 | X.X/5 | X.X/5 |

These scores come directly from evaluate.md reports — do NOT re-score.

## Prioritization Factors (tiebreakers)

When global scores are close (within 0.5), use these to decide work order:

| Factor | Grant A | Grant B | Grant C |
|--------|---------|---------|---------|
| Deadline | {date} ({N}d) | {date} ({N}d) | {date} ({N}d) |
| Funding amount | ${X} | ${X} | ${X} |
| Cost share burden | {X%} | {X%} | {X%} |
| Narrative reusability | {H/M/L} | {H/M/L} | {H/M/L} |
| Reporting complexity | {H/M/L} | {H/M/L} | {H/M/L} |

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
