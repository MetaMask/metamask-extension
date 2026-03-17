#!/usr/bin/env node
/**
 *
 * Collects QA metrics from the latest successful Main CI run on `main` and
 * writes qa-stats.json in key: value format.
 * Metrics that could not be collected (missing artifacts, tests did not run)
 * are omitted from the output — they will never appear as zero.
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
 * Naming convention:
 *   - CI-executed (from JUnit XML artifacts): _run suffix     → tests actually ran in CI
 *   - Static source analysis (from code):     _defined suffix → tests defined in the codebase
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
 *     "benchmark": {
 *       "total_tests_defined": 8,
 *       "startup_tests_defined": 2,
 *       "interaction_tests_defined": 1,
 *       "user_journey_tests_defined": 5
 *     }
 *   }
 */

import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';
const WORKFLOW_RUN_ID = "23014510046";


if (!GITHUB_TOKEN) throw new Error('Missing required GITHUB_TOKEN env var');

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

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
    throw new Error(`Failed to fetch Main workflow runs: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) {
    throw new Error('No successful Main workflow runs found on main');
  }

  console.log(`[run] Using Main run #${run.run_number} (id=${run.id}, ${run.created_at})`);
  return String(run.id);
}

let _runId = null;

async function getRunId() {
  if (!_runId) {
    _runId = await getLatestMainRunId();
  }
  return _runId;
}

let _artifactList = null;

/**
 * Fetches (and caches) the list of artifact names for the discovered CI run.
 *
 * @returns {Promise<Array>}
 */
async function getArtifactList() {
  if (_artifactList) return _artifactList;

  const runId = await getRunId();
  const artifacts = [];
  let page = 1;

  while (true) {
    // const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${runId}/artifacts?per_page=100&page=${page}`;
    const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${WORKFLOW_RUN_ID}/artifacts?per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to list artifacts (page ${page}): ${res.status} ${res.statusText}`);
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
  // Match each <testcase> — either self-closing or with a body
  const testcasePattern = /<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  const perFile = {};
  let total = 0;
  let skipped = 0;

  for (const match of rawXml.matchAll(testcasePattern)) {
    const attrs = match[1];
    const body = match[2] ?? '';

    if (body.includes('<skipped')) {
      skipped++;
      continue;
    }

    const filePath = getStringAttribute(attrs, 'file');
    if (!filePath) continue;

    total++;
    perFile[filePath] = (perFile[filePath] ?? 0) + 1;
  }

  return { total, skipped, perFile };
}

// ---------------------------------------------------------------------------
// Feature folder mapping — extension directory structure
// ---------------------------------------------------------------------------

/**
 * Maps a test file path to a feature category for MetaMask Extension.
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

  // ui/components/<group>/ → <group> (e.g. multichain, app, component_library)
  const uiComponentsMatch = p.match(/\bui\/components\/([^/]+)/);
  if (uiComponentsMatch) return normalize(uiComponentsMatch[1]);

  // ui/<folder>/ → <folder> (e.g. ducks, hooks, selectors, pages)
  const uiMatch = p.match(/\bui\/([^/]+)/);
  if (uiMatch) return normalize(uiMatch[1]);

  // app/scripts/<folder>/ → <folder> (e.g. controllers, lib, migrations)
  const appScriptsMatch = p.match(/\bapp\/scripts\/([^/]+)/);
  if (appScriptsMatch) return normalize(appScriptsMatch[1]);

  // app/<folder>/ → <folder> (e.g. offscreen)
  const appMatch = p.match(/\bapp\/([^/]+)/);
  if (appMatch) return normalize(appMatch[1]);

  // shared/<folder>/ → shared_<folder>
  const sharedMatch = p.match(/\bshared\/([^/]+)/);
  if (sharedMatch) return `shared_${normalize(sharedMatch[1])}`;

  return 'other';
}

// ---------------------------------------------------------------------------
// Static test definition counter
// ---------------------------------------------------------------------------

/**
 * Recursively walks a directory tree, yielding file paths.
 *
 * @param {string} dir
 * @param {string[]} [exclude] - Path substrings to skip
 * @returns {AsyncGenerator<string>}
 */
async function* walkDir(dir, exclude = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // directory does not exist — skip silently
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (exclude.some((ex) => fullPath.replace(/\\/g, '/').includes(ex))) continue;
    if (entry.isDirectory()) {
      yield* walkDir(fullPath, exclude);
    } else {
      yield fullPath;
    }
  }
}

/**
 * Counts test definitions (it/test call sites) across source directories.
 *
 * Scans *.test.{ts,tsx,js,jsx} files and counts occurrences of:
 *   it(, test(, it.each(, test.each(, it.skip(, test.skip(, it.only(, test.only(
 *
 * Parameterized tests (it.each) are counted as one definition each, even
 * though they expand into multiple cases at runtime — so total_tests_defined
 * may be lower than total_tests_run.
 *
 * @param {string[]} rootDirs - Directories to scan
 * @param {string[]} [excludePaths] - Path substrings to exclude
 * @returns {Promise<number>}
 */
async function countDefinedTests(rootDirs, excludePaths = []) {
  const testFileRe = /\.test\.(ts|tsx|js|jsx)$/;
  // Matches: it(  test(  it.each(  test.skip(  it.only(  etc.
  const testCallRe = /\b(?:it|test)(?:\.(?:each|skip|only|concurrent))?\s*\(/g;
  let count = 0;
  for (const dir of rootDirs) {
    for await (const filePath of walkDir(dir, excludePaths)) {
      if (!testFileRe.test(filePath)) continue;
      const content = await readFile(filePath, 'utf8');
      const matches = content.match(testCallRe);
      if (matches) count += matches.length;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Collectors
// ---------------------------------------------------------------------------

/**
 * Downloads all unit-test-results-* shard artifacts (JUnit XML), parses them,
 * and returns test counts grouped by feature folder.
 *
 * Also counts test definitions via static source analysis.
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
  const shardArtifacts = artifacts.filter((a) => /^unit-test-results-\d+$/.test(a.name));
  console.log(`[unit] found ${shardArtifacts.length} shard artifact(s)`);

  if (shardArtifacts.length === 0) return {};

  const folderCounts = {};
  let total = 0;
  let skipped = 0;

  for (const artifact of shardArtifacts) {
    const destDir = await downloadArtifact(artifact.name);
    const raw = await readFile(join(destDir, 'junit.xml'), 'utf8');
    const { total: shardTotal, skipped: shardSkipped, perFile } = parseJUnitXml(raw);
    total += shardTotal;
    skipped += shardSkipped;

    for (const [filePath, count] of Object.entries(perFile)) {
      const folder = getFeatureFolder(filePath);
      folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
    }
  }

  console.log(`[unit] total: ${total}, skipped: ${skipped}`);

  // Static count: scan unit test source files (excludes e2e and integration)
  const defined = await countDefinedTests(
    ['ui', 'app', 'shared'],
    ['node_modules'],
  );
  console.log(`[unit] defined: ${defined}`);

  const result = { total_tests_run: total, total_tests_skipped: skipped, total_tests_defined: defined };
  for (const [folder, count] of Object.entries(folderCounts)) {
    if (minFolderCount > 0 && count < minFolderCount) {
      result.other_tests_run = (result.other_tests_run ?? 0) + count;
    } else {
      result[`${folder}_tests_run`] = count;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Integration test helpers
// ---------------------------------------------------------------------------

/**
 * Maps an integration test file path to a feature category.
 *
 * Extracts the top-level subdirectory under test/integration/:
 *   test/integration/confirmations/... → confirmations
 *   test/integration/swaps/...         → swaps
 *   Anything else                      → other
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
 * Downloads the integration-test-results artifact (single, no sharding),
 * parses the JUnit XML, and returns test counts grouped by feature folder.
 *
 * Also counts test definitions via static source analysis.
 *
 * @returns {Promise<Record<string, number>>}
 */
async function collectIntegrationTestCount() {
  console.log('[integration] collecting per-suite counts from artifact...');

  const artifacts = await getArtifactList();
  const artifact = artifacts.find((a) => a.name === 'integration-test-results');

  if (!artifact) {
    console.log('[integration] artifact not found — integration tests did not run, skipping');
    return {};
  }

  const destDir = await downloadArtifact(artifact.name);
  const raw = await readFile(join(destDir, 'junit.xml'), 'utf8');
  const { total, skipped, perFile } = parseJUnitXml(raw);

  console.log(`[integration] total: ${total}, skipped: ${skipped}`);

  const folderCounts = {};
  for (const [filePath, count] of Object.entries(perFile)) {
    const folder = getIntegrationFeatureFolder(filePath);
    folderCounts[folder] = (folderCounts[folder] ?? 0) + count;
  }

  // Static count: scan integration test source files
  const defined = await countDefinedTests(['test/integration'], ['node_modules']);
  console.log(`[integration] defined: ${defined}`);

  const result = { total_tests_run: total, total_tests_skipped: skipped, total_tests_defined: defined };
  for (const [folder, count] of Object.entries(folderCounts)) {
    result[`${folder}_tests_run`] = count;
  }

  return result;
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
  // Presets are defined as string literals under STARTUP_PRESETS, INTERACTION_PRESETS,
  // and USER_JOURNEY_PRESETS and follow the pattern: startup*, interaction*, userJourney*.
  const presets = new Set();
  for (const m of raw.matchAll(/'((?:startup|interaction|userJourney)[A-Z][a-zA-Z]*)'/g)) {
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
