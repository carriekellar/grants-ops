# Grants-Ops

AI-powered government grant search and application pipeline, built on Claude Code.

Discover, evaluate, and apply to federal grants from Grants.gov — with structured scoring, SF-424 auto-fill, narrative generation, and application tracking.

## How It Works

1. **Configure** your organization profile (entity type, mission, past performance)
2. **Scan** Grants.gov for matching opportunities via API + RSS feeds
3. **Evaluate** each grant with a structured A-G assessment (eligibility, alignment, competitiveness, risk)
4. **Apply** with auto-generated SF-424 forms, project narratives, and budget documents
5. **Track** everything in a single application tracker with deadline alerts

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/grants-ops.git
cd grants-ops

# Install dependencies
npm install

# Start Claude Code and run the skill
claude
# Then type: /grants-ops
```

The system will guide you through onboarding — setting up your org profile, SAM.gov registration check, and grant targets.

## Architecture

Modeled after [career-ops](https://github.com/santifer/career-ops). See `docs/technical-review.md` for the full technical specification.

### Modes

| Command | Mode | Purpose |
|---------|------|---------|
| `/grants-ops` | discovery | Show all commands |
| `/grants-ops scan` | scan | Search Grants.gov for matching grants |
| `/grants-ops evaluate` | evaluate | Full A-G evaluation of a grant |
| `/grants-ops apply` | apply | SF-424 + narrative generation |
| `/grants-ops budget` | budget | SF-424A budget builder |
| `/grants-ops tracker` | tracker | Application status + deadlines |
| `/grants-ops compare` | compare | Side-by-side grant comparison |
| `/grants-ops deep` | deep | Agency/program research |
| `/grants-ops outreach` | outreach | Program officer communications |
| `/grants-ops compliance` | compliance | SAM.gov + certification readiness |
| `/grants-ops batch` | batch | Bulk processing |
| `/grants-ops pdf` | pdf | Generate application PDFs |

### Data Sources

- **Grants.gov API** (primary, free, no auth) — federal grant opportunities
- **RSS Feeds** (complementary) — per-agency new/modified opportunity alerts
- **GrantFinder.com** (optional, paid) — state, foundation, and corporate grants
- **SAM.gov API** — entity registration validation

### Key Files

| File | Purpose |
|------|---------|
| `config/profile.yml` | Your organization identity, targets, past performance |
| `modes/_profile.md` | Your narrative framing and deal-breakers |
| `data/applications.md` | Grant application tracker |
| `data/pipeline.md` | URL inbox of opportunities to evaluate |
| `reports/` | Evaluation reports (A-G structured assessments) |
| `output/` | Generated PDFs (narratives, budgets, SF-424) |

### Data Contract

Your data (`config/profile.yml`, `modes/_profile.md`, `data/*`, `reports/*`, `output/*`) is **never auto-updated**. System files (modes, scripts, templates) can be safely updated without touching your work.

See `DATA_CONTRACT.md` for the full separation.

## License

MIT
