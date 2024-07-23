import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

import { retrieveLabel } from './shared/label';
import { Labelable, addLabelByIdToLabelable } from './shared/labelable';
import { retrievePullRequest } from './shared/pull-request';

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  // "GITHUB_TOKEN" is an automatically generated, repository-specific access token provided by GitHub Actions.
  // We can't use "GITHUB_TOKEN" here, as its permissions are scoped to the repository where the action is running.
  // "GITHUB_TOKEN" does not have access to other repositories, even when they belong to the same organization.
  // As we want to get files which are not necessarily located in the same repository,
  // we need to create our own "PERSONAL_ACCESS_TOKEN" with "repo" permissions.
  // Such a token allows to access other repositories of the MetaMask organisation.
  const personalAccessToken = process.env.PERSONAL_ACCESS_TOKEN;
  if (!personalAccessToken) {
    core.setFailed('PERSONAL_ACCESS_TOKEN not found');
    process.exit(1);
  }

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

  // Get the team label id based on the author of the pull request
  const teamLabelId = await getTeamLabelIdByAuthor(
    octokit,
    pullRequestRepoOwner,
    pullRequestRepoName,
    pullRequest.author,
  );

  // Add the team label by id to the pull request
  await addLabelByIdToLabelable(octokit, pullRequest, teamLabelId);
}

// This helper function gets the team label id based on the author of the pull request
const getTeamLabelIdByAuthor = async (
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  author: string,
): Promise<string> => {
  // Retrieve the teams.json file from the repository
  const { data } = (await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    { owner: repoOwner, repo: 'MetaMask-planning', path: 'teams.json' },
  )) as { data: { content: string } };

  // Parse the teams.json file content to json from base64
  const teamMembers: Record<string, string> = JSON.parse(atob(data.content));

  // Get the label name based on the author
  const labelName = teamMembers[author];

  if (!labelName) {
    core.setFailed(`Team label not found for author: ${author}`);
    process.exit(1);
  }

  // Retrieve the label id based on the label name
  const labelId = await retrieveLabel(octokit, repoOwner, repoName, labelName);

  return labelId;
};
