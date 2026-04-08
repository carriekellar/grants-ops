#!/usr/bin/env node

/**
 * verify-pipeline.mjs — Grants-ops pipeline integrity checker
 *
 * Checks:
 * 1. All report links in applications.md resolve to existing files
 * 2. All statuses are canonical (from templates/states.yml)
 * 3. No duplicate opportunity numbers
 * 4. Report filenames match expected pattern
 * 5. No orphaned reports (report exists but not in tracker)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from './lib/yaml-lite.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- helpers ----------

function loadStates() {
  const statesPath = join(__dirname, 'templates', 'states.yml');
  if (!existsSync(statesPath)) {
    console.error('❌ templates/states.yml not found');
    process.exit(1);
  }
  const raw = readFileSync(statesPath, 'utf-8');
  // Simple YAML parsing for states — extract labels and aliases
  const labels = new Set();
  const lines = raw.split('\n');
  for (const line of lines) {
    const labelMatch = line.match(/^\s+label:\s*(.+)/);
    if (labelMatch) labels.add(labelMatch[1].trim());
    const aliasMatch = line.match(/^\s+aliases:\s*\[(.+)\]/);
    if (aliasMatch) {
      aliasMatch[1].split(',').forEach(a => labels.add(a.trim()));
    }
  }
  return labels;
}

function loadTracker() {
  const trackerPath = join(__dirname, 'data', 'applications.md');
  if (!existsSync(trackerPath)) {
    return { exists: false, rows: [] };
  }
  const raw = readFileSync(trackerPath, 'utf-8');
  const lines = raw.split('\n');
  const rows = [];

  for (const line of lines) {
    // Match table rows (skip header and separator)
    if (!line.startsWith('|') || line.includes('---')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 8) continue;
    // Skip header row
    if (cells[0] === '#') continue;

    rows.push({
      num: cells[0],
      date: cells[1],
      agency: cells[2],
      program: cells[3],
      oppNum: cells[4],
      score: cells[5],
      status: cells[6],
      deadline: cells[7],
      report: cells[8] || '',
      notes: cells[9] || '',
      raw: line,
    });
  }
  return { exists: true, rows };
}

function getReportFiles() {
  const reportsDir = join(__dirname, 'reports');
  if (!existsSync(reportsDir)) return [];
  return readdirSync(reportsDir).filter(f => f.endsWith('.md') && f !== '.gitkeep');
}

// ---------- checks ----------

function checkReportLinks(rows) {
  const errors = [];
  for (const row of rows) {
    const linkMatch = row.report.match(/\[.*?\]\((.+?)\)/);
    if (!linkMatch) continue;
    const reportPath = join(__dirname, linkMatch[1]);
    if (!existsSync(reportPath)) {
      errors.push(`Row #${row.num}: report link "${linkMatch[1]}" → file not found`);
    }
  }
  return errors;
}

function checkCanonicalStatuses(rows, validStates) {
  const errors = [];
  for (const row of rows) {
    const status = row.status.replace(/\*\*/g, '').trim();
    if (!validStates.has(status)) {
      errors.push(`Row #${row.num}: status "${status}" is not canonical. Valid: ${[...validStates].join(', ')}`);
    }
    if (row.status.includes('**')) {
      errors.push(`Row #${row.num}: status contains markdown bold — remove ** from "${row.status}"`);
    }
  }
  return errors;
}

function checkDuplicateOppNums(rows) {
  const errors = [];
  const seen = new Map();
  for (const row of rows) {
    if (!row.oppNum || row.oppNum === '-') continue;
    if (seen.has(row.oppNum)) {
      errors.push(`Duplicate opportunity number "${row.oppNum}" in rows #${seen.get(row.oppNum)} and #${row.num}`);
    } else {
      seen.set(row.oppNum, row.num);
    }
  }
  return errors;
}

function checkReportFilenames(reportFiles) {
  const errors = [];
  const pattern = /^\d{3}-.+?-\d{4}-\d{2}-\d{2}\.md$/;
  for (const f of reportFiles) {
    if (!pattern.test(f)) {
      errors.push(`Report filename "${f}" doesn't match pattern {###}-{slug}-{YYYY-MM-DD}.md`);
    }
  }
  return errors;
}

function checkOrphanedReports(rows, reportFiles) {
  const errors = [];
  const linkedReports = new Set();
  for (const row of rows) {
    const linkMatch = row.report.match(/\[.*?\]\(reports\/(.+?)\)/);
    if (linkMatch) linkedReports.add(linkMatch[1]);
  }
  for (const f of reportFiles) {
    if (!linkedReports.has(f)) {
      errors.push(`Orphaned report: "reports/${f}" exists but is not linked in applications.md`);
    }
  }
  return errors;
}

// ---------- main ----------

console.log('🔍 grants-ops pipeline verification\n');

const validStates = loadStates();
const { exists, rows } = loadTracker();
const reportFiles = getReportFiles();

if (!exists) {
  console.log('ℹ️  data/applications.md not found — no tracker to verify yet.');
  console.log('   Run an evaluation first to create the tracker.\n');
  process.exit(0);
}

if (rows.length === 0) {
  console.log('ℹ️  Tracker exists but has no entries yet.\n');
  process.exit(0);
}

const allErrors = [];

console.log(`📋 Tracker: ${rows.length} entries`);
console.log(`📄 Reports: ${reportFiles.length} files\n`);

// Run all checks
const checks = [
  { name: 'Report links resolve', fn: () => checkReportLinks(rows) },
  { name: 'Canonical statuses', fn: () => checkCanonicalStatuses(rows, validStates) },
  { name: 'No duplicate opp numbers', fn: () => checkDuplicateOppNums(rows) },
  { name: 'Report filename format', fn: () => checkReportFilenames(reportFiles) },
  { name: 'No orphaned reports', fn: () => checkOrphanedReports(rows, reportFiles) },
];

for (const check of checks) {
  const errors = check.fn();
  if (errors.length === 0) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} (${errors.length} issue${errors.length > 1 ? 's' : ''})`);
    errors.forEach(e => console.log(`     → ${e}`));
    allErrors.push(...errors);
  }
}

console.log('');
if (allErrors.length === 0) {
  console.log('✅ All checks passed!\n');
  process.exit(0);
} else {
  console.log(`❌ ${allErrors.length} issue${allErrors.length > 1 ? 's' : ''} found. Fix and re-run.\n`);
  process.exit(1);
}
