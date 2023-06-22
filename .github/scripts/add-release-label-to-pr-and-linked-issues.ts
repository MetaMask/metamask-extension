import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

// A labelable object can be a pull request or an issue
interface Labelable {
  id: string;
  number: number;
  repoOwner: string;
  repoName: string;
  createdAt: string;
}

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
    core.setFailed(`NEXT_SEMVER_VERSION (${nextReleaseVersionNumber}) is not a valid version format. The expected format is "x.y.z", where "x", "y" and "z" are numbers.`);
    process.exit(1);
  }

  // Release label indicates the next release version number
  // Example release label: "release-6.5.0"
  const releaseLabelName = `release-${nextReleaseVersionNumber}`;
  const releaseLabelColor = "ededed";
  const releaseLabelDescription = `Issue or pull request that will be included in release ${nextReleaseVersionNumber}`;

  // Initialise octokit, required to call Github GraphQL API
  const octokit: InstanceType<typeof GitHub> = getOctokit(
    personalAccessToken,
    {
      previews: ["bane"], // The "bane" preview is required for adding, updating, creating and deleting labels.
    },
  );

  // Retrieve pull request info from context
  const prRepoOwner = context.repo.owner;
  const prRepoName = context.repo.repo;
  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    core.setFailed('Pull request number not found');
    process.exit(1);
  }

  // Retrieve pull request
  const pullRequest: Labelable = await retrievePullRequest(octokit, prRepoOwner, prRepoName, prNumber);

  // Add the release label to the pull request
  await addLabelToLabelable(octokit, pullRequest, releaseLabelName, releaseLabelColor, releaseLabelDescription);

  // Retrieve linked issues for the pull request
  const linkedIssues: Labelable[] = await retrieveLinkedIssues(octokit, prRepoOwner, prRepoName, prNumber);

  // Add the release label to the linked issues
  for (const linkedIssue of linkedIssues) {
    await addLabelToLabelable(octokit, linkedIssue, releaseLabelName, releaseLabelColor, releaseLabelDescription);
  }
}

// This helper function checks if version has the correct format: "x.y.z" where "x", "y" and "z" are numbers.
function isValidVersionFormat(str: string): boolean {
  const regex = /^\d+\.\d+\.\d+$/;
  return regex.test(str);
}

// This function retrieves the repo
async function retrieveRepo(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string): Promise<string> {

  const retrieveRepoQuery = `
  query RetrieveRepo($repoOwner: String!, $repoName: String!) {
    repository(owner: $repoOwner, name: $repoName) {
      id
    }
  }
`;

  const retrieveRepoResult: {
    repository: {
      id: string;
    };
  } = await octokit.graphql(retrieveRepoQuery, {
    repoOwner,
    repoName,
  });

  const repoId = retrieveRepoResult?.repository?.id;

  return repoId;
}

// This function retrieves the label on a specific repo
async function retrieveLabel(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, labelName: string): Promise<string> {

  const retrieveLabelQuery = `
    query RetrieveLabel($repoOwner: String!, $repoName: String!, $labelName: String!) {
      repository(owner: $repoOwner, name: $repoName) {
        label(name: $labelName) {
          id
        }
      }
    }
  `;

  const retrieveLabelResult: {
    repository: {
      label: {
        id: string;
      };
    };
  } = await octokit.graphql(retrieveLabelQuery, {
    repoOwner,
    repoName,
    labelName,
  });

  const labelId = retrieveLabelResult?.repository?.label?.id;

  return labelId;
}

// This function creates the label on a specific repo
async function createLabel(octokit: InstanceType<typeof GitHub>, repoId: string, labelName: string, labelColor: string, labelDescription: string): Promise<string> {

  const createLabelMutation = `
    mutation CreateLabel($repoId: ID!, $labelName: String!, $labelColor: String!, $labelDescription: String) {
      createLabel(input: {repositoryId: $repoId, name: $labelName, color: $labelColor, description: $labelDescription}) {
        label {
          id
        }
      }
    }
  `;

  const createLabelResult: {
    createLabel: {
      label: {
        id: string;
      };
    };
  } = await octokit.graphql(createLabelMutation, {
    repoId,
    labelName,
    labelColor,
    labelDescription,
  });

  const labelId = createLabelResult?.createLabel?.label?.id;

  return labelId;
}

// This function creates or retrieves the label on a specific repo
async function createOrRetrieveLabel(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, labelName: string, labelColor: string, labelDescription: string): Promise<string> {

  // Check if label already exists on the repo
  let labelId = await retrieveLabel(octokit, repoOwner, repoName, labelName);

  // If label doesn't exist on the repo, create it
  if (!labelId) {
    // Retrieve PR's repo
    const repoId = await retrieveRepo(octokit, repoOwner, repoName);

    // Create label on repo
    labelId = await createLabel(octokit, repoId, labelName, labelColor, labelDescription);
  }

  return labelId;
}

// This function retrieves the pull request on a specific repo
async function retrievePullRequest(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, prNumber: number): Promise<Labelable> {

  const retrievePullRequestQuery = `
    query GetPullRequest($repoOwner: String!, $repoName: String!, $prNumber: Int!) {
      repository(owner: $repoOwner, name: $repoName) {
        pullRequest(number: $prNumber) {
          id
          createdAt
        }
      }
    }
  `;

  const retrievePullRequestResult: {
    repository: {
      pullRequest: {
        id: string;
        createdAt: string;
      };
    };
  } = await octokit.graphql(retrievePullRequestQuery, {
    repoOwner,
    repoName,
    prNumber,
  });

  const pullRequest: Labelable = {
    id: retrievePullRequestResult?.repository?.pullRequest?.id,
    number: prNumber,
    repoOwner: repoOwner,
    repoName: repoName,
    createdAt: retrievePullRequestResult?.repository?.pullRequest?.createdAt,
  }

  return pullRequest;
}


// This function retrieves the list of linked issues for a pull request
async function retrieveLinkedIssues(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, prNumber: number): Promise<Labelable[]> {

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
    prNumber
  });

  const linkedIssues = retrieveLinkedIssuesResult?.repository?.pullRequest?.closingIssuesReferences?.nodes?.map((issue: {
    id: string;
    number: number;
    createdAt: string;
    repository: {
      name: string;
      owner: {
        login: string;
      };
    };
  }) => {
    return {
      id: issue?.id,
      number: issue?.number,
      repoOwner: issue?.repository?.owner?.login,
      repoName: issue?.repository?.name,
      createdAt: issue?.createdAt
    };
  }) || [];

  return linkedIssues;
}

// This function adds label to a labelable object (i.e. a pull request or an issue)
async function addLabelToLabelable(octokit: InstanceType<typeof GitHub>, labelable: Labelable, labelName: string, labelColor: string, labelDescription: string): Promise<void> {

  // Retrieve label from the labelable's repo, or create label if required
  const labelId = await createOrRetrieveLabel(octokit, labelable?.repoOwner, labelable?.repoName, labelName, labelColor, labelDescription);

  const addLabelsToLabelableMutation = `
    mutation AddLabelsToLabelable($labelableId: ID!, $labelIds: [ID!]!) {
      addLabelsToLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
        clientMutationId
      }
    }
  `;

  await octokit.graphql(addLabelsToLabelableMutation, {
    labelableId: labelable?.id,
    labelIds: [labelId],
   });

}
