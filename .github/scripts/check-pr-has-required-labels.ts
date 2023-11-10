import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { externalContributorLabel } from './shared/label';
import { Labelable } from './shared/labelable';
import { retrievePullRequest } from './shared/pull-request';

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  // "GITHUB_TOKEN" is an automatically generated, repository-specific access token provided by GitHub Actions.
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    core.setFailed('GITHUB_TOKEN not found');
    process.exit(1);
  }

  // Initialise octokit, required to call Github GraphQL API
  const octokit: InstanceType<typeof GitHub> = getOctokit(githubToken);

  // Retrieve pull request info from context
  const pullRequestRepoOwner = context.repo.owner;
  const pullRequestRepoName = context.repo.repo;
  const pullRequestNumber = context.payload.pull_request?.number;
  if (!pullRequestNumber) {
    core.setFailed('Pull request number not found');
    process.exit(1);
  }

  // Retrieve pull request labels
  const pullRequest: Labelable = await retrievePullRequest(
    octokit,
    pullRequestRepoOwner,
    pullRequestRepoName,
    pullRequestNumber,
  );
  const pullRequestLabels =
    pullRequest.labels?.map((labelObject) => labelObject?.name) || [];

  const preventMergeLabels = [
    'needs-qa',
    "QA'd but questions",
    'issues-found',
    'need-ux-ds-review',
    'blocked',
    'stale',
    'DO-NOT-MERGE',
  ];
  let hasTeamLabel = false;

  // Check pull request has at least required QA label and team label
  for (const label of pullRequestLabels) {
    if (label.startsWith('team-') || label === externalContributorLabel.name) {
      console.log(`PR contains a team label as expected: ${label}`);
      hasTeamLabel = true;
    }
    if (preventMergeLabels.includes(label)) {
      core.setFailed(
        `PR cannot be merged because it still contains this label: ${label}`,
      );
      process.exit(1);
    }
    if (hasTeamLabel) {
      return;
    }
  }

  // Otherwise, throw an arror to prevent from merging
  let errorMessage = '';
  if (!hasTeamLabel) {
    errorMessage += 'No team labels found on the PR. ';
  }
  errorMessage += `Please make sure the PR is appropriately labeled before merging it.\n\nSee labeling guidelines for more detail: https://github.com/MetaMask/metamask-extension/blob/develop/.github/LABELING_GUIDELINES.md`;
  core.setFailed(errorMessage);
  process.exit(1);
}
