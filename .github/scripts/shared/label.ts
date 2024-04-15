import { GitHub } from '@actions/github/lib/utils';

import { retrieveRepo } from './repo';

export interface Label {
  name: string;
  color: string;
  description: string;
}

export const externalContributorLabel: Label = {
  name: 'external-contributor',
  color: '7057FF',
  description: 'Issue or PR created by user outside org',
};

export const invalidIssueTemplateLabel: Label = {
  name: 'INVALID-ISSUE-TEMPLATE',
  color: 'EDEDED',
  description: "Issue's body doesn't match template",
};

export const invalidPullRequestTemplateLabel: Label = {
  name: 'INVALID-PR-TEMPLATE',
  color: 'EDEDED',
  description: "PR's body doesn't match template",
};

// This function creates or retrieves the label on a specific repo
export async function createOrRetrieveLabel(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  label: Label,
): Promise<string> {
  // Check if label already exists on the repo
  let labelId = await retrieveLabel(octokit, repoOwner, repoName, label.name);

  // If label doesn't exist on the repo, create it
  if (!labelId) {
    console.log(
      `${label.name} label doesn't exist on ${repoName} repo. It needs to be created.`,
    );

    // Retrieve PR's repo
    const repoId = await retrieveRepo(octokit, repoOwner, repoName);

    // Create label on repo
    labelId = await createLabel(octokit, repoId, label);
  }

  return labelId;
}

// This function creates the label on a specific repo
async function createLabel(
  octokit: InstanceType<typeof GitHub>,
  repoId: string,
  label: Label,
): Promise<string> {
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
    labelName: label.name,
    labelColor: label.color,
    labelDescription: label.description,
  });

  const labelId = createLabelResult?.createLabel?.label?.id;

  return labelId;
}

// This function retrieves the label on a specific repo
async function retrieveLabel(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  labelName: string,
): Promise<string> {
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
