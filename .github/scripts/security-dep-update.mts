#!/usr/bin/env tsx
/**
 * security-dep-update.mts
 *
 * Detects vulnerable npm packages via `yarn npm audit` and attempts to update
 * each one to the latest patch/minor version within its current major, skipping:
 *   - Advisory IDs listed in `npmAuditIgnoreAdvisories` in .yarnrc.yml
 *   - Packages that have a local `.yarn/patches/` patch (patch: protocol in resolutions)
 *   - Packages where the only fix requires a major version bump
 *
 * Writes:
 *   .tmp/pr-body.md        — body for the DRAFT PR (full table of changes)
 *   .tmp/failure-report.md — issue body template (validation outcomes appended by workflow)
 *
 * Sets GITHUB_OUTPUT:
 *   packages_updated  — number of packages successfully updated (0 = nothing to do)
 *   update_summary    — human-readable one-liner
 */

import { spawnSync } from 'child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import semver from 'semver';
import * as core from '@actions/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
}

type UpdateStatus =
  | 'updated'
  | 'skipped-patched'
  | 'skipped-major'
  | 'skipped-ignored'
  | 'failed';

interface PackageResult {
  name: string;
  oldVersion: string | null;
  newVersion: string | null;
  status: UpdateStatus;
  advisoryIds: number[];
  advisoryTitles: string[];
  advisoryUrls: string[];
  reason?: string;
}

// ---------------------------------------------------------------------------
// Shell helper
// ---------------------------------------------------------------------------

function run(
  cmd: string,
  opts: { silent?: boolean } = {},
): { ok: boolean; output: string } {
  if (!opts.silent) {
    console.log(`  $ ${cmd}`);
  }
  const res = spawnSync(cmd, { encoding: 'utf8', shell: true });
  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
  return { ok: res.status === 0, output };
}

// ---------------------------------------------------------------------------
// 1. Patched packages — resolutions that use the `patch:` protocol
//    These have a hand-crafted patch file in .yarn/patches/ and must be
//    manually updated to avoid corrupting the patch.
// ---------------------------------------------------------------------------

function getPatchedPackages(pkg: PackageJson): Set<string> {
  const patched = new Set<string>();
  for (const [key, value] of Object.entries(pkg.resolutions ?? {})) {
    if (typeof value === 'string' && value.startsWith('patch:')) {
      // Key forms: "@scope/name@npm:^x.y.z" | "name@^x" | "name"
      const stripped = key
        .replace(/@npm:.*/u, '')
        .replace(/@[\^~><=].*/u, '');
      patched.add(stripped);
    }
  }
  return patched;
}

// ---------------------------------------------------------------------------
// 2. Ignored advisory IDs — npmAuditIgnoreAdvisories in .yarnrc.yml
// ---------------------------------------------------------------------------

function getIgnoredAdvisoryIds(): Set<number> {
  const ids = new Set<number>();
  try {
    const yarnrc = readFileSync('.yarnrc.yml', 'utf8');
    let inSection = false;
    for (const line of yarnrc.split('\n')) {
      if (line.trimEnd() === 'npmAuditIgnoreAdvisories:') {
        inSection = true;
        continue;
      }
      if (inSection) {
        const numMatch = line.match(/^\s+-\s+(\d+)/u);
        if (numMatch) {
          ids.add(Number(numMatch[1]));
          continue;
        }
        // Section ends at a non-indented, non-comment, non-blank line
        if (
          line.length > 0 &&
          !line.startsWith(' ') &&
          !line.startsWith('\t') &&
          !line.startsWith('#') &&
          !line.startsWith('-')
        ) {
          inSection = false;
        }
      }
    }
  } catch {
    // .yarnrc.yml not readable — proceed without ignore list
  }
  return ids;
}

// ---------------------------------------------------------------------------
// 3. Run `yarn npm audit` and parse Berry's tree output
//    Berry emits newline-delimited JSON (NDJSON) or a single JSON object.
//    Each advisory appears as a leaf node in the package tree.
// ---------------------------------------------------------------------------

interface AuditLeaf {
  ID?: number;
  Issue?: string;
  URL?: string;
  Severity?: string;
  'Vulnerable Versions'?: string;
  'Tree Versions'?: string[];
}

function isAuditLeaf(v: unknown): v is AuditLeaf {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.Issue === 'string' && typeof obj.Severity === 'string';
}

function collectLeaves(
  node: unknown,
  moduleName: string | null,
  out: Array<{ moduleName: string; leaf: AuditLeaf }>,
): void {
  if (isAuditLeaf(node)) {
    out.push({ moduleName: moduleName ?? 'unknown', leaf: node });
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectLeaves(item, moduleName, out);
    }
    return;
  }
  if (!node || typeof node !== 'object') return;

  const rec = node as Record<string, unknown>;
  // Berry's tree node: { value: "pkg-name@version", children: [...] }
  if (typeof rec.value === 'string' && 'children' in rec) {
    collectLeaves(rec.children, rec.value, out);
    return;
  }
  for (const val of Object.values(rec)) {
    collectLeaves(val, moduleName, out);
  }
}

function parseJsonOrNdjson(text: string): unknown[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    return [JSON.parse(trimmed) as unknown];
  } catch {
    // Fall through to NDJSON
  }
  return trimmed
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as unknown];
      } catch {
        return [];
      }
    });
}

interface AuditEntry {
  moduleName: string;
  id: number | null;
  title: string;
  url: string;
  severity: string;
}

function runAudit(): AuditEntry[] {
  console.log('Running yarn npm audit …');
  // Yarn exits non-zero when vulnerabilities are found — that is expected.
  const res = spawnSync(
    'yarn npm audit --recursive --environment production --severity moderate --json',
    { encoding: 'utf8', shell: true },
  );
  const text = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  const records = parseJsonOrNdjson(text);

  const leaves: Array<{ moduleName: string; leaf: AuditLeaf }> = [];
  for (const record of records) {
    collectLeaves(record, null, leaves);
  }

  return leaves.map(({ moduleName, leaf }) => ({
    // moduleName comes from the parent tree node's `value` field, e.g. "pkg@1.0.0"
    // Strip the version suffix to get the bare package name.
    moduleName: moduleName.replace(/@\d.*$/u, '').replace(/@npm:.*/u, ''),
    id: typeof leaf.ID === 'number' ? leaf.ID : null,
    title: leaf.Issue ?? '(unknown)',
    url: leaf.URL ?? '',
    severity: leaf.Severity ?? 'unknown',
  }));
}

// ---------------------------------------------------------------------------
// 4. Installed version helper — reads from node_modules
// ---------------------------------------------------------------------------

function getInstalledVersion(name: string): string | null {
  const p = `node_modules/${name}/package.json`;
  if (!existsSync(p)) return null;
  try {
    return (
      (JSON.parse(readFileSync(p, 'utf8')) as { version?: string }).version ??
      null
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. GitHub Actions step summary helper
// ---------------------------------------------------------------------------

function writeStepSummary(text: string): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    appendFileSync(path, text, 'utf8');
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// 6. Report generators
// ---------------------------------------------------------------------------

function workflowRunUrl(): string {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
  }
  return '(workflow run URL unavailable)';
}

function advisoryLink(url: string, title: string): string {
  return url ? `[${title}](${url})` : title;
}

function buildPrBody(results: PackageResult[], date: string): string {
  const runUrl = workflowRunUrl();
  const updated = results.filter((r) => r.status === 'updated');
  const skippedPatched = results.filter((r) => r.status === 'skipped-patched');
  const skippedMajor = results.filter((r) => r.status === 'skipped-major');
  const failed = results.filter((r) => r.status === 'failed');

  let body = `## Automated Security Dependency Update — ${date}

This PR was opened automatically by the [automated-security-dep-update](${runUrl}) workflow.

It updates npm packages with known CVEs to the **latest patch/minor version within their current major**, keeping lockfile and resolution changes minimal. Major version bumps, patched packages, and pinned-exact packages are skipped and listed below.

> **Review, then remove the Draft status to trigger full CI** (lint, unit tests, build, E2E). The workflow itself skips E2E — they run normally on this PR.

---

## ✅ Updated Packages

`;

  if (updated.length === 0) {
    body += '_No packages were updated._\n\n';
  } else {
    body +=
      '| Package | Old Version | New Version | Advisory ID(s) | Issue |\n';
    body +=
      '|---------|------------|------------|----------------|-------|\n';
    for (const r of updated) {
      const idsStr = r.advisoryIds.join(', ') || '—';
      const issueSummary = r.advisoryUrls.length > 0
        ? r.advisoryUrls
            .map((u, i) => advisoryLink(u, r.advisoryTitles[i] ?? 'Advisory'))
            .join(', ')
        : r.advisoryTitles.join(', ') || '—';
      body += `| \`${r.name}\` | \`${r.oldVersion ?? '?'}\` | \`${r.newVersion ?? '?'}\` | ${idsStr} | ${issueSummary} |\n`;
    }
    body += '\n';
  }

  // --- Manual attention section ---
  const hasManual =
    skippedPatched.length > 0 || skippedMajor.length > 0 || failed.length > 0;

  if (hasManual) {
    body += `---\n\n## ⚠️ Packages Requiring Manual Attention\n\nThe following vulnerabilities were **not automatically fixed**.\n\n`;

    if (skippedPatched.length > 0) {
      body += `### Packages with local \`.yarn/patches/\` patches\n\nThese packages have hand-crafted patch files in \`.yarn/patches/\`. Upgrading them requires updating or removing the patch first.\n\n`;
      body +=
        '| Package | Installed Version | Advisory ID(s) | Issue |\n';
      body +=
        '|---------|------------------|----------------|-------|\n';
      for (const r of skippedPatched) {
        const idsStr = r.advisoryIds.join(', ') || '—';
        const issueSummary = r.advisoryUrls.length > 0
          ? r.advisoryUrls
              .map((u, i) =>
                advisoryLink(u, r.advisoryTitles[i] ?? 'Advisory'),
              )
              .join(', ')
          : r.advisoryTitles.join(', ') || '—';
        body += `| \`${r.name}\` | \`${r.oldVersion ?? '?'}\` | ${idsStr} | ${issueSummary} |\n`;
      }
      body += '\n';
    }

    if (skippedMajor.length > 0) {
      body += `### Packages requiring a major version bump\n\nThe security fix for these packages is only available in a newer major version, which may introduce breaking changes.\n\n`;
      body +=
        '| Package | Installed Version | Advisory ID(s) | Reason |\n';
      body +=
        '|---------|------------------|----------------|--------|\n';
      for (const r of skippedMajor) {
        const idsStr = r.advisoryIds.join(', ') || '—';
        body += `| \`${r.name}\` | \`${r.oldVersion ?? '?'}\` | ${idsStr} | ${r.reason ?? '—'} |\n`;
      }
      body += '\n';
    }

    if (failed.length > 0) {
      body += `### Failed updates\n\n| Package | Reason |\n|---------|--------|\n`;
      for (const r of failed) {
        body += `| \`${r.name}\` | ${r.reason ?? 'Unknown error'} |\n`;
      }
      body += '\n';
    }
  }

  body += `---\n\n## Pre-merge checklist\n\n- [ ] CI passes (lint, unit tests, build, E2E)\n- [ ] Reviewed the "Packages Requiring Manual Attention" section above\n- [ ] \`yarn.lock\` changes look as expected (no unrelated major version jumps)\n\n`;
  body += `---\n\n_Auto-generated by the [automated-security-dep-update](${runUrl}) workflow · ${date}_\n`;

  return body;
}

function buildFailureReport(results: PackageResult[], date: string): string {
  const runUrl = workflowRunUrl();
  const updated = results.filter((r) => r.status === 'updated');

  let body = `## Automated Security Dependency Update — Failed (${date})

The [automated-security-dep-update](${runUrl}) workflow ran on ${date} but **could not open a PR** because one or more validation steps failed. No branch was pushed.

**Workflow run (full logs):** ${runUrl}

---

## Packages Attempted

`;

  if (updated.length === 0) {
    body += '_No packages were updated before the failure._\n\n';
  } else {
    body += '| Package | Old Version | New Version | Advisory ID(s) |\n';
    body += '|---------|------------|------------|----------------|\n';
    for (const r of updated) {
      body += `| \`${r.name}\` | \`${r.oldVersion ?? '?'}\` | \`${r.newVersion ?? '?'}\` | ${r.advisoryIds.join(', ') || '—'} |\n`;
    }
    body += '\n';
  }

  // Workflow will append step outcomes after this marker
  body += `---\n\n`;

  body += `## How to Investigate\n\n1. Open the [workflow run](${runUrl}) and click the failing step to see the full log\n2. Cross-reference the failing step with the "Packages Attempted" table above — the most recently updated package is the likely culprit\n3. To retry without a specific package, edit the script's skip list or revert that package's \`yarn up\` change\n4. Trigger a fresh run via \`workflow_dispatch\` once the issue is resolved\n\n`;
  body += `---\n\n_Auto-generated by the [automated-security-dep-update](${runUrl}) workflow · ${date}_\n`;

  return body;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  mkdirSync('.tmp', { recursive: true });

  const date = new Date().toISOString().split('T')[0] ?? 'unknown';
  const dryRun = process.env.DRY_RUN === 'true';

  if (dryRun) {
    console.log('🔍 DRY RUN — vulnerabilities will be detected and reported but NO packages will be updated.\n');
  }

  const pkgJson = JSON.parse(
    readFileSync('package.json', 'utf8'),
  ) as PackageJson;

  const patchedPackages = getPatchedPackages(pkgJson);
  const ignoredIds = getIgnoredAdvisoryIds();

  console.log(
    `Patched packages (skipped): ${[...patchedPackages].join(', ') || 'none'}`,
  );
  console.log(
    `Ignored advisory IDs:       ${[...ignoredIds].join(', ') || 'none'}`,
  );

  // Run audit
  const allEntries = runAudit();

  if (allEntries.length === 0) {
    console.log('\n✅ No vulnerabilities found. Nothing to do.');
    core.setOutput('packages_updated', '0');
    core.setOutput('update_summary', 'No vulnerable packages found.');
    writeStepSummary('## ✅ No vulnerabilities found\n\nThe `yarn npm audit` found no moderate+ severity production advisories.\n');
    return;
  }

  // Group advisories by package name
  const byModule = new Map<string, AuditEntry[]>();
  for (const entry of allEntries) {
    const existing = byModule.get(entry.moduleName) ?? [];
    existing.push(entry);
    byModule.set(entry.moduleName, existing);
  }

  // Remove packages whose only remaining advisories are in the ignore list
  for (const [name, entries] of byModule.entries()) {
    const active = entries.filter(
      (e) => e.id === null || !ignoredIds.has(e.id),
    );
    if (active.length === 0) {
      byModule.delete(name);
    } else {
      byModule.set(name, active);
    }
  }

  console.log(
    `\nActive vulnerable packages (after filtering ignored): ${byModule.size}`,
  );

  if (byModule.size === 0) {
    console.log('All found advisories are in the ignore list. Nothing to do.');
    core.setOutput('packages_updated', '0');
    core.setOutput(
      'update_summary',
      'All vulnerabilities are in the .yarnrc.yml ignore list.',
    );
    writeStepSummary(
      '## ✅ No actionable vulnerabilities\n\nAll advisories found by `yarn npm audit` are in the `npmAuditIgnoreAdvisories` ignore list in `.yarnrc.yml`.\n',
    );
    return;
  }

  const results: PackageResult[] = [];

  for (const [name, entries] of byModule.entries()) {
    const advisoryIds = [
      ...new Set(
        entries
          .map((e) => e.id)
          .filter((id): id is number => id !== null),
      ),
    ];
    const advisoryTitles = [...new Set(entries.map((e) => e.title))];
    const advisoryUrls = [
      ...new Set(entries.map((e) => e.url).filter(Boolean)),
    ];

    console.log(`\nProcessing: ${name}`);

    // Skip packages with a local patch
    if (patchedPackages.has(name)) {
      console.log(`  ⚠️  Skipping — has a .yarn/patches/ patch applied`);
      results.push({
        name,
        oldVersion: getInstalledVersion(name),
        newVersion: null,
        status: 'skipped-patched',
        advisoryIds,
        advisoryTitles,
        advisoryUrls,
        reason:
          'Has a `.yarn/patches/` patch applied — requires manual update to avoid breaking the patch',
      });
      continue;
    }

    const oldVersion = getInstalledVersion(name);
    console.log(
      `  Installed version: ${oldVersion ?? '(not found in node_modules)'}`,
    );

    if (!oldVersion) {
      console.log(`  ⚠️  Cannot determine installed version — skipping`);
      results.push({
        name,
        oldVersion: null,
        newVersion: null,
        status: 'failed',
        advisoryIds,
        advisoryTitles,
        advisoryUrls,
        reason:
          'Could not determine installed version from node_modules — package may be transitive-only or not installed',
      });
      continue;
    }

    const currentMajor = semver.major(oldVersion);

    if (dryRun) {
      console.log(
        `  DRY RUN — would run: yarn up "${name}@^${currentMajor}"`,
      );
      // In dry run we record the current state for the report without updating
      results.push({
        name,
        oldVersion,
        newVersion: '(dry run — not updated)',
        status: 'updated',
        advisoryIds,
        advisoryTitles,
        advisoryUrls,
        reason: 'DRY RUN — no changes applied',
      });
      continue;
    }

    // Attempt patch/minor update, constrained to the current major
    // `yarn up "pkg@^M"` resolves to the latest M.x.x satisfying any existing
    // package.json range. The `^M` constraint prevents unintentional major bumps.
    const upgradeCmd = `yarn up "${name}@^${currentMajor}"`;
    console.log(`  Running: ${upgradeCmd}`);
    const { ok, output } = run(upgradeCmd, { silent: true });

    if (!ok) {
      console.log(`  ❌ yarn up failed`);
      results.push({
        name,
        oldVersion,
        newVersion: null,
        status: 'failed',
        advisoryIds,
        advisoryTitles,
        advisoryUrls,
        reason: `\`yarn up\` exited non-zero: ${output.slice(0, 300)}`,
      });
      continue;
    }

    const newVersion = getInstalledVersion(name);

    if (!newVersion || newVersion === oldVersion) {
      // Version unchanged — already at the latest patch/minor in this major.
      // The CVE fix may only be available in a new major version.
      console.log(
        `  ℹ️  Version unchanged (${oldVersion}) — fix may require a major bump`,
      );
      results.push({
        name,
        oldVersion,
        newVersion: null,
        status: 'skipped-major',
        advisoryIds,
        advisoryTitles,
        advisoryUrls,
        reason: `Already at latest v${currentMajor}.x.x — the CVE fix may only be available in v${currentMajor + 1}+`,
      });
      continue;
    }

    console.log(`  ✅ ${oldVersion} → ${newVersion}`);
    results.push({
      name,
      oldVersion,
      newVersion,
      status: 'updated',
      advisoryIds,
      advisoryTitles,
      advisoryUrls,
    });
  }

  // Count real updates (excluding dry-run placeholders)
  const updatedCount = dryRun
    ? 0
    : results.filter((r) => r.status === 'updated').length;

  // Write reports
  const prBody = buildPrBody(results, date);
  const failureReport = buildFailureReport(results, date);

  writeFileSync('.tmp/pr-body.md', prBody, 'utf8');
  writeFileSync('.tmp/failure-report.md', failureReport, 'utf8');

  // Write step summary (visible in GitHub Actions UI)
  writeStepSummary(prBody);

  // Print summary
  console.log('\n=== Update Summary ===');
  console.log(
    `  Updated:                   ${results.filter((r) => r.status === 'updated').length}`,
  );
  console.log(
    `  Skipped (patched):         ${results.filter((r) => r.status === 'skipped-patched').length}`,
  );
  console.log(
    `  Skipped (major bump only): ${results.filter((r) => r.status === 'skipped-major').length}`,
  );
  console.log(
    `  Failed:                    ${results.filter((r) => r.status === 'failed').length}`,
  );

  core.setOutput('packages_updated', String(updatedCount));
  core.setOutput(
    'update_summary',
    `Updated ${updatedCount} package(s) to fix CVEs; ` +
      `${results.filter((r) => r.status === 'skipped-patched').length} patched package(s) skipped (manual attention needed); ` +
      `${results.filter((r) => r.status === 'skipped-major').length} require major bumps`,
  );
}

main().catch((error: unknown) => {
  console.error('Fatal error in security-dep-update script:', error);
  process.exit(1);
});
