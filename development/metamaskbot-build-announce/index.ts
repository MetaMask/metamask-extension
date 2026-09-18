import { version as VERSION } from '../../package.json';
import { getArtifactLinks, buildArtifactsBody } from './artifacts';
import { buildBundleSizeDiffSection } from './bundle-size';
import {
  extractWhatsInRc,
  buildWhatsInRcSection,
  buildWhatsInRcFailureSection,
} from './cherry-picks-section';
import { buildPerformanceBenchmarksSection } from './performance-benchmarks';
import { buildTestPlanSection } from './test-plan';
import { buildSectionWithFallback, postCommentWithMetamaskBot } from './utils';

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start(): Promise<void> {
  const {
    BUILD_ANNOUNCE_TOKEN,
    OWNER,
    REPOSITORY,
    RUN_ID,
    PR_NUMBER,
    HEAD_COMMIT_HASH,
    BUNDLE_SIZE_BASELINE_COMMIT_HASHES,
    HOST_URL,
    BUILDS_FROM_SHA,
    BUILDS_FROM_RUN,
    TEST_PLAN_VERSION,
    BRANCH,
  } = process.env;

  if (!PR_NUMBER) {
    console.warn(
      `No pull request detected for commit "${HEAD_COMMIT_HASH ?? 'unknown'}"`,
    );
    return;
  }

  if (
    !BUILD_ANNOUNCE_TOKEN ||
    !OWNER ||
    !REPOSITORY ||
    !RUN_ID ||
    !HEAD_COMMIT_HASH ||
    !HOST_URL
  ) {
    throw new Error(
      'Missing required environment variables: BUILD_ANNOUNCE_TOKEN, OWNER, REPOSITORY, RUN_ID, HEAD_COMMIT_HASH, HOST_URL',
    );
  }

  const artifacts = getArtifactLinks(
    HOST_URL,
    OWNER,
    REPOSITORY,
    BUILDS_FROM_RUN || RUN_ID,
  );

  const artifactsBody = buildArtifactsBody({
    hostUrl: HOST_URL,
    version: VERSION,
    shortSha: HEAD_COMMIT_HASH.slice(0, 7),
    artifacts,
    buildsFromSha: BUILDS_FROM_SHA
      ? BUILDS_FROM_SHA.slice(0, 7)
      : HEAD_COMMIT_HASH.slice(0, 7),
  });

  let commentBody = artifactsBody;

  commentBody += await buildSectionWithFallback(
    () => buildPerformanceBenchmarksSection(HOST_URL),
    'Performance benchmarks',
  );

  commentBody += await buildSectionWithFallback(
    () =>
      buildBundleSizeDiffSection(artifacts, BUNDLE_SIZE_BASELINE_COMMIT_HASHES),
    'Bundle size diffs',
  );

  // Add "What's in this RC" section for release branches
  const isReleaseBranch = BRANCH?.startsWith('release/');
  if (isReleaseBranch) {
    commentBody += await buildSectionWithFallback(async () => {
      try {
        const result = extractWhatsInRc();
        return buildWhatsInRcSection(result, RUN_ID) || null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildWhatsInRcFailureSection(message, RUN_ID);
      }
    }, "What's in this RC");
  }

  // Add AI-generated test plan section when a test plan was generated.
  if (TEST_PLAN_VERSION) {
    commentBody += await buildSectionWithFallback(
      () => buildTestPlanSection(HOST_URL, TEST_PLAN_VERSION),
      'AI Test Plan',
    );
  }

  await postCommentWithMetamaskBot({
    commentBody,
    owner: OWNER,
    repository: REPOSITORY,
    prNumber: PR_NUMBER,
    commentToken: BUILD_ANNOUNCE_TOKEN,
  });
}
