#!/usr/bin/env tsx
/**
 * Generates an exploratory regression test plan MD document for a release branch.
 *
 * Release branches follow the format release/X.Y.Z; the release PR is against `stable`,
 * so the baseline is `stable` by default. The plan lists what gets incorporated into
 * this release (diff vs stable) and how to verify it.
 *
 * Reads CHANGELOG.md for the release version, extracts PRs, groups them by focus area,
 * and outputs a structured test plan that anyone can use to verify the release.
 *
 * Usage:
 *   yarn generate:release-test-plan --release-branch=release/13.18.0
 *   yarn generate:release-test-plan --release-branch=release/13.18.0 --output=docs/exploratory-testing-plan-13.18.0.md
 *
 * Options:
 *   --release-branch  Optional. Branch name, e.g. release/13.18.0. Default: latest release branch from origin.
 *   --baseline        Optional. Baseline branch to compare (default: stable). The release PR targets stable.
 *   --output          Optional. Output path. Default: docs/exploratory-testing-plan-<version>.md
 *   --no-changelog    Optional. Skip CHANGELOG; only use git merge commits (fallback).
 *   --print-prompt    Optional. After writing the draft, print the AI agent prompt so an agent can expand the draft into a full test plan.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO_ROOT = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, 'docs');
/** Release PRs are opened against this branch; we compare release/X.Y.Z to this to see what's incorporated. */
const DEFAULT_BASELINE = 'stable';

// Focus areas and keywords (case-insensitive) to group PRs. First match wins.
const FOCUS_AREAS: Array<{ name: string; keywords: string[] }> = [
  { name: 'Swaps / Bridge', keywords: ['swap', 'bridge', 'quote', 'mm fee', 'getToken'] },
  { name: 'Perps', keywords: ['perps', 'perps order', 'tx history for perps'] },
  { name: 'Predictions', keywords: ['prediction', 'predict'] },
  {
    name: 'Mobile Core UX',
    keywords: [
      'dapp connection',
      'modal',
      'cancel/speedup',
      'edit gas',
      'edit-gas-fee',
      'activity log',
      'SRP',
      'webcam',
      'sidepanel',
      'withRouterHooks',
      'MetaMetrics context',
      'constrained max width',
    ],
  },
  {
    name: 'Assets',
    keywords: [
      'asset',
      'nft',
      'token detail',
      'token list',
      'polling',
      'assets-controller',
      'deeplink',
      'nft tab',
      'Tempo',
      'testnet',
      'container based nft',
      'swap activity',
      'nft tab picker',
    ],
  },
];

interface ChangelogEntry {
  prNumber: number;
  description: string;
  category: 'Added' | 'Changed' | 'Fixed' | 'Other';
}

/** Returns the latest release branch (release/X.Y.Z) from origin, or empty string if none or git fails. */
function resolveLatestReleaseBranch(): string {
  let out: string;
  try {
    // Use refspec to list only release/* branches and avoid ENOBUFS with large repos
    out = execSync("git ls-remote origin 'refs/heads/release/*'", {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
      maxBuffer: 512 * 1024,
      shell: true,
    });
  } catch {
    return '';
  }
  const re = /refs\/heads\/(release\/\d+\.\d+\.\d+)$/gm;
  const branches: string[] = [];
  let m: RegExpMatchArray | null;
  while ((m = re.exec(out)) !== null) {
    branches.push(m[1]);
  }
  if (branches.length === 0) return '';
  branches.sort((a, b) => {
    const va = a.replace(/^release\//, '').split('.').map(Number);
    const vb = b.replace(/^release\//, '').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const na = va[i] ?? 0;
      const nb = vb[i] ?? 0;
      if (na !== nb) return na - nb;
    }
    return 0;
  });
  return branches[branches.length - 1];
}

const PROMPT_FILE_RELATIVE = 'docs/prompts/release-test-plan-agent.md';

function parseArgs(): {
  releaseBranch: string;
  baseline: string | null;
  outputPath: string;
  useChangelog: boolean;
  printPrompt: boolean;
} {
  const args = process.argv.slice(2);
  let releaseBranch = '';
  let baseline: string | null = null;
  let outputPath = '';
  let useChangelog = true;
  let printPrompt = false;

  for (const arg of args) {
    if (arg.startsWith('--release-branch=')) {
      releaseBranch = arg.slice('--release-branch='.length).trim();
    } else if (arg.startsWith('--baseline=')) {
      baseline = arg.slice('--baseline='.length).trim() || null;
    } else if (arg.startsWith('--output=')) {
      outputPath = arg.slice('--output='.length).trim();
    } else if (arg === '--no-changelog') {
      useChangelog = false;
    } else if (arg === '--print-prompt') {
      printPrompt = true;
    }
  }

  if (!releaseBranch) {
    releaseBranch = resolveLatestReleaseBranch();
    if (!releaseBranch) {
      console.error('Could not resolve latest release branch from origin (no release/X.Y.Z branches found).');
    }
  }
  if (!releaseBranch || !/^release\/\d+\.\d+\.\d+$/.test(releaseBranch)) {
    console.error(
      'Usage: yarn generate:release-test-plan [--release-branch=release/X.Y.Z] [--baseline=branch] [--output=path] [--no-changelog]',
    );
    console.error(
      '  --release-branch defaults to the latest release branch on origin. Baseline defaults to stable.',
    );
    process.exit(1);
  }

  const version = releaseBranch.replace(/^release\//, '');
  if (!outputPath) {
    outputPath = path.join(DEFAULT_OUTPUT_DIR, `exploratory-testing-plan-${version}.md`);
  } else if (!path.isAbsolute(outputPath)) {
    outputPath = path.resolve(REPO_ROOT, outputPath);
  }

  if (baseline === null) {
    baseline = DEFAULT_BASELINE;
  }

  return { releaseBranch, baseline, outputPath, useChangelog, printPrompt };
}

/**
 * Extract version section from CHANGELOG (from "## [X.Y.Z]" until next "## [").
 */
function extractChangelogSection(changelogContent: string, version: string): string | null {
  const exactHeader = `## [${version}]`;
  const idx = changelogContent.indexOf(exactHeader);
  if (idx === -1) return null;

  const start = idx + exactHeader.length;
  const nextSection = changelogContent.indexOf('\n## [', start);
  const end = nextSection === -1 ? changelogContent.length : nextSection;
  return changelogContent.slice(start, end).trim();
}

const ENTRY_REGEX = /^-\s+(.+?)\s+\(#(\d+)\)\s*$/;

function parseChangelogEntries(section: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentCategory: ChangelogEntry['category'] = 'Other';

  for (const line of section.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### Added')) {
      currentCategory = 'Added';
      continue;
    }
    if (trimmed.startsWith('### Changed')) {
      currentCategory = 'Changed';
      continue;
    }
    if (trimmed.startsWith('### Fixed')) {
      currentCategory = 'Fixed';
      continue;
    }
    if (trimmed.startsWith('### ')) {
      currentCategory = 'Other';
      continue;
    }
    const match = trimmed.match(ENTRY_REGEX);
    if (match) {
      entries.push({
        description: match[1].trim(),
        prNumber: parseInt(match[2], 10),
        category: currentCategory,
      });
    }
  }
  return entries;
}

function assignFocusArea(entry: ChangelogEntry): string {
  const text = `${entry.description}`.toLowerCase();
  for (const area of FOCUS_AREAS) {
    if (area.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return area.name;
    }
  }
  return 'Other / General';
}

function getPrsFromGit(releaseBranch: string, baseline: string | null): Array<{ pr: number; title?: string }> {
  const range = baseline ? `${baseline}..${releaseBranch}` : releaseBranch;
  let out: string;
  try {
    out = execSync(`git log ${range} --merges --pretty=format:"%s"`, {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
    });
  } catch {
    return [];
  }
  const prs: Array<{ pr: number; title?: string }> = [];
  const mergeRe = /Merge pull request #(\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mergeRe.exec(out)) !== null) {
    const num = parseInt(m[1], 10);
    if (!prs.some((p) => p.pr === num)) {
      prs.push({ pr: num });
    }
  }
  return prs;
}

interface BuildDocOpts {
  version: string;
  releaseBranch: string;
  baseline: string | null;
  entries: ChangelogEntry[];
  gitPrs: Array<{ pr: number; title?: string }>;
  useChangelog: boolean;
}

function buildDoc(opts: BuildDocOpts): string {
  const { version, releaseBranch, baseline, entries, gitPrs, useChangelog } = opts;

  const byArea = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const area = assignFocusArea(e);
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area)!.push(e);
  }

  // Ensure all focus areas appear even if empty
  for (const area of FOCUS_AREAS) {
    if (!byArea.has(area.name)) byArea.set(area.name, []);
  }
  if (!byArea.has('Other / General')) byArea.set('Other / General', []);

  const repo = 'https://github.com/MetaMask/metamask-extension';
  const prLink = (num: number) => `[#${num}](${repo}/pull/${num})`;

  const lines: string[] = [
    `# Exploratory Test Plan - Release ${version} (branch ${releaseBranch})`,
    '',
    '## Inputs reviewed',
    `- Release branch: origin/${releaseBranch}`,
    `- Comparison baseline: origin/${baseline} (release PR target; this plan lists what is incorporated into ${version})`,
    useChangelog ? '- Sources: CHANGELOG and optional git merge commits' : '- Sources: git merge commits only',
    '',
    '## PR inventory by focus area',
    '',
  ];

  const areaOrder = FOCUS_AREAS.map((a) => a.name).concat(['Other / General']);
  for (const areaName of areaOrder) {
    const list = byArea.get(areaName) ?? [];
    lines.push(`### ${areaName}`);
    if (list.length === 0) {
      lines.push('- No PRs in this release explicitly mapped to this area. Consider regression testing if relevant.');
    } else {
      for (const e of list) {
        lines.push(`- ${prLink(e.prNumber)} - ${e.description}`);
      }
    }
    lines.push('');
  }

  lines.push(
    '## Test setup and data',
    '',
    '- Build target: Chrome MV3 release branch build.',
    '- Accounts: one account with ERC-20 balance, one account with NFT, and one clean account.',
    '- Networks: Ethereum mainnet, a test RPC, and any new networks added in this release.',
    '- Feature flags: enable any flags required by new features (e.g. Perps) via `.manifest-overrides.json` if needed.',
    '- Deep link tests: use signed and unsigned links with `link.metamask.io` where applicable.',
    '',
    '## Exploratory charters',
    '',
    '_Add charters per focus area below. Use the PR descriptions above to define what to verify._',
    '',
  );

  for (const areaName of areaOrder) {
    const list = byArea.get(areaName) ?? [];
    lines.push(`### ${areaName}`);
    if (list.length === 0) {
      lines.push('1. (Regression) Verify existing behavior still works in this area.');
    } else {
      lines.push(
        '1. _Charter 1:_ Focus on PRs: ' +
          list.map((e) => '#' + e.prNumber).join(', ') +
          ' — verify [describe main scenario].',
      );
      lines.push('2. _Charter 2:_ Edge cases and failure modes (e.g. empty state, errors, popup/sidepanel).');
    }
    lines.push('');
  }

  lines.push(
    '## Exit criteria',
    '',
    '- No P0/P1 defects in scoped areas.',
    '- All new PR-related behaviors verified in at least one target view (popup, sidepanel, or full window).',
    '- Any regressions recorded with repro steps and screenshots.',
    '',
  );

  if (gitPrs.length > 0 && useChangelog && gitPrs.length !== entries.length) {
    const changelogPrs = new Set(entries.map((e) => e.prNumber));
    const onlyInGit = gitPrs.filter((p) => !changelogPrs.has(p.pr));
    if (onlyInGit.length > 0) {
      lines.push('## PRs in branch not found in CHANGELOG (verify manually)');
      lines.push('');
      for (const p of onlyInGit) {
        lines.push('- ' + prLink(p.pr));
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function main(): void {
  const { releaseBranch, baseline, outputPath, useChangelog, printPrompt } = parseArgs();
  const version = releaseBranch.replace(/^release\//, '');

  let entries: ChangelogEntry[] = [];
  if (useChangelog) {
    const changelogContent = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const section = extractChangelogSection(changelogContent, version);
    if (section) {
      entries = parseChangelogEntries(section);
    }
  }

  const gitPrs = getPrsFromGit(releaseBranch, baseline);
  if (entries.length === 0 && gitPrs.length > 0) {
    // Fallback: create minimal entries from git PR numbers so they appear in "Other"
    for (const p of gitPrs) {
      entries.push({
        prNumber: p.pr,
        description: p.title ?? 'PR #' + p.pr + ' (see GitHub)',
        category: 'Other',
      });
    }
  }

  const doc = buildDoc({
    version,
    releaseBranch,
    baseline,
    entries,
    gitPrs,
    useChangelog,
  });

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, doc, 'utf-8');
  console.log('Wrote: ' + outputPath);
  console.log(
    '  Version: ' +
      version +
      ', PRs from CHANGELOG: ' +
      entries.length +
      ', from git: ' +
      gitPrs.length,
  );

  if (printPrompt) {
    const promptPath = path.join(REPO_ROOT, PROMPT_FILE_RELATIVE);
    if (fs.existsSync(promptPath)) {
      console.log('\n--- AI agent prompt (use with the draft to generate full charters) ---');
      console.log('Draft file: ' + outputPath);
      console.log('Prompt file: ' + promptPath + '\n');
      console.log(fs.readFileSync(promptPath, 'utf-8'));
    } else {
      console.error('Prompt file not found: ' + promptPath);
    }
  }
}

main();
