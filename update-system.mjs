#!/usr/bin/env node

/**
 * update-system.mjs — Check for and apply system updates
 *
 * Commands:
 *   node update-system.mjs check    — Check if update is available (JSON output)
 *   node update-system.mjs apply    — Pull latest system files (preserves user layer)
 *   node update-system.mjs dismiss  — Dismiss current update notification
 *   node update-system.mjs rollback — Revert last update
 *
 * Respects the data contract: NEVER touches user layer files.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const command = process.argv[2] || 'check';
const versionFile = join(__dirname, 'VERSION');
const dismissFile = join(__dirname, '.update-dismissed');

function getLocalVersion() {
  if (!existsSync(versionFile)) return '0.0.0';
  return readFileSync(versionFile, 'utf-8').trim();
}

function getRemoteVersion() {
  try {
    // Try to fetch the remote VERSION file without pulling
    const remote = execSync(
      'git ls-remote origin HEAD 2>/dev/null',
      { cwd: __dirname, encoding: 'utf-8', timeout: 10000 }
    ).trim();

    if (!remote) return null;

    // Fetch without merging to check remote VERSION
    execSync('git fetch origin main --quiet 2>/dev/null', {
      cwd: __dirname,
      encoding: 'utf-8',
      timeout: 15000,
    });

    const remoteVersion = execSync(
      'git show origin/main:VERSION 2>/dev/null',
      { cwd: __dirname, encoding: 'utf-8', timeout: 5000 }
    ).trim();

    return remoteVersion || null;
  } catch {
    return null; // offline or no remote
  }
}

function getChangelog() {
  try {
    const log = execSync(
      'git log HEAD..origin/main --oneline 2>/dev/null',
      { cwd: __dirname, encoding: 'utf-8', timeout: 5000 }
    ).trim();
    return log || 'No changelog available';
  } catch {
    return 'No changelog available';
  }
}

// ---------- commands ----------

function check() {
  const local = getLocalVersion();

  // Check if dismissed
  if (existsSync(dismissFile)) {
    const dismissed = readFileSync(dismissFile, 'utf-8').trim();
    const remote = getRemoteVersion();
    if (remote && dismissed === remote) {
      console.log(JSON.stringify({ status: 'dismissed' }));
      return;
    }
    // New version available beyond dismissed version — clear dismiss
  }

  const remote = getRemoteVersion();
  if (!remote) {
    console.log(JSON.stringify({ status: 'offline' }));
    return;
  }

  if (remote === local) {
    console.log(JSON.stringify({ status: 'up-to-date' }));
    return;
  }

  const changelog = getChangelog();
  console.log(JSON.stringify({
    status: 'update-available',
    local,
    remote,
    changelog,
  }));
}

function apply() {
  const local = getLocalVersion();

  try {
    // Stash any local changes to user files
    execSync('git stash --include-untracked --quiet 2>/dev/null', {
      cwd: __dirname,
      encoding: 'utf-8',
    });
  } catch {
    // No changes to stash — fine
  }

  try {
    // Tag current state for rollback
    const tag = `pre-update-${local}-${Date.now()}`;
    execSync(`git tag ${tag}`, { cwd: __dirname, encoding: 'utf-8' });

    // Pull latest
    execSync('git pull origin main --quiet', {
      cwd: __dirname,
      encoding: 'utf-8',
      timeout: 30000,
    });

    // Pop stash to restore user files
    try {
      execSync('git stash pop --quiet 2>/dev/null', {
        cwd: __dirname,
        encoding: 'utf-8',
      });
    } catch {
      // Merge conflict in stash — user files take priority
      console.error('⚠️  Merge conflict detected. Your user files are preserved.');
      console.error('   Run `git stash show` to see conflicting files.');
    }

    // Clear dismiss file
    if (existsSync(dismissFile)) {
      execSync(`rm "${dismissFile}"`, { cwd: __dirname });
    }

    const newVersion = getLocalVersion();
    console.log(JSON.stringify({
      status: 'updated',
      from: local,
      to: newVersion,
      rollback_tag: tag,
    }));
  } catch (e) {
    console.error(JSON.stringify({
      status: 'error',
      message: e.message,
    }));
    process.exit(1);
  }
}

function dismiss() {
  const remote = getRemoteVersion();
  if (remote) {
    writeFileSync(dismissFile, remote, 'utf-8');
    console.log(JSON.stringify({ status: 'dismissed', version: remote }));
  } else {
    console.log(JSON.stringify({ status: 'offline' }));
  }
}

function rollback() {
  try {
    // Find most recent pre-update tag
    const tags = execSync(
      'git tag -l "pre-update-*" --sort=-creatordate',
      { cwd: __dirname, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    if (tags.length === 0) {
      console.log(JSON.stringify({
        status: 'error',
        message: 'No update tags found. Nothing to rollback.',
      }));
      process.exit(1);
    }

    const latestTag = tags[0];
    execSync(`git reset --hard ${latestTag}`, {
      cwd: __dirname,
      encoding: 'utf-8',
    });

    const version = getLocalVersion();
    console.log(JSON.stringify({
      status: 'rolled-back',
      to_tag: latestTag,
      version,
    }));
  } catch (e) {
    console.error(JSON.stringify({
      status: 'error',
      message: e.message,
    }));
    process.exit(1);
  }
}

// ---------- dispatch ----------

switch (command) {
  case 'check': check(); break;
  case 'apply': apply(); break;
  case 'dismiss': dismiss(); break;
  case 'rollback': rollback(); break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node update-system.mjs [check|apply|dismiss|rollback]');
    process.exit(1);
}
