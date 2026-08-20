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
 * Walks completed `workflow` runs on `branch`, newest first, and returns the first one still
 * holding `artifactName`.
 *
 * Not a single `listArtifactsForRepo` call ranked by `created_at`, tempting as that is: a
 * re-run uploads a fresh artifact under an *older* `workflow_run.id`, so the newest upload can
 * belong to an older commit. Walking runs sidesteps that, because nothing can reorder them.
 *
 * @param options - Lookup parameters.
 * @param options.github - Authenticated GitHub client.
 * @param options.owner - Repository owner.
 * @param options.repo - Repository name.
 * @param options.branch - Branch whose runs we want.
 * @param options.workflow - Workflow file producing the artifact.
 * @param options.artifactName - Exact artifact name to look for.
 * @returns The owning run ID, or `undefined` if no usable copy exists.
 */
async function resolveLatestArtifactRunId({
  github,
  owner,
  repo,
  branch,
  workflow,
  artifactName,
}: {
  github: GitHub;
  owner: string;
  repo: string;
  branch: string;
  workflow: string;
  artifactName: string;
}): Promise<number | undefined> {
  // Artifacts expire after 90 days, so no older run can still hold a report. Truncated to
  // midnight UTC so the query is identical all day and independent of the machine's timezone.
  const artifactRetentionDays = 90;
  const oldestUsefulRun = new Date();
  oldestUsefulRun.setUTCDate(oldestUsefulRun.getUTCDate() - artifactRetentionDays);
  oldestUsefulRun.setUTCHours(0, 0, 0, 0);

  const workflowResponses = github.paginate.iterator(github.rest.actions.listWorkflowRuns, {
    owner,
    repo,
    branch,
    workflow_id: workflow,
    status: 'completed',
    created: `>=${oldestUsefulRun.toISOString()}`,
    per_page: 100,
  });

  for await (const workflowResponse of workflowResponses) {
    for (const workflowRun of workflowResponse.data) {
      const { data } = await github.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: workflowRun.id,
        name: artifactName,
        per_page: 100,
      });

      if (data.artifacts.some((artifact) => !artifact.expired)) {
        return workflowRun.id;
      }
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
  const workflow = 'main.yml';

  for (const { output, artifactName } of reports) {
    // Without a branch there is nothing to match, and paging the whole history would be
    // pointless work — leave the output empty and let the E2E runner split naively.
    const runId = branch
      ? await resolveLatestArtifactRunId({
          github,
          owner,
          repo,
          branch,
          workflow,
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
