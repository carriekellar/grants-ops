# Mode: Deep Research

Read config/profile.yml for org context (entity type, focus areas, geographic area).
Check data/agency-research/{agency-slug}.md — if exists and < 90 days old, update rather than rebuild.

## 6 Research Axes

### 1. Agency Strategy & Priorities
- Current strategic plan (WebSearch: "{agency} strategic plan {year}")
- Secretary/director stated priorities
- Recent RFIs or NOFOs signaling future direction
- Agency congressional justification (published annually on agency website)

### 2. Program History
- Past awardees via USAspending.gov (search by CFDA/ALN — authoritative source)
- Supplement with agency award announcements (WebSearch)
- Typical award sizes and project designs
- What winning applications emphasized
- Common rejection reasons (if published in reviewer feedback)

### 3. Review Process
- Peer review vs merit review vs formula
- Review criteria and weights (from recent NOFOs)
- Reviewer composition (academics, practitioners, agency staff)
- Timeline from submission to award notification

### 4. Program Officer Context
- Name and contact from NOFO
- Published guidance, FAQ documents, webinar recordings
- Whether pre-application inquiries are encouraged
- Prior NOFOs from same program officer (signals preferences)

### 5. Political & Funding Context
- Appropriations status: full-year vs continuing resolution (congress.gov)
- Program authorization status and reauthorization timeline
- Bipartisan support indicators
- Administration priorities alignment
- Sources: CRS reports, agency congressional justifications, committee reports

### 6. Competitive Landscape
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
