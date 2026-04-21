/**
 * Collects QA metrics into a qa-stats.json file, key: value format.
 * Metrics that could not be collected (missing artifacts, tests did not run)
 * are omitted from the output, i.e., they will not appear in the output file.
 *
 * Downstream (e.g. Grafana / TSDB) keys metrics by (project, run_id, namespace, metric_key).
 * Do not rename existing metric keys once published — renaming creates a new time series and
 * breaks dashboard continuity. Adding or removing keys is fine.
 *
 * Required env vars:
 *   GITHUB_TOKEN      — GitHub Actions token for API access
 *   GITHUB_REPOSITORY — Repository in "owner/repo" format (set automatically in Actions)
 *   RUN_ID_TO_COLLECT — (optional, for local testing)
 *
 * How to add a new metrics:
 *   1. Add a collector function that returns any of the following:
 *      {
 *        "key1": number,
 *        "key2": "string",
 *        "key3": "[\"string1\", \"string2\", ...]",
 *      }
 *   2. Register it as a new namespace in the collectors array in main()
 *
 * The `metametrics` namespace is populated by a static scan of E2E sources (see
 * collect-qa-stats-metametrics.ts): `metametrics_events_checked_unique_count` and
 * `metametrics_events_checked_names_json` must keep stable names for observability pipelines.
 *
 * Example output:
 *   {
 *     "unit": {
 *       "total_tests_run": 41957,
 *       "total_tests_skipped": 120,
 *     },
 *     "integration": {
 *       "total_tests_run": 540,
 *       "total_tests_skipped": 2,
 *       "total_tests_defined": 510,
 *       "accounts_tests_run": 90,
 *       "other_tests_run": 450
 *     },
 *     "e2e": {
 *       "total_tests_run": 1400,
 *       "total_tests_skipped": 5,
 *       "total_tests_defined": 1280,
 *       "main_tests_run": 1200,
 *       "main_chrome_tests_run": 1200,
 *       "main_firefox_tests_run": 1185,
 *       "flask_tests_run": 200
 *     },
 *     "metametrics": {
 *       "metametrics_events_checked_unique_count": 42,
 *       "metametrics_events_checked_names_json": "[\"Dapp Viewed\", ...]"
 *     }
 *   }
 */

import { collectE2EMetaMetricsEventCoverage } from './collect-qa-stats-metametrics';
import { PATTERN_E2E_SPEC_FILE, walkFiles } from './collect-qa-stats-walk-files';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { execFileSync } from 'child_process';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GitHubArtifact = {
  id: number;
  name: string;
  archive_download_url: string;
};

type GitHubWorkflowRun = {
  id: number;
  run_number: number;
  created_at: string;
};

type JUnitParseResult = {
  total: number;
  skipped: number;
  perFile: Record<string, number>;
};

type ScanResult = {
  defined: number;
};

type TestFile = {
  path?: string;
  tests?: number;
  skipped?: number;
};

type TestRun = {
  name: string;
  testFiles?: TestFile[];
};

type Collector = {
  namespace: string;
  collect: () => Promise<Record<string, number | string>>;
};

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const rawToken = process.env.GITHUB_TOKEN;
if (!rawToken) throw new Error('Missing required GITHUB_TOKEN env var');
const GITHUB_TOKEN: string = rawToken;

const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

// ---------------------------------------------------------------------------
// Static-scan targets
// Update these if the repository directory structure or file-naming conventions
// change — the collectors below rely on them for skip/defined counts.
// ---------------------------------------------------------------------------
const SCAN_UNIT_DIRS = [
  'ui',
  'app',
  'shared',
  'development',
  'test/unit-global',
];
const SCAN_INTEGRATION_DIR = 'test/integration';
const SCAN_E2E_DIR = 'test/e2e';

const PATTERN_UNIT_TEST_FILE = /\.test\.(ts|tsx|js|jsx)$/u;

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

let _runId: string | null = null;
let _artifactList: GitHubArtifact[] | null = null;

/**
 * Fetches the ID of the latest successful "Main" workflow run on `main`.
 */
async function getLatestMainRunId(): Promise<string> {
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/main.yml/runs?branch=main&status=success&per_page=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Main workflow runs: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    workflow_runs?: GitHubWorkflowRun[];
  };
  const run = data.workflow_runs?.[0];
  if (!run) {
    throw new Error('No successful Main workflow runs found on main');
  }

  console.log(
    `[run] Using latest successful Main run #${run.run_number} (id=${run.id}, ${run.created_at})`,
  );
  return String(run.id);
}

async function getRunId(): Promise<string> {
  if (_runId) return _runId;
  _runId = process.env.RUN_ID_TO_COLLECT ?? (await getLatestMainRunId());
  return _runId;
}

/**
 * Fetches (and caches) the list of artifacts for the discovered CI run.
 * First call fetches and stores, every subsequent call returns the cached value.
 */
async function getArtifactList(): Promise<GitHubArtifact[]> {
  if (_artifactList) return _artifactList;

  const runId = await getRunId();
  const artifacts: GitHubArtifact[] = [];
  let page = 1;

  for (;;) {
    const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${runId}/artifacts?per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to list artifacts (page ${page}): ${res.status} ${res.statusText}`,
      );
    }

    const data = (await res.json()) as { artifacts: GitHubArtifact[] };
    artifacts.push(...data.artifacts);

    if (data.artifacts.length < 100) break;
    page++;
  }

  _artifactList = artifacts;
  return _artifactList;
}

/**
 * Downloads a named artifact from the discovered CI run, extracts it into a
 * local directory named after the artifact, and returns that directory path.
 *
 * @param artifactName - The name of the artifact to download.
 * @returns Path to the directory containing the extracted files.
 */
async function downloadArtifact(artifactName: string): Promise<string> {
  const artifacts = await getArtifactList();
  const artifact = artifacts.find((a) => a.name === artifactName);
  const runId = await getRunId();

  if (!artifact) {
    throw new Error(`Artifact "${artifactName}" not found in run ${runId}`);
  }

  // GitHub redirects to a pre-signed S3 URL. Follow manually so the
  // Authorization header is not forwarded to S3.
  const redirectRes = await fetch(artifact.archive_download_url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    redirect: 'manual',
  });

  const downloadUrl = redirectRes.headers.get('location');
  if (!downloadUrl) {
    throw new Error(`No redirect URL returned for artifact "${artifactName}"`);
  }

  // Validate the redirect target is a trusted GitHub/AWS host before writing
  // the response to disk. This guards against a malicious Location header
  // pointing to an attacker-controlled server.
  const downloadHost = new URL(downloadUrl).hostname;
  if (
    !downloadHost.endsWith('.amazonaws.com') &&
    !downloadHost.endsWith('.blob.core.windows.net') &&
    !downloadHost.endsWith('.github.com') &&
    downloadHost !== 'github.com'
  ) {
    throw new Error(
      `Untrusted redirect host "${downloadHost}" for artifact "${artifactName}"`,
    );
  }

  const zipRes = await fetch(downloadUrl);
  if (!zipRes.ok) {
    throw new Error(
      `Failed to download artifact "${artifactName}": ${zipRes.status} ${zipRes.statusText}`,
    );
  }

  const arrayBuffer = await zipRes.arrayBuffer();

  // Verify the response is a ZIP file by checking magic bytes (PK signature).
  // This catches cases where the server returns an unexpected content type
  // (e.g. an HTML error page) before writing anything to disk.
  const magic = new Uint8Array(arrayBuffer, 0, 2);
  if (magic[0] !== 0x50 || magic[1] !== 0x4b) {
    throw new Error(
      `Downloaded artifact "${artifactName}" is not a valid ZIP file (unexpected magic bytes)`,
    );
  }

  const destDir = join('temp', artifactName);
  await mkdir(destDir, { recursive: true });
  const zipPath = join(destDir, `${artifactName}.zip`);
  // Source URL host is validated above before this write.
  await writeFile(zipPath, Buffer.from(arrayBuffer));
  execFileSync('unzip', ['-qo', zipPath, '-d', destDir]);

  return destDir;
}

// ---------------------------------------------------------------------------
// JUnit XML helpers
// ---------------------------------------------------------------------------

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&amp;/gu, '&');
}

function getStringAttribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}="([^"]+)"`, 'u'));
  return match ? decodeXmlEntities(match[1]) : '';
}

/**
 * Parses JUnit XML and returns `{ total, perFile }` where `perFile` maps
 * test file path to executed test count.
 *
 * Relies on jest-junit's `addFileAttribute: 'true'` option, which adds a
 * `file` attribute to each `<testcase>` element with the absolute path to the
 * test file. Skipped tests are identified by a `<skipped>` child element and
 * excluded from the count.
 *
 * @param rawXml - Raw JUnit XML string.
 */
function parseJUnitXml(rawXml: string): JUnitParseResult {
  const testcasePattern = /<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/gu;
  const perFile: Record<string, number> = {};
  let total = 0;
  let skipped = 0;

  for (const match of rawXml.matchAll(testcasePattern)) {
    const attrs = match[1];
    const body = match[2] ?? '';

    if (body.includes('<skipped')) {
      skipped++;
      continue;
    }

    total++;

    const filePath = getStringAttribute(attrs, 'file');
    if (!filePath) continue;

    perFile[filePath] = (perFile[filePath] ?? 0) + 1;
  }

  return { total, skipped, perFile };
}

// ---------------------------------------------------------------------------
// Static analysis helpers
// ---------------------------------------------------------------------------

/**
 * Counts all individual test definitions in a source string — both active and
 * skipped. Matches `it(`, `it.skip(`, `it.each(`, `test(`, `test.skip(`,
 * `test.each(`, etc.
 *
 * Parameterized tests (`it.each`) are counted as one definition each, even
 * though they expand into multiple cases at runtime — so `total_tests_defined`
 * may be lower than `total_tests_run`.
 *
 * @param source - Source file content.
 */
function countDefinedTests(source: string): number {
  return (
    source.match(/\b(?:it|test)(?:\.(?:each|skip|only|concurrent))?\s*\(/gu) ??
    []
  ).length;
}

/**
 * Scans one or more directories for test files matching `filePattern` and
 * returns aggregate defined + skipped counts in a single filesystem pass.
 *
 * @param dirs - Directories to scan.
 * @param filePattern - Filename pattern to include.
 */
async function scanTestFiles(
  dirs: string[],
  filePattern: RegExp,
): Promise<ScanResult> {
  let defined = 0;
  for (const dir of dirs) {
    const files = await walkFiles(dir, (name) => filePattern.test(name));
    for (const f of files) {
      const source = await readFile(f, 'utf8');
      defined += countDefinedTests(source);
    }
  }
  return { defined };
}

// ---------------------------------------------------------------------------
// Feature folder mapping — extension directory structure
// ---------------------------------------------------------------------------

/**
 * Maps a unit/integration test file path to a feature category.
 *
 * Rules (first match wins):
 *   `ui/components/<group>/`  → `<group>`          (e.g. multichain, app, component_library)
 *   `ui/<folder>/`            → `<folder>`          (e.g. ducks, hooks, selectors, pages)
 *   `app/scripts/<folder>/`   → `<folder>`          (e.g. controllers, lib, migrations)
 *   `app/<folder>/`           → `<folder>`          (e.g. offscreen)
 *   `shared/<folder>/`        → `shared_<folder>`   (e.g. shared_lib, shared_constants)
 *   Anything else             → `other`
 *
 * @param testFilePath - Absolute or relative test file path.
 */
function getFeatureFolder(testFilePath: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/-/gu, '_');
  const p = testFilePath.replace(/\\/gu, '/');

  // Trailing slash ensures we capture subdirectory names only.
  // Files placed directly under a scanned root (e.g. app/scripts/foo.test.ts)
  // would otherwise produce keys containing the filename and extension.
  const uiComponentsMatch = p.match(/\bui\/components\/([^/]+)\//u);
  if (uiComponentsMatch) return normalize(uiComponentsMatch[1]);

  const uiMatch = p.match(/\bui\/([^/]+)\//u);
  if (uiMatch) return normalize(uiMatch[1]);

  const appScriptsMatch = p.match(/\bapp\/scripts\/([^/]+)\//u);
  if (appScriptsMatch) return normalize(appScriptsMatch[1]);

  const appMatch = p.match(/\bapp\/([^/]+)\//u);
  if (appMatch) return normalize(appMatch[1]);

  const sharedMatch = p.match(/\bshared\/([^/]+)\//u);
  if (sharedMatch) return `shared_${normalize(sharedMatch[1])}`;

  return 'other';
}

/**
 * Maps an integration test file path to a feature category.
 *
 * @param testFilePath - Absolute or relative test file path.
 */
function getIntegrationFeatureFolder(testFilePath: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/gu, '_');
  const p = testFilePath.replace(/\\/gu, '/');
  const match = p.match(/\btest\/integration\/([^/]+)\//u);
  return match ? normalize(match[1]) : 'other';
}

/**
 * Maps an E2E test file path to a feature category.
 *
 * Rules (first match wins):
 *   `test/e2e/tests/<feature>/`  →  `<feature>`
 *   `test/e2e/flask/<feature>/`  →  `<feature>`
 *   `test/e2e/<folder>/`         →  `<folder>`  (e.g. accounts, snaps)
 *   Anything else                →  `other`
 *
 * @param filePath - Absolute or relative test file path.
 */
function getE2eFeatureFolder(filePath: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/-/gu, '_');
  const p = filePath.replace(/\\/gu, '/');

  // Require a trailing slash so only subdirectory names are captured.
  // Files placed directly under test/e2e/tests/ or test/e2e/flask/ (with no
  // subdirectory) would otherwise produce keys containing ".spec.ts".
  const m = p.match(/\btest\/e2e\/(?:tests|flask)\/([^/]+)\//u);
  if (m) return normalize(m[1]);

  const m2 = p.match(/\btest\/e2e\/([^/]+)\//u);
  if (m2) return normalize(m2[1]);

  return 'other';
}

// ---------------------------------------------------------------------------
// Collectors
// ---------------------------------------------------------------------------

/**
 * Downloads all `unit-test-results-*` shard artifacts (JUnit XML), parses them,
 * and returns test counts grouped by feature folder.
 *
 * Folders whose total count is below `minFolderCount` are merged into `other`
 * to reduce noise.
 *
 * @param minFolderCount - Folders below this threshold are folded into `other`.
 */
async function collectUnitTestCount(
  minFolderCount = 100,
): Promise<Record<string, number>> {
  console.log('[unit] collecting per-suite counts from shard artifacts...');

  const artifacts = await getArtifactList();
  const shardArtifacts = artifacts.filter((a) =>
    /^unit-test-results-\d+$/u.test(a.name),
  );
  console.log(`[unit] found ${shardArtifacts.length} shard artifact(s)`);

  if (shardArtifacts.length === 0) return {};

  const folderCounts: Record<string, number> = {};
  let total = 0;
  let totalSkipped = 0;

  for (const artifact of shardArtifacts) {
    const destDir = await downloadArtifact(artifact.name);
    const raw = await readFile(join(destDir, 'junit.xml'), 'utf8');
    const {
      total: shardTotal,
      skipped: shardSkipped,
      perFile,
    } = parseJUnitXml(raw);
    total += shardTotal;
    totalSkipped += shardSkipped;

    for (const [filePath, count] of Object.entries(perFile)) {
      const folder = getFeatureFolder(filePath);
      folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
    }
  }

  console.log(`[unit] total: ${total}, skipped (artifact): ${totalSkipped}`);

  const { defined } = await scanTestFiles(
    SCAN_UNIT_DIRS,
    PATTERN_UNIT_TEST_FILE,
  );
  console.log(`[unit] defined: ${defined}`);

  const result: Record<string, number> = {
    total_tests_run: total,
    total_tests_skipped: totalSkipped,
    total_tests_defined: defined,
  };
  for (const [folder, count] of Object.entries(folderCounts)) {
    if (minFolderCount > 0 && count < minFolderCount) {
      result.other_tests_run = (result.other_tests_run ?? 0) + count;
    } else {
      result[`${folder}_tests_run`] =
        (result[`${folder}_tests_run`] ?? 0) + count;
    }
  }

  return result;
}

/**
 * Downloads the `integration-test-results` artifact (single, no sharding),
 * parses the JUnit XML, and returns test counts grouped by feature folder.
 *
 * Also counts test definitions and skipped tests via static source analysis.
 */
async function collectIntegrationTestCount(): Promise<Record<string, number>> {
  console.log('[integration] collecting per-suite counts from artifact...');

  const artifacts = await getArtifactList();
  const artifact = artifacts.find((a) => a.name === 'integration-test-results');

  if (!artifact) {
    console.log(
      '[integration] artifact not found — integration tests did not run, skipping',
    );
    return {};
  }

  const destDir = await downloadArtifact(artifact.name);
  const raw = await readFile(join(destDir, 'junit.xml'), 'utf8');
  const { total, skipped, perFile } = parseJUnitXml(raw);

  console.log(`[integration] total: ${total}, skipped (artifact): ${skipped}`);

  const folderCounts: Record<string, number> = {};
  for (const [filePath, count] of Object.entries(perFile)) {
    const folder = getIntegrationFeatureFolder(filePath);
    folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
  }

  const { defined } = await scanTestFiles(
    [SCAN_INTEGRATION_DIR],
    PATTERN_UNIT_TEST_FILE,
  );
  console.log(`[integration] defined: ${defined}`);

  const result: Record<string, number> = {
    total_tests_run: total,
    total_tests_skipped: skipped,
    total_tests_defined: defined,
  };
  for (const [folder, count] of Object.entries(folderCounts)) {
    result[`${folder}_tests_run`] = count;
  }

  return result;
}

// ---------------------------------------------------------------------------
// E2E test collector
// ---------------------------------------------------------------------------

/** Cached parsed content of test-runs-chrome.json, shared across collectors. */
let _e2eReportCache: TestRun[] | null = null;

/**
 * Downloads the `test-e2e-chrome-report` artifact (once, cached) and returns
 * the parsed `TestRun[]` array from `test-runs-chrome.json`.
 */
async function getE2eReport(): Promise<TestRun[]> {
  if (_e2eReportCache) return _e2eReportCache;

  const artifactName = 'test-e2e-chrome-report';
  console.log(`[e2e] downloading ${artifactName}...`);
  const destDir = await downloadArtifact(artifactName);

  // The artifact ZIP contains test-runs-chrome.json at its root.
  // Fall back to the full path in case the upload preserves directory structure.
  let raw: string;
  try {
    raw = await readFile(join(destDir, 'test-runs-chrome.json'), 'utf8');
  } catch {
    raw = await readFile(
      join(destDir, 'test', 'test-results', 'test-runs-chrome.json'),
      'utf8',
    );
  }

  _e2eReportCache = JSON.parse(raw) as TestRun[];
  return _e2eReportCache;
}

/** Cached parsed content of test-runs-firefox.json, shared across collectors. */
let _e2eFirefoxReportCache: TestRun[] | null = null;

/**
 * Downloads the `test-e2e-firefox-report` artifact (once, cached) and returns
 * the parsed `TestRun[]` array from `test-runs-firefox.json`.
 */
async function getE2eFirefoxReport(): Promise<TestRun[]> {
  if (_e2eFirefoxReportCache) return _e2eFirefoxReportCache;

  const artifactName = 'test-e2e-firefox-report';
  console.log(`[e2e] downloading ${artifactName}...`);
  const destDir = await downloadArtifact(artifactName);

  let raw: string;
  try {
    raw = await readFile(join(destDir, 'test-runs-firefox.json'), 'utf8');
  } catch {
    raw = await readFile(
      join(destDir, 'test', 'test-results', 'test-runs-firefox.json'),
      'utf8',
    );
  }

  _e2eFirefoxReportCache = JSON.parse(raw) as TestRun[];
  return _e2eFirefoxReportCache;
}

/**
 * Reads the `skipped` attribute from the root `<testsuites>` element of a
 * `mocha-junit-reporter` XML file.
 *
 * Unlike Jest's JUnit output (which marks skipped tests as `<testcase>`
 * elements with a `<skipped/>` child), `mocha-junit-reporter` records the
 * total skipped count as an attribute on the `<testsuites>` root element and
 * omits skipped tests from the `<testcase>` list entirely.
 *
 * @param rawXml - Raw JUnit XML string produced by mocha-junit-reporter.
 */
function parseMochaSkipped(rawXml: string): number {
  const match = rawXml.match(/<testsuites\b[^>]*\bskipped="(\d+)"/u);
  return match ? Number(match[1]) : 0;
}

/**
 * Downloads all Chrome E2E shard artifacts except the explicit browserify run,
 * reads the `skipped` attribute from each JUnit XML file's `<testsuites>` root
 * element, and returns the total skipped count.
 *
 * Uses `parseMochaSkipped` rather than `parseJUnitXml` because
 * `mocha-junit-reporter` does not emit `<skipped/>` child elements.
 */
async function getE2eSkippedFromXml(): Promise<number> {
  const artifacts = await getArtifactList();
  const shardArtifacts = artifacts.filter(
    (a) =>
      a.name.startsWith('test-e2e-chrome-') &&
      !a.name.startsWith('test-e2e-chrome-browserify') &&
      a.name !== 'test-e2e-chrome-report',
  );

  console.log(
    `[e2e] found ${shardArtifacts.length} chrome shard artifact(s) for skipped count`,
  );

  let totalSkipped = 0;
  for (const artifact of shardArtifacts) {
    const destDir = await downloadArtifact(artifact.name);
    const xmlFiles = await walkFiles(destDir, (name) => name.endsWith('.xml'));
    for (const xmlFile of xmlFiles) {
      const raw = await readFile(xmlFile, 'utf8');
      totalSkipped += parseMochaSkipped(raw);
    }
  }

  console.log(`[e2e] skipped (artifact XML): ${totalSkipped}`);
  return totalSkipped;
}

/**
 * Collects all E2E test counts — both main and flask channels — into a single
 * namespace. Chrome is the canonical platform as reference for CI runs.
 *
 * Static analysis covers both main + flask directories combined.
 */
async function collectE2eTestCount(): Promise<Record<string, number>> {
  console.log('[e2e] collecting counts from e2e reports...');

  const chromeRuns = await getE2eReport();

  // Explicitly excluded run: the browserify build is superseded by webpack.
  // All other Chrome runs (webpack, flask, rpc, dist, multiple-providers, etc.)
  // contribute to the totals.
  const EXCLUDED_CHROME_RUN = 'test-e2e-chrome-browserify';

  // --- Main channel (Chrome, canonical) ---
  // Counts every Chrome run except the explicit browserify job and flask
  // (flask is tracked separately below).
  let mainChromeTotal = 0;
  const folderCounts: Record<string, number> = {};

  for (const run of chromeRuns.filter(
    (r) => r.name !== EXCLUDED_CHROME_RUN && r.name !== 'test-e2e-chrome-flask',
  )) {
    for (const file of run.testFiles ?? []) {
      const ran = (file.tests ?? 0) - (file.skipped ?? 0);
      mainChromeTotal += ran;
      const folder = getE2eFeatureFolder(file.path ?? '');
      folderCounts[folder] = (folderCounts[folder] ?? 0) + ran;
    }
  }
  console.log(`[e2e/main/chrome] total: ${mainChromeTotal}`);

  // --- Flask channel (Chrome, canonical) ---
  let flaskChromeTotal = 0;

  for (const run of chromeRuns.filter(
    (r) => r.name === 'test-e2e-chrome-flask',
  )) {
    for (const file of run.testFiles ?? []) {
      flaskChromeTotal += (file.tests ?? 0) - (file.skipped ?? 0);
    }
  }
  console.log(`[e2e/flask/chrome] total: ${flaskChromeTotal}`);

  // --- Firefox health signals (both channels) ---
  let mainFirefoxTotal = 0;
  let flaskFirefoxTotal = 0;
  try {
    const firefoxRuns = await getE2eFirefoxReport();

    for (const run of firefoxRuns.filter(
      (r) => r.name === 'test-e2e-firefox-browserify',
    )) {
      for (const file of run.testFiles ?? []) {
        mainFirefoxTotal += (file.tests ?? 0) - (file.skipped ?? 0);
      }
    }
    console.log(`[e2e/main/firefox] total: ${mainFirefoxTotal}`);

    for (const run of firefoxRuns.filter(
      (r) => r.name === 'test-e2e-firefox-flask',
    )) {
      for (const file of run.testFiles ?? []) {
        flaskFirefoxTotal += (file.tests ?? 0) - (file.skipped ?? 0);
      }
    }
    console.log(`[e2e/flask/firefox] total: ${flaskFirefoxTotal}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[e2e] firefox report not available, skipping: ${message}`);
  }

  // --- Static analysis across all of test/e2e/ (for defined count only) ---
  const { defined } = await scanTestFiles(
    [SCAN_E2E_DIR],
    PATTERN_E2E_SPEC_FILE,
  );
  console.log(`[e2e] defined: ${defined}`);

  const totalSkipped = await getE2eSkippedFromXml();

  const result: Record<string, number> = {
    total_tests_run: mainChromeTotal + flaskChromeTotal,
    total_tests_skipped: totalSkipped,
    total_tests_defined: defined,
  };

  // Main channel counts (omit if main tests did not run)
  if (mainChromeTotal > 0 || mainFirefoxTotal > 0) {
    result.main_tests_run = mainChromeTotal;
    result.main_chrome_tests_run = mainChromeTotal;
    if (mainFirefoxTotal > 0) result.main_firefox_tests_run = mainFirefoxTotal;
  }

  // Flask channel counts (omit if flask tests did not run)
  if (flaskChromeTotal > 0 || flaskFirefoxTotal > 0) {
    result.flask_tests_run = flaskChromeTotal;
    result.flask_chrome_tests_run = flaskChromeTotal;
    if (flaskFirefoxTotal > 0)
      result.flask_firefox_tests_run = flaskFirefoxTotal;
  }

  // Per-feature breakdown from Chrome main only (canonical, like Android in mobile).
  // Guard against feature directory names that collide with aggregate keys.
  const reservedKeys = new Set(Object.keys(result));
  for (const [folder, count] of Object.entries(folderCounts)) {
    const key = `${folder}_tests_run`;
    if (reservedKeys.has(key)) {
      console.warn(
        `[e2e] skipping per-feature key "${key}" — conflicts with aggregate metric`,
      );
      continue;
    }
    result[key] = count;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Benchmark scenario counter
// ---------------------------------------------------------------------------

/**
 * Counts benchmark presets defined in `test/e2e/benchmarks/utils/constants.ts`.
 *
 * Each preset (e.g. `startupStandardHome`, `userJourneyAssets`) is one benchmark
 * test. Presets are categorized by their camelCase prefix and reported as
 * `{category}_tests_defined` keys (static source analysis, no artifact downloads).
 */
async function collectBenchmarkScenarioCount(): Promise<
  Record<string, number>
> {
  const constantsFile = 'test/e2e/benchmarks/utils/constants.ts';
  console.log(
    `[benchmark] reading preset definitions from ${constantsFile}...`,
  );

  const raw = await readFile(constantsFile, 'utf8');

  // Extract all preset string values by their camelCase naming convention.
  const presets = new Set<string>();
  for (const m of raw.matchAll(
    /'((?:startup|interaction|userJourney)[A-Z][a-zA-Z]*)'/gu,
  )) {
    presets.add(m[1]);
  }

  const categoryCounts: Record<string, number> = {};
  for (const preset of presets) {
    let category: string;
    if (preset.startsWith('startup')) {
      category = 'startup';
    } else if (preset.startsWith('interaction')) {
      category = 'interaction';
    } else if (preset.startsWith('userJourney')) {
      category = 'user_journey';
    } else {
      category = 'other';
    }
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    console.log(`[benchmark] ${preset} → ${category}`);
  }

  const total = presets.size;
  console.log(`[benchmark] total: ${total} unique presets`);

  const result: Record<string, number> = { total_tests_defined: total };
  for (const [category, count] of Object.entries(categoryCounts)) {
    result[`${category}_tests_defined`] = count;
  }

  return result;
}

/**
 * Static scan of E2E MetaMetrics assertions (no GitHub artifacts). On failure, returns {}.
 */
async function collectMetametricsQaStats(): Promise<Record<string, number | string>> {
  try {
    return await collectE2EMetaMetricsEventCoverage();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[metametrics] static scan failed, skipping namespace: ${message}`);
    return {};
  }
}

// ---------------------------------------------------------------------------
// Feature flag coverage collector
// ---------------------------------------------------------------------------

/**
 * Runs static analysis of E2E test coverage for feature flags using the
 * shared report generator in test/e2e/scripts/feature-flag-coverage-report.ts.
 *
 * No artifact download required — the analysis reads the feature flag registry
 * and scans test files on disk (both available in the checked-out repo).
 */
async function collectFeatureFlagCoverage(): Promise<Record<string, number>> {
  console.log('[e2e_feature_flags] running static coverage analysis...');

  const { generateReport } = await import(
    '../../test/e2e/scripts/feature-flag-coverage-report'
  );

  const report = generateReport(process.cwd());
  const { summary } = report;

  console.log(
    `[e2e_feature_flags] total: ${summary.totalFlags}, active: ${summary.activeFlags}, coverage: ${summary.coveragePercentage}%`,
  );

  return {
    total_flags: summary.totalFlags,
    active_flags: summary.activeFlags,
    deprecated_flags: summary.deprecatedFlags,
    in_prod_flags: summary.inProdFlags,
    full_coverage_flags: summary.fullCoverage,
    partial_coverage_flags: summary.partialCoverage,
    default_only_flags: summary.defaultOnlyCoverage,
    coverage_percentage: summary.coveragePercentage,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const stats: Record<string, Record<string, number | string>> = {};

  const collectors: Collector[] = [
    { namespace: 'unit', collect: collectUnitTestCount },
    { namespace: 'integration', collect: collectIntegrationTestCount },
    { namespace: 'e2e', collect: collectE2eTestCount },
    { namespace: 'benchmark', collect: collectBenchmarkScenarioCount },
    { namespace: 'metametrics', collect: collectMetametricsQaStats },
    { namespace: 'e2e_feature_flags', collect: collectFeatureFlagCoverage },
  ];

  for (const { namespace, collect } of collectors) {
    try {
      const nested = await collect();
      if (Object.keys(nested).length === 0) continue;
      stats[namespace] = nested;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${namespace}] collector failed, skipping:`, message);
    }
  }

  const outputPath = './qa-stats.json';
  await writeFile(outputPath, JSON.stringify(stats, null, 2), 'utf8');
  console.log(`✅ QA stats written to ${outputPath}:`, stats);
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
