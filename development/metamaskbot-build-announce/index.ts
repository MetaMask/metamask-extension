import { version as VERSION } from '../../package.json';
import { getPageLoadBenchmarkComment } from '../page-load-benchmark-pr-comment';
import { postCommentWithMetamaskBot } from '../utils/benchmark-utils';
import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
  PAGE_LOAD_PRESETS,
  USER_ACTION_PRESETS,
  PERFORMANCE_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import {
  type BenchmarkResults,
  type PageLoadEntry,
  getHumanReadableSize,
  getPercentageChange,
  getArtifactLinks,
  getBuildLinks,
  formatBuildLinks,
  discoverBundleArtifacts,
  fetchBenchmarkJson,
  buildBenchmarkSectionComment,
  buildPageLoadTable,
  runBenchmarkGate,
  BUNDLE_SIZE_THRESHOLD,
} from './utils';

start().catch(console.error);

async function start(): Promise<void> {
  const {
    PR_COMMENT_TOKEN,
    OWNER,
    REPOSITORY,
    RUN_ID,
    PR_NUMBER,
    HEAD_COMMIT_HASH,
    MERGE_BASE_COMMIT_HASH,
    HOST_URL,
    LAVAMOAT_POLICY_CHANGED,
    POST_NEW_BUILDS,
  } = process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn(`No pull request detected for commit "${HEAD_COMMIT_HASH}"`);
    return;
  }

  const artifacts = getArtifactLinks(HOST_URL, OWNER, REPOSITORY, RUN_ID);

  const artifactsBody = await buildArtifactsBody({
    hostUrl: HOST_URL,
    shortSha: HEAD_COMMIT_HASH.slice(0, 7),
    artifacts,
    postNewBuilds: POST_NEW_BUILDS === 'true',
    lavamoatPolicyChanged: LAVAMOAT_POLICY_CHANGED === 'true',
  });

  const benchmarkResults = await fetchPageLoadResults(HOST_URL);

  // Assemble comment body
  let commentBody = artifactsBody;

  commentBody += await buildUiStartupSection(benchmarkResults, HOST_URL);

  const pageLoadBenchmarkComment = await getPageLoadBenchmarkComment();
  if (pageLoadBenchmarkComment) {
    commentBody += pageLoadBenchmarkComment;
  }

  commentBody += await buildBundleSizeDiffSection(
    artifacts,
    MERGE_BASE_COMMIT_HASH,
  );

  await postCommentWithMetamaskBot({
    commentBody,
    owner: OWNER,
    repository: REPOSITORY,
    prNumber: PR_NUMBER,
    commentToken: PR_COMMENT_TOKEN,
    optionalLog: `Announcement:\n${commentBody}`,
  });
}

/**
 * Builds the collapsible "Builds ready" artifacts body for the PR comment.
 *
 * @param options - Configuration for the artifacts body.
 * @param options.hostUrl - Base URL for hosted artifacts.
 * @param options.shortSha - Abbreviated commit hash.
 * @param options.artifacts - Artifact links from getArtifactLinks.
 * @param options.postNewBuilds - Whether to include extension build links.
 * @param options.lavamoatPolicyChanged - Whether to include the LavaMoat viz link.
 * @returns Collapsible HTML string.
 */
async function buildArtifactsBody({
  hostUrl,
  shortSha,
  artifacts,
  postNewBuilds,
  lavamoatPolicyChanged,
}: {
  hostUrl: string;
  shortSha: string;
  artifacts: ReturnType<typeof getArtifactLinks>;
  postNewBuilds: boolean;
  lavamoatPolicyChanged: boolean;
}): Promise<string> {
  const contentRows: string[] = [];

  if (postNewBuilds) {
    contentRows.push(...formatBuildLinks(getBuildLinks(hostUrl, VERSION)));
  }

  if (lavamoatPolicyChanged) {
    contentRows.push(`lavamoat build viz: ${artifacts.link('depViz')}`);
  }

  const bundleMarkup = await discoverBundleArtifacts(hostUrl);

  contentRows.push(
    `bundle size: ${artifacts.link('bundleSizeStats')}`,
    `user-actions-benchmark: ${artifacts.link('userActionsStats')}`,
    `storybook: ${artifacts.link('storybook')}`,
    `typescript migration: ${artifacts.link('tsMigrationDashboard')}`,
    artifacts.link('allArtifacts'),
    `<details>
       <summary>bundle viz:</summary>
       ${bundleMarkup}
     </details>`,
  );

  const hiddenContent = `<ul>${contentRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  return `<details><summary>Builds ready [${shortSha}]</summary>${hiddenContent}</details>\n\n`;
}

/**
 * Fetches page load benchmark JSON data for all platform/buildType/preset combos.
 *
 * @param hostUrl - Base URL for CI artifacts.
 * @returns Populated BenchmarkResults object.
 */
async function fetchPageLoadResults(
  hostUrl: string,
): Promise<BenchmarkResults> {
  const results: BenchmarkResults = {};

  for (const platform of BENCHMARK_PLATFORMS) {
    results[platform] = {};
    for (const buildType of BENCHMARK_BUILD_TYPES) {
      results[platform][buildType] = {};
      for (const page of PAGE_LOAD_PRESETS) {
        const data = await fetchBenchmarkJson(
          hostUrl,
          platform,
          buildType,
          page,
        );
        if (data?.[page]) {
          results[platform][buildType][page] = data[
            page
          ] as unknown as PageLoadEntry;
        }
      }
    }
  }

  return results;
}

/**
 * Builds the full UI Startup Metrics collapsible section,
 * including user actions, page load, and performance sub-sections.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @param hostUrl - Base URL for CI artifacts.
 * @returns HTML string for the collapsible section, or empty string.
 */
async function buildUiStartupSection(
  benchmarkResults: BenchmarkResults,
  hostUrl: string,
): Promise<string> {
  const summaryPlatform = BENCHMARK_PLATFORMS[0];
  const summaryBuildType = BENCHMARK_BUILD_TYPES[0];
  const summaryPage = PAGE_LOAD_PRESETS[0];

  if (!benchmarkResults[summaryPlatform]?.[summaryBuildType]) {
    console.log(`No results for ${summaryPlatform} found; skipping benchmark`);
    return '';
  }

  try {
    const summaryPageStartup = Math.round(
      parseFloat(
        benchmarkResults[summaryPlatform][summaryBuildType][summaryPage].mean
          .uiStartup,
      ),
    );
    const summaryPageStartupStdDev = Math.round(
      parseFloat(
        benchmarkResults[summaryPlatform][summaryBuildType][summaryPage].stdDev
          .uiStartup,
      ),
    );
    const benchmarkSummary = `UI Startup Metrics (${summaryPageStartup} ± ${summaryPageStartupStdDev} ms)`;

    const pageLoadTable = buildPageLoadTable(benchmarkResults);
    const pageLoadSection = `<details><summary>📊 Page Load</summary>${pageLoadTable}</details>\n\n`;

    const benchmarkGateUrl = `${process.env.CLOUDFRONT_REPO_URL}/benchmark-gate/benchmark-gate.json`;
    const benchmarkWarnings = await runBenchmarkGate(
      benchmarkResults,
      benchmarkGateUrl,
    );

    const userActionsHtml = await buildBenchmarkSectionComment(
      hostUrl,
      USER_ACTION_PRESETS,
      '🏃 User Actions Benchmark',
      'Action',
    );

    const performanceHtml = await buildBenchmarkSectionComment(
      hostUrl,
      PERFORMANCE_PRESETS,
      '⚡ Performance Benchmarks',
      'Benchmark',
    );

    return `<details><summary>${benchmarkSummary}</summary>${userActionsHtml}${pageLoadSection}${performanceHtml}${benchmarkWarnings}</details>\n\n`;
  } catch (error) {
    console.error(`Error constructing benchmark results: '${String(error)}'`);
    return '';
  }
}

/**
 * Fetches bundle size stats and builds the bundle size diff collapsible section.
 *
 * @param artifacts - The artifact links object from getArtifactLinks.
 * @param mergeBaseCommitHash - The merge base commit hash for comparison.
 * @returns HTML string for the bundle size diff section, or empty string on error.
 */
async function buildBundleSizeDiffSection(
  artifacts: ReturnType<typeof getArtifactLinks>,
  mergeBaseCommitHash: string,
): Promise<string> {
  try {
    const prBundleSizeStatsResponse = await fetch(
      artifacts.bundleSizeStats.url,
    );
    if (!prBundleSizeStatsResponse.ok) {
      throw new Error(
        `Failed to fetch prBundleSizeStats, status ${prBundleSizeStatsResponse.statusText}`,
      );
    }
    const prBundleSizeStats = await prBundleSizeStatsResponse.json();

    const devBundleSizeStatsResponse = await fetch(
      artifacts.bundleSizeData.url,
    );
    if (!devBundleSizeStatsResponse.ok) {
      throw new Error(
        `Failed to fetch devBundleSizeStats, status ${devBundleSizeStatsResponse.statusText}`,
      );
    }
    const devBundleSizeStats = await devBundleSizeStatsResponse.json();

    const prSizes = {
      background: prBundleSizeStats.background.size,
      ui: prBundleSizeStats.ui.size,
      common: prBundleSizeStats.common.size,
    };

    const devSizes = Object.keys(prSizes).reduce(
      (sizes, part) => {
        sizes[part as keyof typeof prSizes] =
          devBundleSizeStats[mergeBaseCommitHash][part] || 0;
        return sizes;
      },
      {} as Record<keyof typeof prSizes, number>,
    );

    const diffs = Object.keys(prSizes).reduce(
      (output, part) => {
        output[part] =
          prSizes[part as keyof typeof prSizes] -
          devSizes[part as keyof typeof prSizes];
        return output;
      },
      {} as Record<string, number>,
    );

    const sizeDiffRows = Object.keys(diffs).map(
      (part) =>
        `${part}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
          devSizes[part as keyof typeof prSizes],
          prSizes[part as keyof typeof prSizes],
        )}%)`,
    );

    const sizeDiffHiddenContent = `<ul>${sizeDiffRows
      .map((row) => `<li>${row}</li>`)
      .join('\n')}</ul>`;

    const sizeDiffBackground = diffs.background + diffs.common;
    const sizeDiffUi = diffs.ui + diffs.common;

    let sizeDiffWarning;
    if (
      sizeDiffBackground > BUNDLE_SIZE_THRESHOLD ||
      sizeDiffUi > BUNDLE_SIZE_THRESHOLD
    ) {
      sizeDiffWarning = `🚨 Warning! Bundle size has increased!`;
    } else if (
      sizeDiffBackground < -BUNDLE_SIZE_THRESHOLD ||
      sizeDiffUi < -BUNDLE_SIZE_THRESHOLD
    ) {
      sizeDiffWarning = `🚀 Bundle size reduced!`;
    }

    const sizeDiffExposedContent = sizeDiffWarning
      ? `Bundle size diffs [${sizeDiffWarning}]`
      : `Bundle size diffs`;

    return `<details><summary>${sizeDiffExposedContent}</summary>${sizeDiffHiddenContent}</details>\n\n`;
  } catch (error) {
    console.error(
      `Error constructing bundle size diffs results: '${String(error)}'`,
    );
    return '';
  }
}
