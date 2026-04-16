import { GitHub } from '@actions/github/lib/utils';

import { retrieveRepo } from './repo';

export enum RegressionStage {
  Testing,
  Beta,
  Production,
}
export interface Label {
  name: string;
  color: string;
  description: string;
}

export const typeBugLabel: Label = {
  name: 'type-bug',
  color: 'D73A4A',
  description: `Something isn't working`,
};

export const externalContributorLabel: Label = {
  name: 'external-contributor',
  color: '7057FF',
  description: 'Issue or PR created by user outside org',
};

export const needsTriageLabel: Label = {
  name: 'needs-triage',
  color: '68AEE6',
  description: 'Issue needs to be triaged',
};

export const areaSentryLabel: Label = {
  name: 'area-sentry',
  color: '5319E7',
  description: 'Issue from Sentry',
};

export const flakyTestsLabel: Label = {
  name: 'flaky tests',
  color: 'BE564E',
  description: 'Flaky test report',
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

// This function crafts appropriate label, corresponding to regression stage and release version.
export function craftRegressionLabel(
  regressionStage: RegressionStage | undefined,
  releaseVersion: string | undefined,
): Label {
  switch (regressionStage) {
    case RegressionStage.Testing:
      return {
        name: `regression-RC-${releaseVersion || '*'}`,
        color: '744C11', // orange
        description: releaseVersion
          ? `Regression bug that was found in release candidate (RC) for release ${releaseVersion}`
          : `TODO: Unknown release version. Please replace with correct 'regression-RC-x.y.z' label, where 'x.y.z' is the number of the release where bug was found.`,
      };

    case RegressionStage.Beta:
      return {
        name: `regression-beta-${releaseVersion || '*'}`,
        color: 'D94A83', // pink
        description: releaseVersion
          ? `Regression bug that was found in beta in release ${releaseVersion}`
          : `TODO: Unknown release version. Please replace with correct 'regression-beta-x.y.z' label, where 'x.y.z' is the number of the release where bug was found.`,
      };

    case RegressionStage.Production:
      return {
        name: `regression-prod-${releaseVersion || '*'}`,
        color: '5319E7', // violet
        description: releaseVersion
          ? `Regression bug that was found in production in release ${releaseVersion}`
          : `TODO: Unknown release version. Please replace with correct 'regression-prod-x.y.z' label, where 'x.y.z' is the number of the release where bug was found.`,
      };

    default:
      return {
        name: `regression-*`,
        color: 'EDEDED', // grey
        description: `TODO: Unknown regression stage. Please replace with correct regression label: 'regression-main', 'regression-RC-x.y.z', or 'regression-prod-x.y.z' label, where 'x.y.z' is the number of the release where bug was found.`,
      };
  }
}

// This function crafts appropriate label, corresponding to team name.
export function craftTeamLabel(teamName: string): Label {
  switch (teamName) {
    case 'extension-platform':
      return {
        name: `team-${teamName}`,
        color: 'BFD4F2', // light blue
        description: `Extension Platform team`,
      };

    case 'mobile-platform':
      return {
        name: `team-${teamName}`,
        color: '76E9D0', // light green
        description: `Mobile Platform team`,
      };

    default:
      return {
        name: `team-*`,
        color: 'EDEDED', // grey
        description: `TODO: Unknown team. Please replace with correct team label.`,
      };
  }
}

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
export async function retrieveLabel(
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
