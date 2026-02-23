import { version as VERSION } from '../../package.json';
import { getPageLoadBenchmarkComment } from '../page-load-benchmark-pr-comment';
import { postCommentWithMetamaskBot } from '../utils/benchmark-utils';
import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import {
  type ArtifactLinks,
  type PageLoadBenchmarkResults,
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
  safeBuildSection,
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
  } = process.env;

  if (!PR_NUMBER) {
    console.warn(
      `No pull request detected for commit "${HEAD_COMMIT_HASH ?? 'unknown'}"`,
    );
    return;
  }

  if (
    !PR_COMMENT_TOKEN ||
    !OWNER ||
    !REPOSITORY ||
    !RUN_ID ||
    !HEAD_COMMIT_HASH ||
    !MERGE_BASE_COMMIT_HASH ||
    !HOST_URL
  ) {
    throw new Error(
      'Missing required environment variables: PR_COMMENT_TOKEN, OWNER, REPOSITORY, RUN_ID, HEAD_COMMIT_HASH, MERGE_BASE_COMMIT_HASH, HOST_URL',
    );
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

  commentBody += await safeBuildSection(
    'UI startup metrics',
    () => buildUiStartupSection(benchmarkResults, HOST_URL),
    '<p><i>Performance benchmarks: data not available.</i></p>\n\n',
  );

  commentBody += await safeBuildSection(
    'page load benchmarks',
    () => getPageLoadBenchmarkComment(),
    '<p><i>Dapp page load benchmarks: data not available.</i></p>\n\n',
  );

  commentBody += await safeBuildSection(
    'bundle size diffs',
    () => buildBundleSizeDiffSection(artifacts, MERGE_BASE_COMMIT_HASH),
    '<p><i>Bundle size diffs: data not available.</i></p>\n\n',
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
  artifacts: ArtifactLinks;
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
    `interaction-benchmark: ${artifacts.link('interactionStats')}`,
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
 * @returns Populated PageLoadBenchmarkResults object.
 */
async function fetchPageLoadResults(
  hostUrl: string,
): Promise<PageLoadBenchmarkResults> {
  const results = {} as PageLoadBenchmarkResults;

  for (const platform of BENCHMARK_PLATFORMS) {
    results[platform] = {} as PageLoadBenchmarkResults[typeof platform];
    for (const buildType of BENCHMARK_BUILD_TYPES) {
      results[platform][buildType] = {};
      for (const page of Object.values(STARTUP_PRESETS)) {
        try {
          const data = await fetchBenchmarkJson<Record<string, PageLoadEntry>>(
            hostUrl,
            platform,
            buildType,
            page,
          );
          // The JSON key is derived from the benchmark file name (e.g. standard-home.ts
          // → "standardHome"), not from the preset name ("startupStandardHome"). Use
          // the first (and only) value in the fetched object and store it under the
          // preset key so the rest of the pipeline stays consistent.
          const pageResult = data ? Object.values(data)[0] : undefined;
          if (pageResult) {
            results[platform][buildType][page] = pageResult;
          }
        } catch (error) {
          console.log(
            `Failed to fetch page load data for ${platform}/${buildType}/${page}: ${String(error)}`,
          );
        }
      }
    }
  }

  return results;
}

/**
 * Builds the full Performance Benchmarks collapsible section,
 * including interaction, startup, and user journey sub-sections.
 *
 * @param benchmarkResults - The page load benchmark results.
 * @param hostUrl - Base URL for CI artifacts.
 * @returns HTML string for the collapsible section, or empty string.
 */
async function buildUiStartupSection(
  benchmarkResults: PageLoadBenchmarkResults,
  hostUrl: string,
): Promise<string> {
  const sectionTitle = '⚡ Performance Benchmarks';
  const pageData =
    benchmarkResults[BENCHMARK_PLATFORMS[0]]?.[BENCHMARK_BUILD_TYPES[0]]?.[
      STARTUP_PRESETS.STANDARD_HOME
    ];
  const meanStartup = pageData?.mean?.uiStartup;
  const stdDevStartup = pageData?.stdDev?.uiStartup;
  const benchmarkSummary =
    meanStartup && stdDevStartup
      ? `${sectionTitle} (${Math.round(parseFloat(meanStartup))} ± ${Math.round(parseFloat(stdDevStartup))} ms)`
      : sectionTitle;

  const interactionHtml = await safeBuildSection('interaction benchmarks', () =>
    buildBenchmarkSectionComment(
      hostUrl,
      Object.values(INTERACTION_PRESETS),
      '👆 Interaction Benchmarks',
      'Action',
    ),
  );

  const pageLoadSection = await safeBuildSection('page load', () => {
    const table = buildPageLoadTable(benchmarkResults);
    return table
      ? `<details><summary>🔌 Startup Benchmarks</summary>${table}</details>\n\n`
      : '';
  });

  const userJourneyHtml = await safeBuildSection(
    'user journey benchmarks',
    () =>
      buildBenchmarkSectionComment(
        hostUrl,
        Object.values(USER_JOURNEY_PRESETS),
        '🧭 User Journey Benchmarks',
        'Benchmark',
      ),
  );

  let benchmarkWarnings = '';
  const cloudfrontUrl = process.env.CLOUDFRONT_REPO_URL;
  if (cloudfrontUrl) {
    const benchmarkGateUrl = `${cloudfrontUrl}/benchmark-gate/benchmark-gate.json`;
    benchmarkWarnings = await safeBuildSection('benchmark gate', () =>
      runBenchmarkGate(benchmarkResults, benchmarkGateUrl),
    );
  } else {
    console.log('CLOUDFRONT_REPO_URL not set, skipping benchmark gate');
  }

  const content = `${interactionHtml}${pageLoadSection}${userJourneyHtml}${benchmarkWarnings}`;
  if (!content) {
    return '';
  }

  return `<details><summary>${benchmarkSummary}</summary>\n<blockquote>\n${content}</blockquote>\n</details>\n\n`;
}

/**
 * Fetches bundle size stats and builds the bundle size diff collapsible section.
 *
 * @param artifacts - The artifact links object from getArtifactLinks.
 * @param mergeBaseCommitHash - The merge base commit hash for comparison.
 * @returns HTML string for the bundle size diff section, or empty string on error.
 */
async function buildBundleSizeDiffSection(
  artifacts: ArtifactLinks,
  mergeBaseCommitHash: string,
): Promise<string> {
  const prBundleSizeStatsResponse = await fetch(artifacts.bundleSizeStats.url);
  if (!prBundleSizeStatsResponse.ok) {
    throw new Error(
      `Failed to fetch prBundleSizeStats, status ${prBundleSizeStatsResponse.statusText}`,
    );
  }
  // This annotation narrows the untyped json() result to the known schema of the bundle size stats artifact.
  const prBundleSizeStats: Record<string, { size: number }> =
    await prBundleSizeStatsResponse.json();

  const devBundleSizeStatsResponse = await fetch(artifacts.bundleSizeData.url);
  if (!devBundleSizeStatsResponse.ok) {
    throw new Error(
      `Failed to fetch devBundleSizeStats, status ${devBundleSizeStatsResponse.statusText}`,
    );
  }
  // This annotation narrows the untyped json() result to the known schema of the dev bundle size data.
  const devBundleSizeStats: Record<
    string,
    Record<string, number>
  > = await devBundleSizeStatsResponse.json();

  const bundleParts = ['background', 'ui', 'common'] as const;
  type BundlePart = (typeof bundleParts)[number];

  const prSizes: Record<BundlePart, number> = {
    background: prBundleSizeStats.background.size,
    ui: prBundleSizeStats.ui.size,
    common: prBundleSizeStats.common.size,
  };

  const devSizes: Record<BundlePart, number> = {
    background: 0,
    ui: 0,
    common: 0,
  };
  for (const part of bundleParts) {
    devSizes[part] = devBundleSizeStats[mergeBaseCommitHash]?.[part] ?? 0;
  }

  const diffs: Record<BundlePart, number> = {
    background: 0,
    ui: 0,
    common: 0,
  };
  for (const part of bundleParts) {
    diffs[part] = prSizes[part] - devSizes[part];
  }

  const sizeDiffRows = bundleParts.map(
    (part) =>
      `${part}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
        devSizes[part],
        prSizes[part],
      )}%)`,
  );

  const sizeDiffHiddenContent = `<ul>${sizeDiffRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  const sizeDiffBackground = diffs.background + diffs.common;
  const sizeDiffUi = diffs.ui + diffs.common;

  let sizeDiffWarning: string | undefined;
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
}
