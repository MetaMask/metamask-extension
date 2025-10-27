import { postCommentWithMetamaskBot } from './utils/benchmark-utils';

async function start(): Promise<void> {
  const { PR_COMMENT_TOKEN, OWNER, REPOSITORY, PR_NUMBER, RUN_ID, JOB_NAME } =
    process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn('No pull request detected; skipping fixture announce');
    return;
  }

  const artifactName = JOB_NAME || 'export-onboarding-fixture';
  const artifactsUrl = `https://github.com/${OWNER}/${REPOSITORY}/actions/runs/${RUN_ID}#artifacts`;
  const exposedContent = '🧪 e2e Wallet State Fixture File';
  const hiddenContent = `<details><summary>${exposedContent}</summary>
<p>Download the onboarding fixture from the Actions artifacts:</p>
<ul>
  <li><b>Artifacts page:</b> <a href="${artifactsUrl}">${artifactsUrl}</a></li>
  <li><b>Artifact name:</b> ${artifactName}</li>
  <li><b>Path inside zip:</b> test-artifacts/onboarding-fixture/onboarding-fixture.json</li>
</ul>
</details>`;

  await postCommentWithMetamaskBot({
    commentBody: hiddenContent,
    owner: OWNER,
    repository: REPOSITORY,
    prNumber: PR_NUMBER,
    commentToken: PR_COMMENT_TOKEN,
    optionalLog: 'Posted Fixture Ready comment',
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
