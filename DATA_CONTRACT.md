# Data Contract

Two layers. The rule is simple: **user data is sacred, system files are updatable.**

## User Layer (NEVER auto-updated)

These files contain the user's data, customizations, and work product. System updates will NEVER touch them.

| File | Purpose |
|------|---------|
| `config/profile.yml` | Organization profile, credentials, targets |
| `modes/_profile.md` | Narrative framing, pitch strategy, boilerplate |
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Pending grant URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `data/agency-research/*` | Deep research briefs per agency |
| `reports/*` | Evaluation reports |
| `output/*` | Generated application documents |
| `nofos/*` | Saved NOFO text |
| `narratives/*` | Reusable narrative drafts |

## System Layer (auto-updatable)

These files can be updated by `node update-system.mjs apply`. They contain system logic, not user data.

| File | Purpose |
|------|---------|
| `modes/_shared.md` | Scoring system, categories, rules |
| `modes/*.md` (except `_profile.md`) | Mode instructions |
| `CLAUDE.md` | Project instructions |
| `*.mjs` | Scripts |
| `templates/*` | States, examples |
| `.claude/skills/*` | Skill router |
| `VERSION` | System version |

## The Rule

**When the user asks to customize anything** (narrative, scoring, deal-breakers, boilerplate, geographic focus), ALWAYS write to `modes/_profile.md` or `config/profile.yml`. NEVER edit `modes/_shared.md` for user-specific content.
