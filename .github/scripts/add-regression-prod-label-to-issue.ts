import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

// A labelable object can be a pull request or an issue
interface Labelable {
  id: string;
  number: number;
  repoOwner: string;
  repoName: string;
  body: string;
  author: string;
  labels: {
    id: string;
    name: string;
  }[];
}

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  // "GITHUB_TOKEN" is an automatically generated, repository-specific access token provided by GitHub Actions.
  // We can't use "GITHUB_TOKEN" here, as its permissions don't allow neither to create new labels
  // nor to retrieve the list of organisations a user belongs to.
  // In our case, we may want to create "regression-prod-x.y.z" label when it doesn't already exist.
  // We may also want to retrieve the list of organisations a user belongs to.
  // As a consequence, we need to create our own "REGRESSION_PROD_LABEL_TOKEN" with "repo" and "read:org" permissions.
  // Such a token allows both to create new labels and fetch user's list of organisations.
  const personalAccessToken = process.env.REGRESSION_PROD_LABEL_TOKEN;
  if (!personalAccessToken) {
    core.setFailed('REGRESSION_PROD_LABEL_TOKEN not found');
    process.exit(1);
  }

  // Retrieve pull request info from context
  const issueRepoOwner = context.repo.owner;
  const issueRepoName = context.repo.repo;
  const issueNumber = context.payload.issue?.number;
  if (!issueNumber) {
    core.setFailed('Issue number not found');
    process.exit(1);
  }

  // Initialise octokit, required to call Github GraphQL API
  const octokit: InstanceType<typeof GitHub> = getOctokit(
    personalAccessToken,
    {
      previews: ["bane"], // The "bane" preview is required for adding, updating, creating and deleting labels.
    },
  );

  // Retrieve issue
  const issue: Labelable = await retrieveIssue(octokit, issueRepoOwner, issueRepoName, issueNumber);

  // Retrieve issue's author list of organisations
  const orgs: string[] = await retrieveUserOrgs(octokit, issue?.author);

  // Add external contributor label to the issue if author is not part of the MetaMask organisation
  if (!orgs.includes('MetaMask')) {
    // Craft external contributor label to add
    const externalContributorLabelName = `external-contributor`;
    const externalContributorLabelColor = 'B60205'; // red
    const externalContributorLabelDescription = `Issue or PR created by user outside MetaMask organisation`;

    // Add external contributor label to the issue
    await addLabelToLabelable(octokit, issue, externalContributorLabelName, externalContributorLabelColor, externalContributorLabelDescription);
  }

  // Extract release version from issue body (is existing)
  const releaseVersion = extractReleaseVersionFromIssueBody(issue.body);

  // Add regression prod label to the issue if release version was found is issue body
  if (releaseVersion) {
    // Craft regression prod label to add
    const regressionProdLabelName = `regression-prod-${releaseVersion}`;
    const regressionProdLabelColor = '5319E7'; // violet
    const regressionProdLabelDescription = `Regression bug that was found in production in release ${releaseVersion}`;

    let regressionProdLabelFound: boolean = false;
    const regressionProdLabelsToBeRemoved: {
      id: string;
      name: string;
    }[] = [];

    // Loop over issue's labels, to see if regression labels are either missing, or to be removed
    issue?.labels?.forEach(label => {
      if (label?.name === regressionProdLabelName) {
        regressionProdLabelFound = true;
      } else if (label?.name?.startsWith('regression-prod-')) {
        regressionProdLabelsToBeRemoved.push(label);
      }
    });

    // Add regression prod label to the issue if missing
    if (regressionProdLabelFound) {
      console.log(`Issue ${issue?.number} already has ${regressionProdLabelName} label.`);
    } else {
      console.log(`Add ${regressionProdLabelName} label to issue ${issue?.number}.`);
      await addLabelToLabelable(octokit, issue, regressionProdLabelName, regressionProdLabelColor, regressionProdLabelDescription);
    }

    // Remove other regression prod label from the issue
    await Promise.all(
      regressionProdLabelsToBeRemoved.map(label => {
        removeLabelFromLabelable(octokit, issue, label?.id);
      })
    );
  } else {
    console.log(`No release version was found in body of issue ${issue?.number}.`);
  }
}

// This helper function checks if issue's body has a bug report format.
function extractReleaseVersionFromIssueBody(issueBody: string): string | undefined {
  // Remove newline characters
  const cleanedIssueBody = issueBody.replace(/\r?\n/g, ' ');

  // Extract version from the cleaned issue body
  const regex = /### Version\s+((.*?)(?=  |$))/;
  const versionMatch = cleanedIssueBody.match(regex);
  const version = versionMatch?.[1];

  // Check if version is in the format x.y.z
  if (version && !/^(\d+\.)?(\d+\.)?(\*|\d+)$/.test(version)) {
    throw new Error('Version is not in the format x.y.z');
  }

  return version;
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

// This function retrieves the issue on a specific repo
async function retrieveIssue(octokit: InstanceType<typeof GitHub>, repoOwner: string, repoName: string, issueNumber: number): Promise<Labelable> {

  const retrieveIssueQuery = `
    query GetIssue($repoOwner: String!, $repoName: String!, $issueNumber: Int!) {
      repository(owner: $repoOwner, name: $repoName) {
        issue(number: $issueNumber) {
          id
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
        body: string;
        author: {
          login: string;
        }
        labels: {
          nodes: {
            id: string;
            name: string;
          }[];
        }
      };
    };
  } = await octokit.graphql(retrieveIssueQuery, {
    repoOwner,
    repoName,
    issueNumber,
  });

  const issue: Labelable = {
    id: retrieveIssueResult?.repository?.issue?.id,
    number: issueNumber,
    repoOwner: repoOwner,
    repoName: repoName,
    body: retrieveIssueResult?.repository?.issue?.body,
    author: retrieveIssueResult?.repository?.issue?.author?.login,
    labels: retrieveIssueResult?.repository?.issue?.labels?.nodes,
  }

  return issue;
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

// This function removes a label from a labelable object (i.e. a pull request or an issue)
async function removeLabelFromLabelable(octokit: InstanceType<typeof GitHub>, labelable: Labelable, labelId: string): Promise<void> {
  const removeLabelsFromLabelableMutation = `
    mutation RemoveLabelsFromLabelable($labelableId: ID!, $labelIds: [ID!]!) {
      removeLabelsFromLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
        clientMutationId
      }
    }
  `;

  await octokit.graphql(removeLabelsFromLabelableMutation, {
    labelableId: labelable?.id,
    labelIds: [labelId],
  });
}

// This function retrieves the list of organizations a specific user belongs to
async function retrieveUserOrgs(octokit: InstanceType<typeof GitHub>, username: string): Promise<string[]> {
  const userOrgsQuery = `
    query UserOrgs($login: String!) {
      user(login: $login) {
        organizations(first: 100) {
          nodes {
            login
          }
        }
      }
    }
  `;

  const retrieveUserOrgsResult: {
    user: {
      organizations: {
        nodes: {
          login: string;
        }[]
      }
    }
  } = await octokit.graphql(userOrgsQuery, { login: username });

  // Extract the organization logins from the result
  const orgs = retrieveUserOrgsResult.user.organizations.nodes.map((node: { login: string }) => node.login);

  return orgs;
}
