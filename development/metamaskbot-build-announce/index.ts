import { version as VERSION } from '../../package.json';
import { getArtifactLinks, buildArtifactsBody } from './artifacts';
import { buildBundleSizeDiffSection } from './bundle-size';
import { getDappBenchmarkComment } from './dapp-benchmarks';
import { buildPerformanceBenchmarksSection } from './performance-benchmarks';
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

  let commentBody = artifactsBody;

  commentBody += await buildSectionWithFallback(
    () => buildPerformanceBenchmarksSection(HOST_URL),
    'Performance benchmarks',
  );

  commentBody += await buildSectionWithFallback(
    () => getDappBenchmarkComment(),
    'Dapp page load benchmarks',
  );

  commentBody += await buildSectionWithFallback(
    () => buildBundleSizeDiffSection(artifacts, MERGE_BASE_COMMIT_HASH),
    'Bundle size diffs',
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
