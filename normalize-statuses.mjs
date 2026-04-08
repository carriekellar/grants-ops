#!/usr/bin/env node

/**
 * normalize-statuses.mjs — Normalize tracker statuses to canonical labels
 *
 * Reads templates/states.yml for canonical labels and aliases.
 * Scans data/applications.md and replaces any alias with the canonical label.
 * Also strips markdown bold (**) from status fields.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- load states ----------

function loadStateMap() {
  const statesPath = join(__dirname, 'templates', 'states.yml');
  if (!existsSync(statesPath)) {
    console.error('❌ templates/states.yml not found');
    process.exit(1);
  }
  const raw = readFileSync(statesPath, 'utf-8');
  const map = new Map(); // alias → canonical label

  let currentLabel = null;
  for (const line of raw.split('\n')) {
    const labelMatch = line.match(/^\s+label:\s*(.+)/);
    if (labelMatch) {
      currentLabel = labelMatch[1].trim();
      map.set(currentLabel.toLowerCase(), currentLabel);
    }
    const aliasMatch = line.match(/^\s+aliases:\s*\[(.+)\]/);
    if (aliasMatch && currentLabel) {
      aliasMatch[1].split(',').forEach(a => {
        map.set(a.trim().toLowerCase(), currentLabel);
      });
    }
  }
  return map;
}

// ---------- main ----------

const trackerPath = join(__dirname, 'data', 'applications.md');

if (!existsSync(trackerPath)) {
  console.log('ℹ️  data/applications.md not found — nothing to normalize.');
  process.exit(0);
}

const stateMap = loadStateMap();
const raw = readFileSync(trackerPath, 'utf-8');
const lines = raw.split('\n');
let changed = 0;

const output = lines.map(line => {
  if (!line.startsWith('|') || line.includes('---')) return line;
  const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
  if (cells.length < 8 || cells[0] === '#') return line;

  // Status is column index 6 (0-indexed)
  let status = cells[6];
  // Strip markdown bold
  const cleaned = status.replace(/\*\*/g, '').trim();
  const canonical = stateMap.get(cleaned.toLowerCase());

  if (canonical && canonical !== status) {
    cells[6] = canonical;
    changed++;
    return '| ' + cells.join(' | ') + ' |';
  }
  return line;
});

if (changed === 0) {
  console.log('✅ All statuses are already canonical.');
} else {
  writeFileSync(trackerPath, output.join('\n'), 'utf-8');
  console.log(`✅ Normalized ${changed} status${changed > 1 ? 'es' : ''} in applications.md`);
}
