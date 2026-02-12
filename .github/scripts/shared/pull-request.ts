import { GitHub } from '@actions/github/lib/utils';

import { LabelableType, Labelable } from './labelable';

// This function retrieves a pull request on a specific repo
export async function retrievePullRequest(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  prNumber: number,
): Promise<Labelable> {
  const retrievePullRequestQuery = `
    query RetrievePullRequestLabels($repoOwner: String!, $repoName: String!, $prNumber: Int!) {
      repository(owner: $repoOwner, name: $repoName) {
        pullRequest(number: $prNumber) {
          id
          createdAt
          body
          author {
            login
          }
          labels(first: 100) {
            nodes {
                id
                name
            }
          }
        }
      }
    }
  `;

  const retrievePullRequestResult: {
    repository: {
      pullRequest: {
        id: string;
        createdAt: string;
        body: string;
        author: {
          login: string;
        };
        labels: {
          nodes: {
            id: string;
            name: string;
          }[];
        };
      };
    };
  } = await octokit.graphql(retrievePullRequestQuery, {
    repoOwner,
    repoName,
    prNumber,
  });

  const pullRequest: Labelable = {
    id: retrievePullRequestResult?.repository?.pullRequest?.id,
    type: LabelableType.PullRequest,
    number: prNumber,
    repoOwner: repoOwner,
    repoName: repoName,
    createdAt: retrievePullRequestResult?.repository?.pullRequest?.createdAt,
    body: retrievePullRequestResult?.repository?.pullRequest?.body,
    author: retrievePullRequestResult?.repository?.pullRequest?.author?.login,
    labels: retrievePullRequestResult?.repository?.pullRequest?.labels?.nodes,
  };

  return pullRequest;
}

export type PullRequestFile = {
  filename: string;
  additions: number;
  deletions: number;
}

/**
 * Retrieves files changed in a specific pull request
 * @param octokit GitHub API client
 * @param repoOwner Repository owner (e.g., "MetaMask")
 * @param repoName Repository name (e.g., "metamask-extension")
 * @param prNumber Pull request number
 * @returns Array of filenames that were changed in the PR
 */
export async function retrievePullRequestFiles(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  prNumber: number,
): Promise<PullRequestFile[]> {
  const response = await octokit.rest.pulls.listFiles({
    owner: repoOwner,
    repo: repoName,
    pull_number: prNumber,
  });

  return response.data.map((file) => ({
    filename: file.filename,
    additions: file.additions || 0,
    deletions: file.deletions || 0,
  }));
}