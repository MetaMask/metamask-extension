import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

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
  const prRepoOwner = context.repo.owner;
  const prRepoName = context.repo.repo;
  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    core.setFailed('Pull request number not found');
    process.exit(1);
  }

  // Retrieve pull request labels
  const prLabels = await retrievePullRequestLabels(octokit, prRepoOwner, prRepoName, prNumber);

  const preventMergeLabels = ["needs-qa", "QA'd but questions", "issues-found"];

  let hasTeamLabel = false;

  // Check pull request has at least required QA label and team label
  for (const label of prLabels) {
    if (label.startsWith("team-") || label === "external-contributor") {
      console.log(`PR contains a team label as expected: ${label}`);
      hasTeamLabel = true;
    }
    if (preventMergeLabels.includes(label)) {
      throw new Error(`PR cannot be merged because it still contains this label: ${label}`);
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
  errorMessage += 'Please add the required label(s) before merging the PR.';
  throw new Error(errorMessage);

}

// This function retrieves the pull request on a specific repo
async function retrievePullRequestLabels(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, prNumber: number): Promise<string[]> {

  const retrievePullRequestLabelsQuery = `
    query RetrievePullRequestLabels($repoOwner: String!, $repoName: String!, $prNumber: Int!) {
      repository(owner: $repoOwner, name: $repoName) {
        pullRequest(number: $prNumber) {
          labels(first: 100) {
            nodes {
                name
            }
          }
        }
      }
    }
  `;

  const retrievePullRequestLabelsResult: {
    repository: {
      pullRequest: {
        labels: {
          nodes: {
            name: string;
          }[];
        }
      };
    };
  } = await octokit.graphql(retrievePullRequestLabelsQuery, {
    repoOwner,
    repoName,
    prNumber,
  });

  const pullRequestLabels = retrievePullRequestLabelsResult?.repository?.pullRequest?.labels?.nodes?.map(labelObject => labelObject?.name);

  return pullRequestLabels || [];
}
