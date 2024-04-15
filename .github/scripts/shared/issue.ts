import { GitHub } from '@actions/github/lib/utils';

import { LabelableType, Labelable } from './labelable';

// This function retrieves an issue on a specific repo
export async function retrieveIssue(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  issueNumber: number,
): Promise<Labelable> {
  const retrieveIssueQuery = `
      query GetIssue($repoOwner: String!, $repoName: String!, $issueNumber: Int!) {
        repository(owner: $repoOwner, name: $repoName) {
          issue(number: $issueNumber) {
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

  const retrieveIssueResult: {
    repository: {
      issue: {
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
  } = await octokit.graphql(retrieveIssueQuery, {
    repoOwner,
    repoName,
    issueNumber,
  });

  const issue: Labelable = {
    id: retrieveIssueResult?.repository?.issue?.id,
    type: LabelableType.Issue,
    number: issueNumber,
    repoOwner: repoOwner,
    repoName: repoName,
    createdAt: retrieveIssueResult?.repository?.issue?.createdAt,
    body: retrieveIssueResult?.repository?.issue?.body,
    author: retrieveIssueResult?.repository?.issue?.author?.login,
    labels: retrieveIssueResult?.repository?.issue?.labels?.nodes,
  };

  return issue;
}

// This function retrieves the list of linked issues for a pull request
export async function retrieveLinkedIssues(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  prNumber: number,
): Promise<Labelable[]> {
  // We assume there won't be more than 100 linked issues
  const retrieveLinkedIssuesQuery = `
  query ($repoOwner: String!, $repoName: String!, $prNumber: Int!) {
    repository(owner: $repoOwner, name: $repoName) {
      pullRequest(number: $prNumber) {
        closingIssuesReferences(first: 100) {
          nodes {
            id
            number
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
            repository {
              name
              owner {
                login
              }
            }
          }
        }
      }
    }
  }
  `;

  const retrieveLinkedIssuesResult: {
    repository: {
      pullRequest: {
        closingIssuesReferences: {
          nodes: Array<{
            id: string;
            number: number;
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
            repository: {
              name: string;
              owner: {
                login: string;
              };
            };
          }>;
        };
      };
    };
  } = await octokit.graphql(retrieveLinkedIssuesQuery, {
    repoOwner,
    repoName,
    prNumber,
  });

  const linkedIssues: Labelable[] =
    retrieveLinkedIssuesResult?.repository?.pullRequest?.closingIssuesReferences?.nodes?.map(
      (issue: {
        id: string;
        number: number;
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
        repository: {
          name: string;
          owner: {
            login: string;
          };
        };
      }) => {
        return {
          id: issue?.id,
          type: LabelableType.Issue,
          number: issue?.number,
          repoOwner: issue?.repository?.owner?.login,
          repoName: issue?.repository?.name,
          createdAt: issue?.createdAt,
          body: issue?.body,
          author: issue?.author?.login,
          labels: issue?.labels?.nodes,
        };
      },
    ) || [];

  return linkedIssues;
}
