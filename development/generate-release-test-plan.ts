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
      shell: process.env.SHELL || '/bin/sh',
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

/**
 * Suggest specific verification steps for a charter based on the PR description.
 * Returns 1–3 bullets tailored to what changed; avoids generic "verify in popup/full window" for everything.
 */
function suggestCharterSteps(description: string): string[] {
  const d = description.toLowerCase();
  // Order matters: more specific first
  if ((d.includes('quote') || d.includes('restore')) && (d.includes('popup') || d.includes('bridge'))) {
    return [
      'Open swap/bridge in popup, fill From/To, get quote, close popup, reopen; verify quote is restored.',
      'In full window, get quote then navigate away and back; verify quote is not restored (expected).',
    ];
  }
  if (d.includes('fee disclaimer') || (d.includes('mm fee') && d.includes('swap'))) {
    return [
      'Get a quote with MM fee and one without; verify disclaimer is shown only when fee > 0.',
      'Change amount or tokens to re-quote; verify disclaimer updates correctly and does not flicker.',
    ];
  }
  if (d.includes('cache') && (d.includes('bridge') || d.includes('gettoken'))) {
    return [
      'Search tokens across multiple networks and switch networks; verify token metadata is correct and not mixed across networks.',
      'Rapidly switch networks and search again; confirm no stale or wrong-network data.',
    ];
  }
  if (d.includes('swap') && (d.includes('activity') || d.includes('token detail'))) {
    return [
      'Perform a swap, then open the source and destination token detail pages; verify the swap appears in the Activity list with correct type and amounts.',
      'Check ordering and timestamps; repeat with send/receive and confirm all activity types show.',
    ];
  }
  if (d.includes('perps') && (d.includes('history') || d.includes('transaction'))) {
    return [
      'With Perps enabled, open Perps activity/history; verify empty state when no txs, and correct list when there are txs.',
      'Check pagination/scroll, ordering, and that row details match the list.',
    ];
  }
  if (d.includes('perps') && (d.includes('order') || d.includes('entry'))) {
    return [
      'Open a Perps market detail; verify order entry UI (Long/Short, amount, leverage) and that invalid inputs show validation errors.',
      'Switch between Long and Short and between markets; confirm UI resets and no stale values.',
    ];
  }
  if (d.includes('perps') && (d.includes('home') || d.includes('market') || d.includes('candlestick') || d.includes('list'))) {
    return [
      'With Perps flag on, open Perps home and market list; verify list loads, search/filter work, and market detail opens.',
      'Verify candlestick/placeholder and navigation back to list and home in popup and full window.',
    ];
  }
  if ((d.includes('cancel') && d.includes('speedup')) || (d.includes('edit gas') && d.includes('modal'))) {
    return [
      'Open cancel or speedup modal and edit gas fee modal; verify layout, focus trap, and that Escape/close work.',
      'Test in popup and sidepanel; confirm no black backgrounds or layout overflow.',
    ];
  }
  if (d.includes('activity log') && (d.includes('header') || d.includes('disclosure'))) {
    return [
      'Open activity log and use the header control (arrow disclosure); verify expand/collapse and keyboard navigation.',
      'Check hover states and that the control is tappable in narrow viewports.',
    ];
  }
  if (d.includes('srp') && (d.includes('validation') || d.includes('import'))) {
    return [
      'During SRP import, try invalid formats, extra whitespace, mixed case, and partial entry; verify validation messages and that invalid SRP is rejected.',
      'Confirm valid SRP still imports successfully.',
    ];
  }
  if (d.includes('webcam') || (d.includes('camera') && d.includes('sidepanel'))) {
    return [
      'Trigger the hardware wallet scan (camera) flow in sidepanel; verify permission prompt and that camera works.',
      'Repeat in popup if supported; confirm no crash when switching view.',
    ];
  }
  if (d.includes('dapp connection') || (d.includes('constrained') && d.includes('width'))) {
    return [
      'Open Dapp Connections (or connected sites) in sidepanel, popup, and full window; verify content is constrained and readable, no horizontal overflow.',
      'Check that controls and list items are usable in narrow width.',
    ];
  }
  if (d.includes('polling') && (d.includes('asset') || d.includes('balance'))) {
    return [
      'After an incoming transfer, verify asset/balance updates without manual refresh; switch accounts and confirm balances update.',
      'Check token list and token details reflect the new state.',
    ];
  }
  if (d.includes('clickable') && (d.includes('asset') || d.includes('control'))) {
    return [
      'On the asset list control bar (network, sort, close), tap the close/filter controls near the edges; verify they respond (larger hit area).',
      'Test in popup and sidepanel; confirm no mis-taps on adjacent elements.',
    ];
  }
  if (d.includes('deeplink') && d.includes('nft')) {
    return [
      'Use a deep link to the NFT tab; verify the NFT tab is selected and scroll position is correct.',
      'Test signed and unsigned links; confirm navigation and params are preserved.',
    ];
  }
  if (d.includes('nft') && (d.includes('grid') || d.includes('container'))) {
    return [
      'Resize extension (popup/sidepanel) and verify NFT grid column count and layout adapt correctly.',
      'Confirm no horizontal scroll or overlapping items.',
    ];
  }
  if (d.includes('tooltip') && (d.includes('gas') || d.includes('alignment') || d.includes('overlap'))) {
    return [
      'Open edit gas / gas option tooltips; verify alignment, values, and that tooltip does not overlap filter or other controls.',
      'Check arrow and gradient colors match; test in popup and full window.',
    ];
  }
  if (d.includes('subscription') && (d.includes('polling') || d.includes('locked'))) {
    return [
      'With wallet locked or window/sidepanel inactive, verify subscription or polling behavior (e.g. no unnecessary requests or errors).',
      'Unlock or focus the window and confirm updates resume as expected.',
    ];
  }
  if (d.includes('switch to infura') || (d.includes('one-click') && d.includes('network'))) {
    return [
      'Add or use a custom network with connectivity issues; verify the "Switch to Infura" (or one-click fix) button appears and works.',
      'Confirm network works after switching and that explorer/RPC are updated.',
    ];
  }
  if (d.includes('rpc') || (d.includes('explorer') && d.includes('url'))) {
    return [
      'For the affected network(s), verify RPC and explorer URLs are correct; add network or refresh and confirm chain works.',
      'Check explorer links from the UI open the right block explorer.',
    ];
  }
  if (d.includes('copy') && (d.includes('network') || d.includes('avatar'))) {
    return [
      'On the home screen network avatar group, use the Copy icon; verify it copies the expected value (e.g. address or network info).',
      'Confirm icon is visible and tappable in popup and sidepanel.',
    ];
  }
  if (d.includes('fiat') && (d.includes('non-ethereum') || d.includes('all network'))) {
    return [
      'View activity or balances with "all networks" or a non-Ethereum chain; verify fiat amounts are correct and not wrong-chain values.',
      'Switch chains and confirm amounts update correctly.',
    ];
  }
  if (d.includes('memory') && d.includes('dapp')) {
    return [
      'Visit several dapps and leave extension open; verify memory usage does not grow unbounded over time.',
      'Close and reopen extension; confirm no degradation after multiple dapp visits.',
    ];
  }
  if (d.includes('performance') || (d.includes('memoization') && d.includes('selector'))) {
    return [
      'Perform common actions (confirmations, nav, switching accounts); verify UI remains responsive with no noticeable slowdown.',
      'Check that repeated actions (e.g. opening confirmations list) do not get slower.',
    ];
  }
  if (d.includes('shortid') || d.includes('short id')) {
    return [
      'In the relevant UI, verify the shortId (or shortened ID) is shown instead of the full long ID.',
      'Confirm copy or detail view still allows access to full ID if needed.',
    ];
  }
  if (d.includes('back arrow') || (d.includes('icon') && d.includes('nft detail'))) {
    return [
      'On NFT details, asset details, and DeFi detail pages, verify back arrow icon color and visibility.',
      'Confirm back navigation works from each page.',
    ];
  }
  if (d.includes('smart transaction') || d.includes('smart-transactions')) {
    return [
      'Verify swap or transaction flow uses the new smart transactions flag from remote config where applicable.',
      'Test with flag on/off if possible; confirm no regression in swap or tx submission.',
    ];
  }
  if (d.includes('utxo') && d.includes('swap')) {
    return [
      'Perform a full swap that involves change/UTXO; verify change is dropped or handled as described and swap completes.',
      'Check balance and activity after the swap.',
    ];
  }
  if (d.includes('snap') && (d.includes('account') || d.includes('dialog') || d.includes('error'))) {
    return [
      'In the Snap account creation or error flow, verify the changed behavior (e.g. no account name dialog, or InsufficientBalanceToFee response).',
      'Confirm Snap install/update and account creation still work end-to-end.',
    ];
  }
  if (d.includes('confirmations') || d.includes('cta copy')) {
    return [
      'On a confirmation screen, verify the CTA button copy and styling match the change.',
      'Complete a confirmation and confirm flow still succeeds.',
    ];
  }
  if (d.includes('transaction list') || d.includes('dynamic height')) {
    return [
      'Scroll the transaction/activity list; verify item height and layout (e.g. dynamic height) and that list scrolls correctly.',
      'Check in popup and full window; confirm no cut-off or overlap.',
    ];
  }
  if (d.includes('appactivetab') || d.includes('dapp url')) {
    return [
      'With a dapp open, verify extension or confirmations use the correct active tab/dapp URL.',
      'Switch tabs and confirm behavior updates as expected.',
    ];
  }
  if (d.includes('add button') || d.includes('+ icon')) {
    return [
      'Locate the updated add button / + icon in the UI; verify it is visible and opens the expected action.',
      'Confirm in popup and sidepanel layout.',
    ];
  }
  if (d.includes('onboarding') || d.includes('srp') && (d.includes('background') || d.includes('chip'))) {
    return [
      'Run onboarding or SRP import and verify card background colors and SRP chips/text inputs match the update.',
      'Confirm flow remains usable and readable.',
    ];
  }
  if (d.includes('sentry') || d.includes('storage') || d.includes('database corruption')) {
    return [
      'Verify extension runs normally; if possible trigger an error path and confirm Sentry or error reporting behaves as described.',
      'No mandatory user-facing test; focus on regression of normal flows.',
    ];
  }
  if (d.includes('permission') && d.includes('rpc')) {
    return [
      'Call wallet_getSupportedExecutionPermissions and wallet_getGrantedExecutionPermissions from a dapp; verify response format and granted permissions.',
      'Grant/revoke and confirm values update.',
    ];
  }
  // Default: still specific to "the change" but generic wording
  return [
    'Verify the change in popup, full window, and sidepanel where relevant.',
    'Check edge cases and error paths; confirm no regression in related flows.',
  ];
}

/** Fetch refs from origin so git log can run when running in a clone that doesn't have them locally. */
function fetchRefsIfNeeded(baseline: string | null, releaseBranch: string): void {
  const refs = [releaseBranch];
  if (baseline) refs.push(baseline);
  try {
    execSync('git fetch origin ' + refs.join(' '), {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    // Network or permission issue; getPrsFromGit will still try git log (may fail)
  }
}

function getPrsFromGit(releaseBranch: string, baseline: string | null): Array<{ pr: number; title?: string }> {
  fetchRefsIfNeeded(baseline, releaseBranch);
  // Use origin/ refs so we see fetched branches when not on release branch
  const range = baseline
    ? `origin/${baseline}..origin/${releaseBranch}`
    : `origin/${releaseBranch}`;
  let out: string;
  try {
    out = execSync(`git log ${range} --merges --pretty=format:"%s"`, {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
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
  );

  for (const areaName of areaOrder) {
    const list = byArea.get(areaName) ?? [];
    lines.push(`### ${areaName}`);
    if (list.length === 0) {
      lines.push('1. **Regression** – Verify existing behavior still works in this area (flows, deep links, related UI).');
    } else {
      list.forEach((e, idx) => {
        const num = idx + 1;
        lines.push(`${num}. **${e.description}** ${prLink(e.prNumber)}`);
        const steps = suggestCharterSteps(e.description);
        steps.forEach((step) => lines.push('   - ' + step));
      });
      lines.push(
        (list.length + 1) + '. **Edge cases and failure modes** – Empty state, errors, timeouts; test in popup, sidepanel, and full window.',
      );
    }
    lines.push('');
  }

  lines.push(
    '## Exit criteria',
    '',
    '_These are acceptance conditions for the release. The tester verifies them by running the charters above, logging any defects (with severity P0/P1/P2), and not signing off until P0/P1 in scoped areas are fixed or accepted. The document does not enforce them automatically._',
    '',
    '- No P0/P1 defects in scoped areas (open or unresolved).',
    '- All new PR-related behaviors verified in at least one target view (popup, sidepanel, or full window).',
    '- Any regressions recorded with repro steps and screenshots (e.g. in issue tracker).',
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
