import { version as VERSION } from '../../package.json';
import { getArtifactLinks, buildArtifactsBody } from './artifacts';
import { buildBundleSizeDiffSection } from './bundle-size';
import { buildPerformanceBenchmarksSection } from './performance-benchmarks';
import { buildTestPlanSection } from './test-plan';
import { buildSectionWithFallback, postCommentWithMetamaskBot } from './utils';

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
    BUILDS_FROM_SHA,
    BUILDS_FROM_RUN,
    TEST_PLAN_VERSION,
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
    () => buildBundleSizeDiffSection(artifacts, MERGE_BASE_COMMIT_HASH),
    'Bundle size diffs',
  );

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
    commentToken: PR_COMMENT_TOKEN,
  });
}
