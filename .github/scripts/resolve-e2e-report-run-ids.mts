import { fileURLToPath } from 'node:url';
import {
  type GitHubOptions,
  type GitHub,
  createGitHubOptions,
} from './shared/github-options.mts';

const reports = [
  { output: 'chrome-run-id', artifactName: 'test-e2e-chrome-report' },
  { output: 'firefox-run-id', artifactName: 'test-e2e-firefox-report' },
] as const;

/**
 * Pages back through an artifact's history until a copy from `branch` turns up.
 *
 * @param options - Lookup parameters.
 * @param options.github - Authenticated GitHub client.
 * @param options.owner - Repository owner.
 * @param options.repo - Repository name.
 * @param options.branch - Branch whose artifacts we want.
 * @param options.artifactName - Exact artifact name to look for.
 * @returns The owning run ID, or `undefined` if no usable copy exists.
 */
async function resolveLatestArtifactRunId({
  github,
  owner,
  repo,
  branch,
  artifactName,
}: {
  github: GitHub;
  owner: string;
  repo: string;
  branch: string;
  artifactName: string;
}): Promise<number | undefined> {
  const pages = github.paginate.iterator(
    github.rest.actions.listArtifactsForRepo,
    { owner, repo, name: artifactName, per_page: 100 },
  );

  for await (const { data: artifacts } of pages) {
    const [latestArtifact] = artifacts
      .filter(
        (artifact) =>
          !artifact.expired && artifact.workflow_run?.head_branch === branch,
      )
      // ISO 8601 timestamps sort lexicographically, so this is chronological.
      // `created_at` is nullable in the API; treat a missing one as oldest rather than comparing null.
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

    if (latestArtifact?.workflow_run) {
      return latestArtifact.workflow_run.id;
    }
  }

  return undefined;
}

/**
 * Resolves the run IDs holding the latest available E2E reports, which
 * `split-tests-by-timings.mts` uses to balance the E2E shards.
 *
 * @param options - The objects injected by `actions/github-script`.
 * @param options.github - A pre-authenticated `octokit/rest.js` client with pagination plugins.
 * @param options.context - An object containing the context of the workflow run.
 * @param options.core - A reference to the `@actions/core` package.
 */
export async function resolveE2EReportRunIds({
  github,
  context,
  core,
}: GitHubOptions): Promise<void> {
  const { owner, repo } = context.repo;
  const branch: string | undefined = context.payload.repository?.default_branch;

  for (const { output, artifactName } of reports) {
    // Without a branch there is nothing to match, and paging the whole history would be
    // pointless work — leave the output empty and let the E2E runner split naively.
    const runId = branch
      ? await resolveLatestArtifactRunId({
          github,
          owner,
          repo,
          branch,
          artifactName,
        })
      : undefined;

    core.info(`${artifactName} from run: ${runId ?? 'none available'}`);
    core.setOutput(output, runId ? String(runId) : '');
  }
}

// If main module (i.e. this is the TS file that was run directly)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await resolveE2EReportRunIds(await createGitHubOptions());
}
