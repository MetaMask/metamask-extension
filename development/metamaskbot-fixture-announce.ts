import { postCommentWithMetamaskBot } from './utils/benchmark-utils';

async function start(): Promise<void> {
  const {
    PR_COMMENT_TOKEN,
    OWNER,
    REPOSITORY,
    PR_NUMBER,
    RUN_ID,
    JOB_NAME,
    GITHUB_TOKEN,
  } = process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn('No pull request detected; skipping fixture announce');
    return;
  }

  const artifactName = JOB_NAME || 'e2e-fixture-validation';
  const artifactPageUrl = await getArtifactPageUrl({
    owner: OWNER,
    repository: REPOSITORY,
    runId: RUN_ID,
    artifactName,
    token: GITHUB_TOKEN,
  });

  const title = '🧪 e2e Wallet State Fixture File';
  const linkLine = artifactPageUrl
    ? `Download the onboarding fixture: <a href="${artifactPageUrl}">${artifactPageUrl}</a>`
    : `Artifacts page: <a href="https://github.com/${OWNER}/${REPOSITORY}/actions/runs/${RUN_ID}#artifacts">View artifacts</a>`;
  const hiddenContent = `${title}\n\n${linkLine}`;

  await postCommentWithMetamaskBot({
    commentBody: hiddenContent,
    owner: OWNER,
    repository: REPOSITORY,
    prNumber: PR_NUMBER,
    commentToken: PR_COMMENT_TOKEN,
    optionalLog: 'Posted Fixture Ready comment',
  });
}

async function getArtifactPageUrl({
  owner,
  repository,
  runId,
  artifactName,
  token,
}: {
  owner: string;
  repository: string;
  runId: string;
  artifactName: string;
  token?: string;
}): Promise<string | null> {
  try {
    if (!token) {
      return null;
    }
    const url = `https://api.github.com/repos/${owner}/${repository}/actions/runs/${runId}/artifacts`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'metamaskbot',
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      artifacts?: { id: number; name: string }[];
    };
    const match = data.artifacts?.find((a) => a.name === artifactName);
    if (!match) {
      return null;
    }
    return `https://github.com/${owner}/${repository}/actions/runs/${runId}/artifacts/${match.id}`;
  } catch {
    return null;
  }
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
