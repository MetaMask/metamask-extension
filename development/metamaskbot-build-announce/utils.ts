/**
 * Cross-cutting utilities for the PR announcement comment builder.
 */

import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
} from '../../shared/constants/benchmarks';
import type { HistoricalBaselineReference } from './historical-comparison';

export const EXTENSION_BENCHMARK_STATS_MAIN_PERFORMANCE_DATA_URL =
  'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats/main/performance_data.json';

/**
 * Runs a section builder and returns its result, or a "data not available"
 * message for `sectionName` if the builder returns null/undefined/'' or throws.
 *
 * @param fn - Async builder function.
 * @param sectionName - Human-readable section name used in the fallback message.
 * @returns Resolved HTML or the fallback message.
 */
export function buildSectionWithFallback(
  fn: () => Promise<string | null | undefined>,
  sectionName: string,
): Promise<string> {
  const fallback = `<p><i>${sectionName}: data not available.</i></p>\n\n`;
  return fn()
    .then((result) => result || fallback)
    .catch((error: unknown) => {
      console.log(
        `No data available for ${sectionName}; skipping (${String(error)})`,
      );
      return fallback;
    });
}

/**
 * Uses Github API to post a comment to a PR with `metamaskbot`.
 *
 * @param param - Params object.
 * @param param.commentBody - Comment to post.
 * @param param.owner - Github repo owner.
 * @param param.repository - Github repository.
 * @param param.prNumber - PR Number.
 * @param [param.optionalLog] - Optional log for extra debug.
 * @param [param.commentToken] - PR secret comment token.
 * @returns A promise with response object or null.
 */
export async function postCommentWithMetamaskBot({
  commentBody,
  owner,
  repository,
  prNumber,
  optionalLog,
  commentToken,
}: {
  commentBody: string;
  owner: string;
  repository: string;
  prNumber: string;
  optionalLog?: string;
  commentToken?: string;
}): Promise<Response | null> {
  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/${owner}/${repository}/issues/${prNumber}/comments`;

  if (optionalLog) {
    console.log(optionalLog);
  }

  if (!commentToken) {
    return null;
  }

  console.log(`Posting to: ${POST_COMMENT_URI}`);

  const response = await fetch(POST_COMMENT_URI, {
    method: 'POST',
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      Authorization: `token ${commentToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Post comment failed with status '${response.statusText}': ${errorText}`,
    );
  }

  return response;
}

const ENTRY_KEY_SEPARATOR = '|';

const COMBO_SEPARATOR = '-';

/**
 * Builds a platform-buildType combo string.
 *
 * @param platform - Browser platform (e.g., 'chrome', 'firefox').
 * @param buildType - Build type (e.g., 'browserify', 'webpack').
 * @returns Combo string (e.g., 'chrome-browserify').
 */
export function buildCombo(platform: string, buildType: string): string {
  return `${platform}${COMBO_SEPARATOR}${buildType}`;
}

/**
 * Builds a unique key for a benchmark entry.
 * Used to track entries across different data structures (maps, lookups).
 *
 * @param benchmarkName - Benchmark name (e.g., 'loadNewAccount').
 * @param platform - Browser platform (e.g., 'chrome').
 * @param buildType - Build type (e.g., 'browserify').
 * @returns Entry key (e.g., 'loadNewAccount|chrome-browserify').
 */
export function buildEntryKey(
  benchmarkName: string,
  platform: string,
  buildType: string,
): string {
  return `${benchmarkName}${ENTRY_KEY_SEPARATOR}${buildCombo(platform, buildType)}`;
}

/**
 * Builds a CI artifact filename.
 *
 * @param platform - Browser platform (e.g., 'chrome').
 * @param buildType - Build type (e.g., 'browserify').
 * @param preset - Preset name (e.g., 'interactionUserActions').
 * @returns Artifact filename (e.g., 'benchmark-chrome-browserify-interactionUserActions.json').
 */
export function buildArtifactFilename(
  platform: string,
  buildType: string,
  preset: string,
): string {
  return `benchmark-${platform}-${buildType}-${preset}.json`;
}

/**
 * Builds a full CI artifact URL.
 *
 * @param hostUrl - Base URL for artifacts (e.g., 'https://ci.example.com').
 * @param platform - Browser platform (e.g., 'chrome').
 * @param buildType - Build type (e.g., 'browserify').
 * @param preset - Preset name (e.g., 'interactionUserActions').
 * @returns Full artifact URL.
 */
export function buildArtifactUrl(
  hostUrl: string,
  platform: string,
  buildType: string,
  preset: string,
): string {
  return `${hostUrl}/benchmarks/${buildArtifactFilename(platform, buildType, preset)}`;
}

/**
 * Maps preset names to their historical baseline keys.
 *
 * @param presetName - Preset name (e.g., 'startupStandardHome', 'interactionUserActions').
 * @returns Baseline preset key (e.g., 'pageLoad', 'interactionUserActions').
 */
function mapPresetToBaselineKey(presetName: string): string {
  if (presetName.startsWith('startup')) {
    return 'pageLoad';
  }
  return presetName;
}

/**
 * Resolves historical baseline metrics for a benchmark entry.
 *
 * Automatically maps startup preset names to 'pageLoad' since that's how
 * they're stored in the historical baseline data.
 *
 * @param baseline - Full historical reference map.
 * @param presetName - Preset name (e.g., 'startupStandardHome', 'interactionUserActions').
 * @param benchmarkName - Benchmark name (e.g., 'loadNewAccount', 'chrome-browserify-startupStandardHome').
 * @returns Baseline metrics or undefined if not found.
 *
 * @example
 * // Interaction benchmark
 * resolveBaseline(baseline, 'interactionUserActions', 'loadNewAccount')
 * // → looks up: 'interactionUserActions/loadNewAccount'
 *
 * @example
 * // Startup benchmark - preset name is automatically mapped to 'pageLoad'
 * resolveBaseline(baseline, 'startupStandardHome', 'chrome-browserify-startupStandardHome')
 * // → looks up: 'pageLoad/chrome-browserify-startupStandardHome'
 */
export function resolveBaseline(
  baseline: HistoricalBaselineReference,
  presetName: string,
  benchmarkName: string,
): HistoricalBaselineReference[string] | undefined {
  const baselinePresetKey = mapPresetToBaselineKey(presetName);
  const key = `${baselinePresetKey}/${benchmarkName}`;
  return baseline[key];
}

/**
 * Extracts the preset name from a CI artifact filename.
 *
 * Examples:
 * - `benchmark-chrome-browserify-interactionUserActions` → `interactionUserActions`
 * - `benchmark-firefox-webpack-startupStandardHome` → `pageLoad` (startup artifacts map to historical `pageLoad` key)
 *
 * @param artifactFileName - CI artifact filename without extension.
 * @returns Preset name, or undefined if not a valid artifact filename.
 */
export function extractPresetFromArtifactName(
  artifactFileName: string,
): string | undefined {
  const platforms = Object.values(BENCHMARK_PLATFORMS).join('|');
  const buildTypes = Object.values(BENCHMARK_BUILD_TYPES).join('|');
  const pattern = new RegExp(
    `^benchmark-(?:${platforms})-(?:${buildTypes})-(.+)$`,
    'u',
  );
  const match = pattern.exec(artifactFileName);
  if (!match) {
    return undefined;
  }

  const presetName = match[1];

  // Special case: startup benchmarks are stored under 'pageLoad' preset
  if (presetName.startsWith('startup')) {
    return 'pageLoad';
  }

  return presetName;
}

/**
 * Resolves baseline metrics using a CI artifact filename.
 *
 *
 * @param baseline - Full historical reference map.
 * @param benchmarkName - Benchmark name (e.g., 'loadNewAccount').
 * @param artifactFileName - CI artifact filename (e.g., 'benchmark-chrome-browserify-interactionUserActions').
 * @returns Baseline metrics or undefined if not found.
 */
export function resolveBaselineFromArtifactName(
  baseline: HistoricalBaselineReference,
  benchmarkName: string,
  artifactFileName: string,
): HistoricalBaselineReference[string] | undefined {
  const presetName = extractPresetFromArtifactName(artifactFileName);
  if (!presetName) {
    return undefined;
  }

  return resolveBaseline(baseline, presetName, benchmarkName);
}
