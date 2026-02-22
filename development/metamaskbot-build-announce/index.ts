import { version as VERSION } from '../../package.json';
import { getPageLoadBenchmarkComment } from '../page-load-benchmark-pr-comment';
import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
} from '../../shared/constants/benchmarks';
import {
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
} from '../../test/e2e/benchmarks/utils/constants';
import {
  type PageLoadBenchmarkResults,
  getArtifactLinks,
  buildBenchmarkSectionComment,
  buildPageLoadTable,
  runBenchmarkGate,
  safeBuildSection,
  buildArtifactsBody,
  fetchPageLoadResults,
  buildBundleSizeDiffSection,
  postCommentWithMetamaskBot,
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
    version: VERSION,
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
    benchmarkResults[BENCHMARK_PLATFORMS.CHROME]?.[
      BENCHMARK_BUILD_TYPES.BROWSERIFY
    ]?.[STARTUP_PRESETS.STANDARD_HOME];
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
