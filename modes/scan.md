# Mode: Scan for Grants

Read config/profile.yml for:
- focus_areas (keywords)
- entity_type → map to eligibility code
- target_categories → map to fundingCategories codes
- preferred_agencies → agency codes
- discovery.rss_feeds (if any)

## Entity Type → Eligibility Code Mapping (verified against Grants.gov API)

| profile.yml entity_type | API eligibility code | Grants.gov label |
|------------------------|---------------------|------------------|
| nonprofit_501c3 | "12" | Nonprofits having a 501(c)(3) status |
| nonprofit_non501c3 | "13" | Nonprofits other than 501(c)(3) |
| state_govt | "00" | State governments |
| county_govt | "01" | County governments |
| city_govt | "02" | City or township governments |
| special_district | "04" | Special district governments |
| independent_school | "05" | Independent school districts |
| higher_ed | "06" | Public and State controlled institutions |
| tribal | "07" | Native American tribal governments |
| for_profit | "22" | For-profit organizations other than small |
| small_business | "23" | Small businesses |
| individual | "21" | Individuals |
| other | "25" | Others |

## Level 1 — Grants.gov Search API (Primary)

For each combination of focus_area keyword × preferred_agency:

```
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
```

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

**Note:** Most agencies do NOT have RSS feeds. Don't assume they exist.

## Filtering (client-side, after API results)

Apply title_filter from profile.yml as secondary pass:
- Positive keywords: focus_areas terms (boost ranking)
- Negative keywords: exclude known bad matches

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
