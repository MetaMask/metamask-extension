import { GitHub } from '@actions/github/lib/utils';
import { isValidDateFormat } from './utils';

const MAX_NB_FETCHES = 10; // For protection against infinite loops.

export interface GithubProject {
  id: string;
  fields: GithubProjectField[];
}

export interface GithubProjectField {
  id: string;
  name: string;
}

export interface GithubProjectIssueFieldValues {
  id: string; // ID of the issue (unrelated to the Github Project board)
  itemId: string; // ID of the issue, as an item of the Github Project board
  cutDate: string; // "RC cut date" field value of the issue, as an item of the Github Project board
}

interface RawGithubProjectIssueFieldValues {
  id: string;
  content: {
    id: string;
  };
  cutDate: {
    date: string;
  };
}

interface RawGithubProjectIssuesFieldValues {
  pageInfo: {
    endCursor: string;
  };
  nodes: RawGithubProjectIssueFieldValues[];
}

// This function retrieves a Github Project
export async function retrieveGithubProject(
  octokit: InstanceType<typeof GitHub>,
  projectNumber: number,
): Promise<GithubProject> {
  const retrieveProjectQuery = `
      query ($projectNumber: Int!) {
        organization(login: "MetaMask") {
            projectV2(number: $projectNumber) {
                id
                fields(first: 20) {
                    nodes {
                        ... on ProjectV2Field {
                            id
                            name
                        }
                    }
                }
            }
        }
      }
    `;

  const retrieveProjectResult: {
    organization: {
      projectV2: {
        id: string;
        fields: {
          nodes: {
            id: string;
            name: string;
          }[];
        };
      };
    };
  } = await octokit.graphql(retrieveProjectQuery, {
    projectNumber,
  });

  const project: GithubProject = {
    id: retrieveProjectResult?.organization?.projectV2?.id,
    fields: retrieveProjectResult?.organization.projectV2?.fields?.nodes,
  };

  if (!project) {
    throw new Error(`Project with number ${projectNumber} was not found.`);
  }

  if (!project.id) {
    throw new Error(`Project with number ${projectNumber} was found, but it has no 'id' property.`);
  }

  if (!project.fields) {
    throw new Error(`Project with number ${projectNumber} was found, but it has no 'fields' property.`);
  }

  return project;
}

// This function retrieves a Github Project's issues' field values
export async function retrieveGithubProjectIssuesFieldValues(
  octokit: InstanceType<typeof GitHub>,
  projectId: string,
  cursor: string | undefined,
): Promise<RawGithubProjectIssuesFieldValues> {
  const after = cursor ? `after: "${cursor}"` : '';

  const retrieveProjectIssuesFieldValuesQuery = `
      query ($projectId: ID!) {
          node(id: $projectId) {
              ... on ProjectV2 {
                  items(
                      first: 100
                      ${after}
                  ) {
                      pageInfo {
                          endCursor
                      }
                      nodes {
                          id
                          content {
                              ... on Issue {
                                  id
                              }
                          }
                          cutDate: fieldValueByName(name: "RC Cut") {
                              ... on ProjectV2ItemFieldDateValue {
                                  date
                              }
                          }
                      }
                  }
              }
          }
      }
    `;

  const retrieveProjectIssuesFieldValuesResult: {
    node: {
      items: {
        totalCount: number;
        pageInfo: {
          endCursor: string;
        };
        nodes: {
          id: string;
          content: {
            id: string;
          };
          cutDate: {
            date: string;
          };
        }[];
      };
    };
  } = await octokit.graphql(retrieveProjectIssuesFieldValuesQuery, {
    projectId,
  });

  const projectIssuesFieldValues: RawGithubProjectIssuesFieldValues = retrieveProjectIssuesFieldValuesResult.node.items;

  return projectIssuesFieldValues;
}

// This function retrieves a Github Project's issue field values recursively
export async function retrieveGithubProjectIssueFieldValuesRecursively(
  nbFetches: number,
  octokit: InstanceType<typeof GitHub>,
  projectId: string,
  issueId: string,
  cursor: string | undefined,
): Promise<GithubProjectIssueFieldValues | undefined> {
  if (nbFetches >= MAX_NB_FETCHES) {
    throw new Error(`Forbidden: Trying to do more than ${MAX_NB_FETCHES} fetches (${nbFetches}).`);
  }

  const projectIssuesFieldValuesResponse: RawGithubProjectIssuesFieldValues = await retrieveGithubProjectIssuesFieldValues(
    octokit,
    projectId,
    cursor,
  );

  const projectIssueFieldValuesResponseWithSameId: RawGithubProjectIssueFieldValues | undefined =
    projectIssuesFieldValuesResponse.nodes.find(
      (issue) => issue.content?.id === issueId
    ); // 'issue.content' can be equal to null in edge case where the Github Project board includes private repo issues that can't be accessed by the access token we're using

  if (projectIssueFieldValuesResponseWithSameId) {
    const projectIssueFieldValues: GithubProjectIssueFieldValues = {
      id: projectIssueFieldValuesResponseWithSameId.content?.id,
      itemId: projectIssueFieldValuesResponseWithSameId.id,
      cutDate: projectIssueFieldValuesResponseWithSameId.cutDate?.date,
    };
    return projectIssueFieldValues;
  }

  const newCursor = projectIssuesFieldValuesResponse.pageInfo.endCursor;
  if (newCursor) {
    return await retrieveGithubProjectIssueFieldValuesRecursively(nbFetches + 1, octokit, projectId, issueId, newCursor);
  } else {
    return undefined;
  }
}

// This function adds an issue to a Github Project
export async function addIssueToGithubProject(
  octokit: InstanceType<typeof GitHub>,
  projectId: string,
  issueId: string,
): Promise<void> {
  const addIssueToProjectMutation = `
      mutation ($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          clientMutationId
        }
      }
    `;

  await octokit.graphql(addIssueToProjectMutation, {
    projectId: projectId,
    contentId: issueId,
  });
}

// This function updates Github Project issue's date field value
export async function updateGithubProjectDateFieldValue(
  octokit: InstanceType<typeof GitHub>,
  projectId: string,
  projectFieldId: string,
  issueId: string,
  newDatePropertyValue: string,
): Promise<void> {
  if (!isValidDateFormat(newDatePropertyValue)) {
    throw new Error(`Invalid input: date ${newDatePropertyValue} doesn't match "YYYY-MM-DD" format.`);
  }

  const issue: GithubProjectIssueFieldValues | undefined = await retrieveGithubProjectIssueFieldValuesRecursively(
    0,
    octokit,
    projectId,
    issueId,
    undefined,
  );

  if (!issue) {
    throw new Error(`Issue with ID ${issueId} was not found on Github Project with ID ${projectId}.`);
  }

  const updateGithubProjectDatePropertyMutation = `
      mutation ($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
        updateProjectV2ItemFieldValue(
            input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { date: $date }
            }
        ) {
            projectV2Item {
                id
            }
        }
      }
    `;

  await octokit.graphql(updateGithubProjectDatePropertyMutation, {
    projectId: projectId,
    itemId: issue.itemId,
    fieldId: projectFieldId,
    date: newDatePropertyValue,
  });
}
