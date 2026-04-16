import { GitHub } from '@actions/github/lib/utils';

import { LabelableType, Labelable } from './labelable';
import { retrieveRepo } from './repo';

interface RawIssue {
  id: string;
  title: string;
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
}

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
            title
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
    `;

  const retrieveIssueResult: {
    repository: {
      issue: RawIssue;
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

// This function retrieves an issue by title on a specific repo
export async function retrieveIssueByTitle(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  issueTitle: string,
): Promise<Labelable | undefined> {
  const searchQuery = `repo:${repoOwner}/${repoName} type:issue in:title ${issueTitle}`;

  const retrieveIssueByTitleQuery = `
      query GetIssueByTitle($searchQuery: String!) {
        search(
            query: $searchQuery
            type: ISSUE
            first: 10
        ) {
            nodes {
                ... on Issue {
                    id
                    title
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
            issueCount
        }
      }
    `;

  const retrieveIssueByTitleResult: {
    search: {
      nodes: RawIssue[];
    };
  } = await octokit.graphql(retrieveIssueByTitleQuery, {
    searchQuery,
  });

  const issueWithSameTitle = retrieveIssueByTitleResult?.search?.nodes?.find(rawIssue => rawIssue.title === issueTitle);

  const issue: Labelable | undefined = issueWithSameTitle
    ? {
        id: issueWithSameTitle?.id,
        type: LabelableType.Issue,
        number: issueWithSameTitle?.number,
        repoOwner: repoOwner,
        repoName: repoName,
        createdAt: issueWithSameTitle?.createdAt,
        body: issueWithSameTitle?.body,
        author: issueWithSameTitle?.author?.login,
        labels: issueWithSameTitle?.labels?.nodes,
      }
    : undefined;

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
            title
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
          nodes: RawIssue[];
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
      (issue: RawIssue) => {
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

// This function creates an issue on a specific repo
export async function createIssue(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  issueTitle: string,
  issueBody: string,
  labelIds: string[],
): Promise<string> {
  // Retrieve PR's repo
  const repoId = await retrieveRepo(octokit, repoOwner, repoName);

  const createIssueMutation = `
      mutation CreateIssue($repoId: ID!, $issueTitle: String!, $issueBody: String!, $labelIds: [ID!]) {
        createIssue(input: {repositoryId: $repoId, title: $issueTitle, body: $issueBody, labelIds: $labelIds}) {
          issue {
            id
            title
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
    `;

  const createIssueResult: {
    createIssue: {
      issue: RawIssue;
    };
  } = await octokit.graphql(createIssueMutation, {
    repoId,
    issueTitle,
    issueBody,
    labelIds,
  });

  const issueId = createIssueResult?.createIssue?.issue?.id;

  return issueId;
}
