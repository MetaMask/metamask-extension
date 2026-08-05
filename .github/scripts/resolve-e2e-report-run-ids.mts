import { appendFileSync } from 'node:fs';
import { ghApi } from './shared/gh-api.mts';
import { fileURLToPath } from 'node:url';

/**
 * Pages back through an artifact's history until a copy from `branch` turns up.
 *
 * The API returns artifacts newest-first, so the first page containing a match also holds
 * the newest match.
 *
 * @param options - Owner, repository, branch, and the exact artifact name to look for.
 * @returns The owning run ID, or `undefined` if no usable copy exists.
 */
function resolveLatestArtifactRunId({
  owner,
  repo,
  branch,
  artifactName,
}: {
  owner: string;
  repo: string;
  branch: string;
  artifactName: string;
}): number | undefined {
  for (let page = 1; ; page += 1) {
    let response: string;

    try {
      response = ghApi(
        `/repos/${owner}/${repo}/actions/artifacts?name=${artifactName}&per_page=100&page=${page}`,
      );
    } catch (error) {
      // Give up quietly rather than failing the job over shard balance.
      console.warn(`Could not list '${artifactName}' artifacts: ${error}`);
      return undefined;
    }

    const artifacts: {
      expired: boolean;
      created_at: string;
      workflow_run?: { id: number; head_branch: string } | null;
    }[] = JSON.parse(response).artifacts ?? [];

    // An empty page means the history is exhausted.
    if (artifacts.length === 0) {
      return undefined;
    }

    // The endpoint is not branch-scoped and PR runs upload reports under the same names, so
    // filter here. Sorting locally avoids depending on the ordering within a page.
    const [latestArtifact] = artifacts
      .filter(
        (artifact) =>
          !artifact.expired && artifact.workflow_run?.head_branch === branch,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (latestArtifact?.workflow_run) {
      return latestArtifact.workflow_run.id;
    }
  }
}

const reports = [
  { output: 'chrome-run-id', artifactName: 'test-e2e-chrome-report' },
  { output: 'firefox-run-id', artifactName: 'test-e2e-firefox-report' },
] as const;

function main(): void {
  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    DEFAULT_BRANCH: process.env.DEFAULT_BRANCH || 'main',
    GITHUB_OUTPUT: process.env.GITHUB_OUTPUT || '',
  };

  const outputs = reports.map(({ output, artifactName }) => {
    const runId = resolveLatestArtifactRunId({
      owner: env.OWNER,
      repo: env.REPOSITORY,
      branch: env.DEFAULT_BRANCH,
      artifactName,
    });

    console.log(`${artifactName} from run: ${runId ?? 'none available'}`);

    return `${output}=${runId ?? ''}`;
  });

  if (env.GITHUB_OUTPUT) {
    appendFileSync(env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
  }
}

// If main module (i.e. this is the TS file that was run directly)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
