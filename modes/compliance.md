# Mode: Compliance Check

Read config/profile.yml (sam_registration, compliance sections).

**Important:** This is a self-assessment based on what you've entered in profile.yml.
It does NOT verify against external systems. You are responsible for confirming
your registration status directly on SAM.gov, Grants.gov, etc.

**When to run:** During onboarding (first setup), quarterly (catch expiring registrations),
and before starting any new application.

## Checks

### SAM.gov Registration

- Status: {active/pending/expired/not_registered} (from profile.yml)
- Expiration: {date}
  - ⚠️ if < 90 days → flag for renewal (initiate renewal at least 30 days before expiration)
  - 🔴 if < 30 days or expired → URGENT — renewal can take 2-4 weeks to process
- Action: If expired/not registered → guide to sam.gov/content/entity-registration
- **Verify externally:** Log into SAM.gov to confirm status — profile.yml may be stale

### UEI (Unique Entity Identifier)

- Present: ✅/❌ (from profile.yml)
- If missing → cannot submit federal grant applications
- UEI is assigned through SAM.gov registration — no separate application needed

### Indirect Cost Rate

- Type: negotiated / de_minimis_10 / none (from profile.yml)
- If none → recommend 10% de minimis rate (2 CFR 200.414) — available to all orgs that have never had a negotiated rate
- If negotiated → check agreement expiration date
- If de_minimis → no expiration, but org must consistently apply the rate

### Single Audit (2 CFR 200 Subpart F)

- Required if org spends $750K+ in federal funds in a single fiscal year
- Status: {compliant / needed / not_applicable} (from profile.yml)
- Most recent audit date
- If needed → must be completed within 9 months of fiscal year end

### Required Certifications

These are signed as part of the SF-424 submission — you do NOT file them separately.
The user certifies compliance by signing the application. This checklist confirms
the org can truthfully make these certifications:

- [ ] Non-delinquent on federal debt
- [ ] Drug-free workplace (41 USC 8102)
- [ ] Non-lobbying (31 USC 1352)
- [ ] Civil rights compliance (Title VI, Title IX, Section 504, Age Discrimination Act)
- [ ] Debarment/suspension — not currently excluded (2 CFR 180)

### System Access (Grants.gov)

- [ ] Grants.gov account active
- [ ] Authorized Representative (AOR) linked to org in Grants.gov
- [ ] E-Business POC confirmed

**Dependency note:** The AOR role requires approval from your org's E-Business Point
of Contact (E-Biz POC). If you don't know who your E-Biz POC is, check SAM.gov
entity record or contact the Grants.gov help desk. This is a common blocker —
without E-Biz POC approval, the AOR cannot submit applications.

## Output

Compliance scorecard: {N}/{total} checks passed.
Action items for any failures, prioritized by urgency:
1. 🔴 Blockers (cannot submit without fixing)
2. ⚠️ Warnings (will become blockers soon)
3. ℹ️ Recommendations (best practices)

Remind user: "Update profile.yml with any changes, then re-run compliance check to confirm."
