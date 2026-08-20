/**
 * GitHub Actions CLI for the merge-group retry guard.
 *
 * workflow_run is privileged and resolves this script from the default branch.
 * Before triage reruns failed jobs, this script proves the failed merge-group
 * commit is still queued, then writes `state=current` to GITHUB_OUTPUT. For a
 * stale or unverified entry, it publishes the terminal required status itself
 * so the merge queue can eject rather than remaining pending.
 */

import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import { verifyMergeQueueRetry } from './shared/merge-queue-entry.mts';

const REPO = process.env.REPO ?? '';
const PR_NUMBER = process.env.PR_NUMBER ?? '';
const HEAD_SHA = process.env.HEAD_SHA ?? '';
const HEAD_BRANCH = process.env.HEAD_BRANCH ?? '';
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT ?? '';

// These values describe the original failed workflow run, not the triage
// workflow. They are provided by triage-and-retry-system.yml.
if (!REPO || !PR_NUMBER || !HEAD_SHA || !HEAD_BRANCH) {
  throw new Error('REPO, PR_NUMBER, HEAD_SHA, and HEAD_BRANCH must be set');
}

const [owner, repository] = REPO.split('/');
if (!owner || !repository) {
  throw new Error(`Invalid repository: ${REPO}`);
}

// The entry's head commit is more precise than checking merely whether the PR
// has some queue entry: GitHub may have rebuilt the entry on a newer SHA while
// this old workflow_run was waiting for triage.
const query = `query($owner: String!, $repository: String!, $prNumber: Int!) {
  repository(owner: $owner, name: $repository) {
    pullRequest(number: $prNumber) {
      mergeQueueEntry {
        headCommit {
          oid
        }
      }
    }
  }
}`;

const verification = await verifyMergeQueueRetry({
  expectedHeadSha: HEAD_SHA,
  getHeadSha: async () => {
    // GraphQL/CLI failures throw and are retried by verifyMergeQueueEntry.
    // A valid response with no entry intentionally returns null instead, which
    // is a confirmed stale result rather than an API failure.
    const response = JSON.parse(
      execFileSync(
        'gh',
        [
          'api',
          'graphql',
          '-f',
          `query=${query}`,
          '-F',
          `owner=${owner}`,
          '-F',
          `repository=${repository}`,
          '-F',
          `prNumber=${PR_NUMBER}`,
        ],
        { encoding: 'utf8' },
      ),
    ) as {
      data?: {
        repository?: {
          pullRequest?: {
            mergeQueueEntry?: { headCommit?: { oid?: string } };
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (response.errors?.length) {
      // GitHub may return GraphQL errors in a successful CLI response; convert
      // them to a thrown error so the bounded retry policy still applies.
      throw new Error(response.errors.map(({ message }) => message).join('; '));
    }

    return (
      response.data?.repository?.pullRequest?.mergeQueueEntry?.headCommit?.oid ??
      null
    );
  },
  refExists: async () => {
    try {
      // Verify the exact temporary ref from the failed run. A current queue
      // entry alone is insufficient if GitHub has already deleted this ref.
      execFileSync(
        'gh',
        ['api', `repos/${REPO}/git/ref/heads/${HEAD_BRANCH}`],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      );
      return true;
    } catch (error) {
      const stderr = String(
        (error as { stderr?: unknown }).stderr ?? '',
      );
      if (stderr.includes('HTTP 404')) {
        return false;
      }

      // Non-404 API failures are unverified, not proof that GitHub removed
      // the ref. verifyMergeQueueRetry converts this to its fail-closed state.
      throw error;
    }
  },
});

console.log(`Merge queue entry verification: ${verification.state}`);
if (GITHUB_OUTPUT) {
  // The workflow only invokes `gh run rerun --failed` when this is current.
  appendFileSync(GITHUB_OUTPUT, `state=${verification.state}\n`);
}

if (verification.state !== 'current') {
  // ci-status-gate deferred All jobs pass while retry was possible. Once this
  // guard rejects retrying, publish a final failure so ALLGREEN can eject the
  // entry instead of leaving the required status pending.
  const description =
    verification.state === 'stale'
      ? 'Merge queue entry was replaced — skipping retry'
      : 'Could not verify merge queue entry — skipping retry';
  console.warn(description);
  // This status belongs on the failed merge-group SHA, not the triage SHA.
  execFileSync(
    'gh',
    [
      'api',
      `repos/${REPO}/statuses/${HEAD_SHA}`,
      '--method',
      'POST',
      '-f',
      'state=failure',
      '-f',
      'context=All jobs pass',
      '-f',
      `description=${description}`,
    ],
    { stdio: 'inherit' },
  );
}
