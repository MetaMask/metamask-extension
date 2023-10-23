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
