#!/usr/bin/env node
/**
 *
 * Collects QA metrics into a qa-stats.json file, key: value format.
 * Metrics that could not be collected (missing artifacts, tests did not run)
 * are omitted from the output, i.e., they will not appear in the output file.
 *
 * Required env vars:
 *   GITHUB_TOKEN      — GitHub Actions token for API access
 *   GITHUB_REPOSITORY — Repository in "owner/repo" format (set automatically in Actions)
 *
 * How to add a new metric:
 *   1. Add a collector function that returns a plain object
 *   2. Register it in the collectors array in main()
 *
 * The only rule: never rename existing keys. The DB key is (project, run_id, namespace, metric_key).
 * Renaming a key in the JSON creates a new series in the DB while the old name stops getting new data,
 * which breaks the Grafana time series continuity. Adding and removing keys is fine.
 *
 * Artifact names used below are coupled to `name:` fields in main.yml and run-tests.yml —
 * renaming either side silently drops that metric from the output.
 *
 * Naming convention:
 *   - CI-executed (from JUnit XML artifacts): _run suffix     → tests actually ran in CI
 *   - Static source analysis (from code):     _defined suffix → tests defined in the codebase
 *   - total_tests_skipped is static-analysis derived (it.skip / test.skip / describe.skip)
 *
 * Example output:
 *   {
 *     "unit": {
 *       "total_tests_run": 41957,
 *       "total_tests_skipped": 120,
 *       "total_tests_defined": 39500,
 *       "controllers_tests_run": 3200,
 *       "ui_app_tests_run": 5100,
 *       "ducks_tests_run": 1500,
 *       "selectors_tests_run": 900,
 *       "other_tests_run": 26357
 *     },
 *     "integration": {
 *       "total_tests_run": 540,
 *       "total_tests_skipped": 2,
 *       "total_tests_defined": 510,
 *       "accounts_tests_run": 90,
 *       "other_tests_run": 450
 *     },
 *     "e2e": {
 *       "total_tests_run": 1200,
 *       "total_tests_skipped": 5,
 *       "total_tests_defined": 1100,
 *       "confirmations_tests_run": 300,
 *       "send_tests_run": 120,
 *       "other_tests_run": 780
 *     },
 *     "e2e_flask": {
 *       "total_tests_run": 200,
 *       "total_tests_skipped": 0,
 *       "total_tests_defined": 180,
 *       "snaps_tests_run": 80,
 *       "accounts_tests_run": 60,
 *       "other_tests_run": 60
 *     },
 *     "benchmark": {
 *       "total_tests_defined": 8,
 *       "startup_tests_defined": 2,
 *       "interaction_tests_defined": 1,
 *       "user_journey_tests_defined": 5
 *     }
 *   }
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

if (!GITHUB_TOKEN) throw new Error('Missing required GITHUB_TOKEN env var');

// ---------------------------------------------------------------------------
// Static-scan targets
// Update these if the repository directory structure or file-naming conventions
// change — the collectors below rely on them for skip/defined counts.
// ---------------------------------------------------------------------------
const SCAN_UNIT_DIRS = ['ui', 'app', 'shared'];
const SCAN_INTEGRATION_DIR = 'test/integration';
const SCAN_E2E_DIRS = ['test/e2e/tests', 'test/e2e/accounts', 'test/e2e/snaps'];
const SCAN_E2E_FLASK_DIRS = [
  'test/e2e/flask',
  'test/e2e/accounts',
  'test/e2e/snaps',
];

const PATTERN_UNIT_TEST_FILE = /\.test\.(ts|tsx|js|jsx)$/;
const PATTERN_E2E_SPEC_FILE = /\.spec\.(ts|js)$/;

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

let _runId = null;
let _artifactList = null;

/**
 * Fetches the ID of the latest successful "Main" workflow run on `main`.
 *
 * @returns {Promise<string>}
 */
async function getLatestMainRunId() {
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

  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) {
    throw new Error('No successful Main workflow runs found on main');
  }

  console.log(
    `[run] Using latest successful Main run #${run.run_number} (id=${run.id}, ${run.created_at})`,
  );
  return String(run.id);
}

async function getRunId() {
  if (_runId) return _runId;
  _runId = await getLatestMainRunId();
  return _runId;
}

/**
 * Fetches (and caches) the list of artifacts for the discovered CI run.
 * First call fetches and stores, every subsequent call returns the cached value.
 *
 * @returns {Promise<Array>}
 */
async function getArtifactList() {
  if (_artifactList) return _artifactList;

  const runId = await getRunId();
  const artifacts = [];
  let page = 1;

  while (true) {
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

    const data = await res.json();
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
 * @param {string} artifactName
 * @returns {Promise<string>} Path to the directory containing the extracted files
 */
async function downloadArtifact(artifactName) {
  const artifacts = await getArtifactList();
  const artifact = artifacts.find((a) => a.name === artifactName);
  const runId = await getRunId();

  if (!artifact) {
    throw new Error(
      `Artifact "${artifactName}" not found in run ${runId}`,
    );
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

  const zipRes = await fetch(downloadUrl);
  if (!zipRes.ok) {
    throw new Error(
      `Failed to download artifact "${artifactName}": ${zipRes.status} ${zipRes.statusText}`,
    );
  }

  const destDir = `./${artifactName}`;
  await mkdir(destDir, { recursive: true });
  const zipPath = join(destDir, `${artifactName}.zip`);
  await writeFile(zipPath, Buffer.from(await zipRes.arrayBuffer()));
  execSync(`unzip -q "${zipPath}" -d "${destDir}"`);

  return destDir;
}

// ---------------------------------------------------------------------------
// JUnit XML helpers
// ---------------------------------------------------------------------------

function getNumericAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="(\\d+)"`));
  return match ? Number(match[1]) : 0;
}

function getStringAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]+)"`));
  return match ? match[1] : '';
}

/**
 * Parses JUnit XML and returns { total, perFile } where perFile maps
 * test file path to executed test count.
 *
 * Relies on jest-junit's `addFileAttribute: 'true'` option, which adds a
 * `file` attribute to each <testcase> element with the absolute path to the
 * test file. Skipped tests are identified by a <skipped> child element and
 * excluded from the count.
 *
 * @param {string} rawXml
 * @returns {{ total: number, perFile: Record<string, number> }}
 */
function parseJUnitXml(rawXml) {
  const testcasePattern = /<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  const perFile = {};
  let total = 0;

  for (const match of rawXml.matchAll(testcasePattern)) {
    const attrs = match[1];
    const body = match[2] ?? '';

    if (body.includes('<skipped')) continue;

    const filePath = getStringAttribute(attrs, 'file');
    if (!filePath) continue;

    total++;
    perFile[filePath] = (perFile[filePath] ?? 0) + 1;
  }

  return { total, perFile };
}

// ---------------------------------------------------------------------------
// Static analysis helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collects file paths under `dir` that satisfy `predicate(filename)`.
 *
 * @param {string} dir
 * @param {(name: string) => boolean} predicate
 * @returns {Promise<string[]>}
 */
async function walkFiles(dir, predicate) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results; // directory does not exist — skip silently
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath, predicate)));
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Counts all individual test definitions in a source string — both active and
 * skipped. Matches it(, it.skip(, it.each(, test(, test.skip(, test.each(, etc.
 *
 * Parameterized tests (it.each) are counted as one definition each, even
 * though they expand into multiple cases at runtime — so total_tests_defined
 * may be lower than total_tests_run.
 *
 * @param {string} source
 * @returns {number}
 */
function countDefinedTests(source) {
  return (
    source.match(/\b(?:it|test)(?:\.(?:each|skip|only|concurrent))?\s*\(/g) ??
    []
  ).length;
}

/**
 * Counts the number of individual test cases that are skipped in a source string.
 *
 * Two categories:
 *   1. Explicit: `it.skip()` / `test.skip()` outside any `describe.skip` block.
 *   2. Implicit: every `it()` / `test()` call (including `.skip` variants) inside
 *      a `describe.skip` block, because the whole block is skipped by the runner.
 *
 * `describe.skip` blocks are extracted via brace matching so their contents are
 * not double-counted against the explicit-skip pass.
 *
 * @param {string} source
 * @returns {number}
 */
function countSkips(source) {
  // Find all describe.skip blocks using brace matching.
  const describeBlocks = [];
  const re = /\bdescribe\.skip\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const braceStart = source.indexOf('{', m.index + m[0].length);
    if (braceStart === -1) continue;
    let depth = 1,
      pos = braceStart + 1;
    while (pos < source.length && depth > 0) {
      if (source[pos] === '{') depth++;
      else if (source[pos] === '}') depth--;
      pos++;
    }
    describeBlocks.push({
      start: m.index,
      end: pos,
      content: source.slice(braceStart + 1, pos - 1),
    });
  }

  // Strip describe.skip regions from source (reverse order to preserve indices).
  let outside = source;
  for (let i = describeBlocks.length - 1; i >= 0; i--) {
    outside =
      outside.slice(0, describeBlocks[i].start) +
      outside.slice(describeBlocks[i].end);
  }

  // Part 1: it.skip / test.skip outside describe.skip blocks.
  const explicit = (outside.match(/\b(?:it|test)\.skip\s*\(/g) ?? []).length;

  // Part 2: all it() / test() (including .skip) inside describe.skip blocks.
  const implicit = describeBlocks.reduce(
    (sum, { content }) =>
      sum + (content.match(/\b(?:it|test)(?:\.skip)?\s*\(/g) ?? []).length,
    0,
  );

  return explicit + implicit;
}

/**
 * Scans one or more directories for test files matching `filePattern` and
 * returns aggregate defined + skipped counts in a single filesystem pass.
 *
 * @param {string[]} dirs - Directories to scan
 * @param {RegExp} filePattern - Filename pattern to include
 * @returns {Promise<{ defined: number, skipped: number }>}
 */
async function scanTestFiles(dirs, filePattern) {
  let defined = 0,
    skipped = 0;
  for (const dir of dirs) {
    const files = await walkFiles(dir, (name) => filePattern.test(name));
    for (const f of files) {
      const source = await readFile(f, 'utf8');
      defined += countDefinedTests(source);
      skipped += countSkips(source);
    }
  }
  return { defined, skipped };
}

// ---------------------------------------------------------------------------
// Feature folder mapping — extension directory structure
// ---------------------------------------------------------------------------

/**
 * Maps a unit/integration test file path to a feature category.
 *
 * Rules (first match wins):
 *   ui/components/<group>/   → <group>         (e.g. multichain, app, component_library)
 *   ui/<folder>/             → <folder>         (e.g. ducks, hooks, selectors, pages)
 *   app/scripts/<folder>/    → <folder>         (e.g. controllers, lib, migrations)
 *   app/<folder>/            → <folder>         (e.g. offscreen)
 *   shared/<folder>/         → shared_<folder>  (e.g. shared_lib, shared_constants)
 *   Anything else            → other
 *
 * @param {string} testFilePath
 * @returns {string}
 */
function getFeatureFolder(testFilePath) {
  const normalize = (s) => s.toLowerCase().replace(/-/g, '_');
  const p = testFilePath.replace(/\\/g, '/');

  const uiComponentsMatch = p.match(/\bui\/components\/([^/]+)/);
  if (uiComponentsMatch) return normalize(uiComponentsMatch[1]);

  const uiMatch = p.match(/\bui\/([^/]+)/);
  if (uiMatch) return normalize(uiMatch[1]);

  const appScriptsMatch = p.match(/\bapp\/scripts\/([^/]+)/);
  if (appScriptsMatch) return normalize(appScriptsMatch[1]);

  const appMatch = p.match(/\bapp\/([^/]+)/);
  if (appMatch) return normalize(appMatch[1]);

  const sharedMatch = p.match(/\bshared\/([^/]+)/);
  if (sharedMatch) return `shared_${normalize(sharedMatch[1])}`;

  return 'other';
}

/**
 * Maps an integration test file path to a feature category.
 *
 * @param {string} testFilePath
 * @returns {string}
 */
function getIntegrationFeatureFolder(testFilePath) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const p = testFilePath.replace(/\\/g, '/');
  const match = p.match(/\btest\/integration\/([^/]+)/);
  return match ? normalize(match[1]) : 'other';
}

/**
 * Maps an E2E test file path to a feature category.
 *
 * Rules (first match wins):
 *   test/e2e/tests/<feature>/  →  <feature>
 *   test/e2e/flask/<feature>/  →  <feature>
 *   test/e2e/<folder>/         →  <folder>  (e.g. accounts, snaps)
 *   Anything else              →  other
 *
 * @param {string} filePath
 * @returns {string}
 */
function getE2eFeatureFolder(filePath) {
  const normalize = (s) => s.toLowerCase().replace(/-/g, '_');
  const p = filePath.replace(/\\/g, '/');

  const m = p.match(/\btest\/e2e\/(?:tests|flask)\/([^/]+)/);
  if (m) return normalize(m[1]);

  const m2 = p.match(/\btest\/e2e\/([^/]+)/);
  if (m2) return normalize(m2[1]);

  return 'other';
}

// ---------------------------------------------------------------------------
// Collectors
// ---------------------------------------------------------------------------

/**
 * Downloads all unit-test-results-* shard artifacts (JUnit XML), parses them,
 * and returns test counts grouped by feature folder.
 *
 * Also counts test definitions and skipped tests via static source analysis.
 *
 * Folders whose total count is below minFolderCount are merged into `other`
 * to reduce noise.
 *
 * @param {number} [minFolderCount=200]
 * @returns {Promise<Record<string, number>>}
 */
async function collectUnitTestCount(minFolderCount = 200) {
  console.log('[unit] collecting per-suite counts from shard artifacts...');

  const artifacts = await getArtifactList();
  const shardArtifacts = artifacts.filter((a) =>
    /^unit-test-results-\d+$/.test(a.name),
  );
  console.log(`[unit] found ${shardArtifacts.length} shard artifact(s)`);

  if (shardArtifacts.length === 0) return {};

  const folderCounts = {};
  let total = 0;

  for (const artifact of shardArtifacts) {
    const destDir = await downloadArtifact(artifact.name);
    const raw = await readFile(join(destDir, 'junit.xml'), 'utf8');
    const { total: shardTotal, perFile } = parseJUnitXml(raw);
    total += shardTotal;

    for (const [filePath, count] of Object.entries(perFile)) {
      const folder = getFeatureFolder(filePath);
      folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
    }
  }

  console.log(`[unit] total: ${total}`);

  const { defined, skipped } = await scanTestFiles(
    SCAN_UNIT_DIRS,
    PATTERN_UNIT_TEST_FILE,
  );
  console.log(`[unit] defined: ${defined}, skipped (static): ${skipped}`);

  const result = {
    total_tests_run: total,
    total_tests_skipped: skipped,
    total_tests_defined: defined,
  };
  for (const [folder, count] of Object.entries(folderCounts)) {
    if (minFolderCount > 0 && count < minFolderCount) {
      result.other_tests_run = (result.other_tests_run ?? 0) + count;
    } else {
      result[`${folder}_tests_run`] = count;
    }
  }

  return result;
}

/**
 * Downloads the integration-test-results artifact (single, no sharding),
 * parses the JUnit XML, and returns test counts grouped by feature folder.
 *
 * Also counts test definitions and skipped tests via static source analysis.
 *
 * @returns {Promise<Record<string, number>>}
 */
async function collectIntegrationTestCount() {
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
  const { total, perFile } = parseJUnitXml(raw);

  console.log(`[integration] total: ${total}`);

  const folderCounts = {};
  for (const [filePath, count] of Object.entries(perFile)) {
    const folder = getIntegrationFeatureFolder(filePath);
    folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
  }

  const { defined, skipped } = await scanTestFiles(
    [SCAN_INTEGRATION_DIR],
    PATTERN_UNIT_TEST_FILE,
  );
  console.log(
    `[integration] defined: ${defined}, skipped (static): ${skipped}`,
  );

  const result = {
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
let _e2eReportCache = null;

/**
 * Downloads the test-e2e-chrome-report artifact (once, cached) and returns
 * the parsed TestRun[] array from test-runs-chrome.json.
 *
 * @returns {Promise<Array>}
 */
async function getE2eReport() {
  if (_e2eReportCache) return _e2eReportCache;

  const artifactName = 'test-e2e-chrome-report';
  console.log(`[e2e] downloading ${artifactName}...`);
  const destDir = await downloadArtifact(artifactName);

  // The artifact ZIP contains test-runs-chrome.json at its root.
  // Fall back to the full path in case the upload preserves directory structure.
  let raw;
  try {
    raw = await readFile(join(destDir, 'test-runs-chrome.json'), 'utf8');
  } catch {
    raw = await readFile(
      join(destDir, 'test', 'test-results', 'test-runs-chrome.json'),
      'utf8',
    );
  }

  _e2eReportCache = JSON.parse(raw);
  return _e2eReportCache;
}

/**
 * Shared E2E collector logic. Parses test-runs-chrome.json, filters to a
 * specific job name, aggregates test counts, and runs a static scan for
 * total_tests_defined and total_tests_skipped.
 *
 * @param {string} jobName - Value of TestRun.name to filter on
 * @param {string[]} staticDirs - Directories to scan for static test definitions
 * @returns {Promise<Record<string, number>>}
 */
async function collectE2eFromReport(jobName, staticDirs) {
  const testRuns = await getE2eReport();

  const matchingRuns = testRuns.filter((run) => run.name === jobName);
  if (matchingRuns.length === 0) {
    console.log(`[e2e] no runs found for job "${jobName}", skipping`);
    return {};
  }

  let total = 0;
  const folderCounts = {};

  for (const run of matchingRuns) {
    for (const file of run.testFiles ?? []) {
      total += file.tests ?? 0;

      const folder = getE2eFeatureFolder(file.path ?? '');
      folderCounts[folder] = (folderCounts[folder] ?? 0) + (file.tests ?? 0);
    }
  }

  console.log(`[e2e/${jobName}] total: ${total}`);

  const { defined, skipped } = await scanTestFiles(
    staticDirs,
    PATTERN_E2E_SPEC_FILE,
  );
  console.log(
    `[e2e/${jobName}] defined: ${defined}, skipped (static): ${skipped}`,
  );

  const result = {
    total_tests_run: total,
    total_tests_skipped: skipped,
    total_tests_defined: defined,
  };
  for (const [folder, count] of Object.entries(folderCounts)) {
    result[`${folder}_tests_run`] = count;
  }

  return result;
}

/**
 * Collects E2E test counts for the standard (non-flask) Chrome build.
 * Source: test-e2e-chrome-report → job "test-e2e-chrome-browserify"
 *
 * @returns {Promise<Record<string, number>>}
 */
async function collectE2eTestCount() {
  console.log('[e2e] collecting counts from test-e2e-chrome-report...');
  return collectE2eFromReport('test-e2e-chrome-browserify', SCAN_E2E_DIRS);
}

/**
 * Collects E2E test counts for the Flask Chrome build.
 * Source: test-e2e-chrome-report → job "test-e2e-chrome-flask"
 *
 * @returns {Promise<Record<string, number>>}
 */
async function collectE2eFlaskTestCount() {
  console.log('[e2e_flask] collecting counts from test-e2e-chrome-report...');
  return collectE2eFromReport(
    'test-e2e-chrome-flask',
    SCAN_E2E_FLASK_DIRS,
  );
}

// ---------------------------------------------------------------------------
// Benchmark scenario counter
// ---------------------------------------------------------------------------

/**
 * Counts benchmark presets defined in test/e2e/benchmarks/utils/constants.ts.
 *
 * Each preset (e.g. startupStandardHome, userJourneyAssets) is one benchmark
 * test. Presets are categorized by their camelCase prefix and reported as
 * {category}_tests_defined keys (static source analysis, no artifact downloads).
 *
 * @returns {Promise<Record<string, number>>}
 */
async function collectBenchmarkScenarioCount() {
  const constantsFile = 'test/e2e/benchmarks/utils/constants.ts';
  console.log(`[benchmark] reading preset definitions from ${constantsFile}...`);

  const raw = await readFile(constantsFile, 'utf8');

  // Extract all preset string values by their camelCase naming convention.
  const presets = new Set();
  for (const m of raw.matchAll(
    /'((?:startup|interaction|userJourney)[A-Z][a-zA-Z]*)'/g,
  )) {
    presets.add(m[1]);
  }

  const categoryCounts = {};
  for (const preset of presets) {
    let category;
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

  const result = { total_tests_defined: total };
  for (const [category, count] of Object.entries(categoryCounts)) {
    result[`${category}_tests_defined`] = count;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const stats = {};

  const collectors = [
    { namespace: 'unit', collect: collectUnitTestCount },
    { namespace: 'integration', collect: collectIntegrationTestCount },
    { namespace: 'e2e', collect: collectE2eTestCount },
    { namespace: 'e2e_flask', collect: collectE2eFlaskTestCount },
    { namespace: 'benchmark', collect: collectBenchmarkScenarioCount },
  ];

  for (const { namespace, collect } of collectors) {
    try {
      const nested = await collect();
      if (Object.keys(nested).length === 0) continue;
      stats[namespace] = nested;
    } catch (err) {
      // namespace will not be present in the output if the collector fails
      console.error(`[${namespace}] collector failed, skipping:`, err.message);
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
