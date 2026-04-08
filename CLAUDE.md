# Grants-Ops -- AI Grant Search & Application Pipeline

## Origin

Modeled after [career-ops](https://github.com/santifer/career-ops), this system automates discovering, evaluating, and applying to government grants. It uses the Grants.gov public API for federal grant discovery and provides structured evaluation, narrative generation, and application assistance.

**It works out of the box, but it's designed to be made yours.** The categories, scoring weights, narrative framing, and deal-breakers are all customizable. You (Claude) can edit the user's files. The user says "change my focus areas to health equity" and you do it.

## Data Contract (CRITICAL)

There are two layers. Read `DATA_CONTRACT.md` for the full list.

**User Layer (NEVER auto-updated, personalization goes HERE):**
- `config/profile.yml`, `modes/_profile.md`
- `data/*`, `data/agency-research/*`, `reports/*`, `output/*`, `nofos/*`, `narratives/*`

**System Layer (auto-updatable, DON'T put user data here):**
- `modes/_shared.md`, all other `modes/*.md`
- `CLAUDE.md`, `*.mjs` scripts, `templates/*`, `.claude/skills/*`, `VERSION`

**THE RULE: When the user asks to customize anything (narrative, scoring, deal-breakers, boilerplate, geographic focus, budget defaults), ALWAYS write to `modes/_profile.md` or `config/profile.yml`. NEVER edit `modes/_shared.md` for user-specific content.**

## Update Check

On the first message of each session, run the update checker silently:

```bash
node update-system.mjs check
```

Parse the JSON output:
- `{"status": "update-available", ...}` → tell the user:
  > "grants-ops update available (v{local} → v{remote}). Your data (profile, tracker, reports) will NOT be touched. Want me to update?"
  If yes → `node update-system.mjs apply`. If no → `node update-system.mjs dismiss`.
- `{"status": "up-to-date"}` → say nothing
- `{"status": "dismissed"}` → say nothing
- `{"status": "offline"}` → say nothing

## What is grants-ops

AI-powered grant search and application pipeline built on Claude Code: discovery via Grants.gov API, structured evaluation with eligibility gating, narrative generation, SF-424 assistance, budget building, and compliance tracking.

### Main Files

| File | Function |
|------|----------|
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Inbox of pending grant URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `config/profile.yml` | Organization profile and config |
| `data/agency-research/` | Deep research briefs per agency |
| `reports/` | Evaluation reports |
| `nofos/` | Saved NOFO text |
| `narratives/` | Reusable narrative drafts |
| `output/` | Generated application documents |

### First Run -- Onboarding (IMPORTANT)

**Before doing ANYTHING else, check if the system is set up.** Run these checks silently every session:

1. Does `config/profile.yml` exist (not just profile.example.yml)?
2. Does `modes/_profile.md` exist (not just _profile.template.md)?

If `modes/_profile.md` is missing, copy from `modes/_profile.template.md` silently.

**If ANY required file is missing, enter onboarding mode:**

#### Step 1: Organization Profile (required)
If `config/profile.yml` is missing, copy from `config/profile.example.yml` and ask:
> "I need some details about your organization:
> - Legal name, EIN, and UEI
> - Entity type (nonprofit 501(c)(3), state govt, university, small business, etc.)
> - Location and service area
> - What types of grants are you targeting?
> - Your SAM.gov registration status
>
> I'll set up your profile."

#### Step 2: Customization File (required)
If `modes/_profile.md` is missing, copy from `modes/_profile.template.md` silently.

#### Step 3: Tracker (required)
If `data/applications.md` doesn't exist, create it:
```markdown
# Applications Tracker

| # | Date | Agency | Program | Opp # | Score | Status | Deadline | Report | Notes |
|---|------|--------|---------|-------|-------|--------|----------|--------|-------|
```

#### Step 4: Compliance Check (recommended)
Run compliance.md checks. Flag blockers (missing SAM, missing UEI) before the user wastes time evaluating grants they can't apply to.

#### Step 5: Get to Know the Org
> "The basics are ready. The system works much better when it understands your organization deeply:
> - What's your org's biggest competitive advantage in grant applications?
> - What past federal/state grants have you won?
> - Any deal-breakers? (e.g., no cost share above 25%, no grants under $50K)
> - Key partnerships that strengthen applications?
> - Published outcomes data, reports, or evaluations?"

Store insights in `config/profile.yml` and `modes/_profile.md`.

#### Step 6: Ready
> "You're all set! You can now:
> - Paste a Grants.gov URL to evaluate it
> - Run `/grants-ops scan` to search for matching opportunities
> - Run `/grants-ops compliance` to check your registration status
> - Run `/grants-ops` to see all commands
>
> Everything is customizable -- just ask me to change anything."

### Skill Modes

| If the user... | Mode |
|----------------|------|
| Pastes Grants.gov URL or NOFO text | `auto-pipeline` |
| Asks to evaluate a grant | `evaluate` |
| Asks to compare grants | `compare` |
| Wants to search for grants | `scan` |
| Processes pending URLs | `pipeline` |
| Asks to apply / write narrative | `apply` |
| Needs budget / SF-424A | `budget` |
| Asks about application status | `tracker` |
| Wants agency/program research | `deep` |
| Wants to contact program officer | `outreach` |
| Checks compliance/registration | `compliance` |

### Grant Verification -- MANDATORY

**NEVER trust WebSearch/WebFetch to verify if a grant is still posted.** Use the Grants.gov API:
1. Call `fetchOpportunity` with the opportunityId
2. Check `oppStatus === 'posted'`
3. Only if API fails, fall back to Playwright `browser_navigate` + `browser_snapshot`

### Canonical States (applications.md)

**Source of truth:** `templates/states.yml`

| State | When to use |
|-------|-------------|
| `Discovered` | Found via scan, not yet evaluated |
| `Evaluated` | Report completed, pending decision |
| `Preparing` | Actively writing application |
| `Applied` | Application submitted |
| `Under Review` | Agency confirmed receipt, in review |
| `Awarded` | Grant awarded |
| `Not Funded` | Application not selected |
| `Withdrawn` | Withdrawn by applicant |
| `SKIP` | Failed eligibility gate or deal-breaker |

**RULES:**
- No markdown bold in status field
- No dates in status field (use the Date column)

### Pipeline Integrity

1. New entries in applications.md come from evaluate.md post-evaluation -- do NOT add manually.
2. YES you can edit applications.md to UPDATE status/notes of existing entries.
3. All reports MUST include `**URL:**` in the header.
4. All statuses MUST be canonical (from states.yml).
5. Health check: `node verify-pipeline.mjs`
6. Normalize statuses: `node normalize-statuses.mjs`

### Tracker Format

```
| # | Date | Agency | Program | Opp # | Score | Status | Deadline | Report | Notes |
```

Report numbering: sequential 3-digit zero-padded, max existing + 1.
Report filename: `reports/{###}-{agency-slug}-{program-slug}-{YYYY-MM-DD}.md`

### Stack and Conventions

- Node.js (mjs modules), Playwright (scraping fallback), YAML (config), Markdown (data + modes)
- Scripts in `.mjs`, configuration in YAML
- Output in `output/` (gitignored), Reports in `reports/`
- NOFOs in `nofos/`, Narratives in `narratives/`

---

## Ethical Use -- CRITICAL

**This system is designed for quality, not quantity.** The goal is to help organizations find and apply to grants where there is a genuine match -- not to spam agencies with mass applications.

- **NEVER submit an application without the user reviewing it first.** Draft narratives, fill forms, generate budgets -- but always STOP before submitting. The user makes the final call.
- **Strongly discourage low-fit applications.** If a score is below 3.0/5, explicitly recommend against applying. The user's time and the reviewer's time are both valuable.
- **Quality over speed.** A well-crafted application to 3 grants beats a generic blast to 30.
- **Respect reviewers' time.** Every application a human reads costs federal staff attention. Only send what's worth reading.
