import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

import { retrieveLinkedIssues } from './shared/issue';
import { Label } from './shared/label';
import { Labelable, addLabelToLabelable } from './shared/labelable';
import { retrievePullRequest } from './shared/pull-request';

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  // "GITHUB_TOKEN" is an automatically generated, repository-specific access token provided by GitHub Actions.
  // We can't use "GITHUB_TOKEN" here, as its permissions are scoped to the repository where the action is running.
  // "GITHUB_TOKEN" does not have access to other repositories, even when they belong to the same organization.
  // As we want to update linked issues which are not necessarily located in the same repository,
  // we need to create our own "RELEASE_LABEL_TOKEN" with "repo" permissions.
  // Such a token allows to access other repositories of the MetaMask organisation.
  const personalAccessToken = process.env.RELEASE_LABEL_TOKEN;
  if (!personalAccessToken) {
    core.setFailed('RELEASE_LABEL_TOKEN not found');
    process.exit(1);
  }

  const nextReleaseVersionNumber = process.env.NEXT_SEMVER_VERSION;
  if (!nextReleaseVersionNumber) {
    // NEXT_SEMVER_VERSION is automatically deduced as minor version bump on top of the latest version
    // found, either in repo's list of branches, or in repo's list of tags or in repo's "package.json" version.
    // For edge cases (e.g. major version bumps, etc.), where the value can not be deduced automatically,
    // NEXT_SEMVER_VERSION can be defined manually set by defining FORCE_NEXT_SEMVER_VERSION variable in
    // section "Secrets and variables">"Actions">"Variables">"New repository variable" in the settings of this repo.
    // Example value: 6.5.0
    core.setFailed('NEXT_SEMVER_VERSION not found');
    process.exit(1);
  }

  if (!isValidVersionFormat(nextReleaseVersionNumber)) {
    core.setFailed(
      `NEXT_SEMVER_VERSION (${nextReleaseVersionNumber}) is not a valid version format. The expected format is "x.y.z", where "x", "y" and "z" are numbers.`,
    );
    process.exit(1);
  }

  // Release label indicates the next release version number
  // Example release label: "release-6.5.0"
  const releaseLabel: Label = {
    name: `release-${nextReleaseVersionNumber}`,
    color: 'EDEDED',
    description: `Issue or pull request that will be included in release ${nextReleaseVersionNumber}`,
  };

  // Initialise octokit, required to call Github GraphQL API
  const octokit: InstanceType<typeof GitHub> = getOctokit(personalAccessToken, {
    previews: ['bane'], // The "bane" preview is required for adding, updating, creating and deleting labels.
  });

  // Retrieve pull request info from context
  const pullRequestRepoOwner = context.repo.owner;
  const pullRequestRepoName = context.repo.repo;
  const pullRequestNumber = context.payload.pull_request?.number;
  if (!pullRequestNumber) {
    core.setFailed('Pull request number not found');
    process.exit(1);
  }

  // Retrieve pull request
  const pullRequest: Labelable = await retrievePullRequest(
    octokit,
    pullRequestRepoOwner,
    pullRequestRepoName,
    pullRequestNumber,
  );

  // Add the release label to the pull request
  await addLabelToLabelable(octokit, pullRequest, releaseLabel);

  // Retrieve linked issues for the pull request
  const linkedIssues: Labelable[] = await retrieveLinkedIssues(
    octokit,
    pullRequestRepoOwner,
    pullRequestRepoName,
    pullRequestNumber,
  );

  // Add the release label to the linked issues
  for (const linkedIssue of linkedIssues) {
    await addLabelToLabelable(octokit, linkedIssue, releaseLabel);
  }
}

// This helper function checks if version has the correct format: "x.y.z" where "x", "y" and "z" are numbers.
function isValidVersionFormat(str: string): boolean {
  const regex = /^\d+\.\d+\.\d+$/;
  return regex.test(str);
}
