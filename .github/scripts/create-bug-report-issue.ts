import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

import { createIssue, retrieveIssueByTitle } from './shared/issue';
import {
  Label,
  RegressionStage,
  craftRegressionLabel,
  craftTeamLabel,
  createOrRetrieveLabel,
  typeBugLabel,
} from './shared/label';
import { codeRepoToPlanningRepo, codeRepoToPlatform, getCurrentDateFormatted, isValidVersionFormat } from './shared/utils';
import { addIssueToGithubProject, GithubProject, GithubProjectField, retrieveGithubProject, updateGithubProjectDateFieldValue } from './shared/project';

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  // "GITHUB_TOKEN" is an automatically generated, repository-specific access token provided by GitHub Actions.
  // We can't use "GITHUB_TOKEN" here, as its permissions don't allow neither to create new labels
  // nor to retrieve the content of organisations Github Projects.
  // In our case, we may want to create "regression-RC-x.y.z" label when it doesn't already exist.
  // We may also want to retrieve the content of organisation's Github Projects.
  // As a consequence, we need to create our own "BUG_REPORT_TOKEN" with "repo" and "read:org" permissions.
  // Such a token allows both to create new labels and fetch the content of organisation's Github Projects.
  const personalAccessToken = process.env.BUG_REPORT_TOKEN;
  if (!personalAccessToken) {
    core.setFailed('BUG_REPORT_TOKEN not found');
    process.exit(1);
  }

  const projectNumber = Number(process.env.RELEASES_GITHUB_PROJECT_BOARD_NUMBER);
  if (!projectNumber) {
    core.setFailed('RELEASES_GITHUB_PROJECT_BOARD_NUMBER not found');
    process.exit(1);
  }

  const projectViewNumber = Number(process.env.RELEASES_GITHUB_PROJECT_BOARD_VIEW_NUMBER);
  if (!projectViewNumber) {
    core.setFailed('RELEASES_GITHUB_PROJECT_BOARD_VIEW_NUMBER not found');
    process.exit(1);
  }

  const releaseVersion = process.env.RELEASE_VERSION;
  if (!releaseVersion) {
    core.setFailed('RELEASE_VERSION not found');
    process.exit(1);
  }
  if (!isValidVersionFormat(releaseVersion)) {
    core.setFailed(`Invalid format for RELEASE_VERSION: ${releaseVersion}. Expected format: x.y.z`);
    process.exit(1);
  }

  const repoOwner = context.repo.owner;
  if (!repoOwner) {
    core.setFailed('repo owner not found');
    process.exit(1);
  }
  const codeRepoName = context.repo.repo;
  if (!codeRepoName) {
    core.setFailed('code repo name not found');
    process.exit(1);
  }
  const planningRepoName = codeRepoToPlanningRepo[codeRepoName];
  if (!planningRepoName) {
    core.setFailed('planning repo name not found');
    process.exit(1);
  }

  // Retrieve platform name
  const platformName = codeRepoToPlatform[codeRepoName];
  if (!platformName) {
    core.setFailed('platform name not found');
    process.exit(1);
  }

  // Initialise octokit, required to call Github GraphQL API
  const octokit: InstanceType<typeof GitHub> = getOctokit(personalAccessToken, {
    previews: ['bane'], // The "bane" preview is required for adding, updating, creating and deleting labels.
  });

  // Craft regression labels to add
  const regressionLabelTesting: Label = craftRegressionLabel(RegressionStage.Testing, releaseVersion);
  const regressionLabelProduction: Label = craftRegressionLabel(RegressionStage.Production, releaseVersion);
  const teamLabel: Label = craftTeamLabel(`${platformName}-platform`);

  // Create or retrieve the different labels
  await createOrRetrieveLabel(octokit, repoOwner, codeRepoName, regressionLabelProduction);
  await createOrRetrieveLabel(octokit, repoOwner, codeRepoName, regressionLabelTesting);
  await createOrRetrieveLabel(octokit, repoOwner, planningRepoName, regressionLabelProduction);
  const regressionLabelTestingId = await createOrRetrieveLabel(octokit, repoOwner, planningRepoName, regressionLabelTesting);
  const typeBugLabelId = await createOrRetrieveLabel(octokit, repoOwner, planningRepoName, typeBugLabel);
  const teamLabelId = await createOrRetrieveLabel(octokit, repoOwner, planningRepoName, teamLabel);

  const issueTitle = `v${releaseVersion} Bug Report`;
  const issueWithSameTitle = await retrieveIssueByTitle(octokit, repoOwner, planningRepoName, issueTitle);
  if (issueWithSameTitle) {
    core.setFailed(`Bug report already exists: https://github.com/${repoOwner}/${planningRepoName}/issues/${issueWithSameTitle.number}. This is not desired, but can happen in cases where a release gets re-cut.`);
    process.exit(1);
  }

  const issueBody = `**What is this bug report issue for?**\n\n1. This issue is used to track release dates on this [Github Project board](https://github.com/orgs/MetaMask/projects/${projectNumber}/views/${projectViewNumber}), which content then gets pulled into our metrics system.\n\n2. This issue is also used by our Zapier automations, to determine if automated notifications shall be sent on Slack for release \`${releaseVersion}\`. Notifications will only be sent as long as this issue is open.\n\n**Who created and/or closed this issue?**\n\n- This issue was automatically created by a GitHub action upon the creation of the release branch \`Version-v${releaseVersion}\`, indicating the release was cut.\n\n- This issue gets automatically closed by another GitHub action, once the release branch \`Version-v${releaseVersion}\` or \`release/${releaseVersion}\` merges into \`main\`, indicating the release is prepared for store submission.`;
  const issueId = await createIssue(octokit, repoOwner, planningRepoName, issueTitle, issueBody, [regressionLabelTestingId, typeBugLabelId, teamLabelId]);

  // Retrieve project, in order to obtain its ID
  const project: GithubProject = await retrieveGithubProject(octokit, projectNumber);

  const projectFieldName: string = "RC Cut";

  const projectField: GithubProjectField | undefined = project.fields.find(field => field.name === projectFieldName);

  if (!projectField) {
    throw new Error(`Project field with name ${projectFieldName} was not found on Github Project with ID ${project.id}.`);
  }

  if (!projectField.id) {
    throw new Error(`Project field with name ${projectFieldName} was found on Github Project with ID ${project.id}, but it has no 'id' property.`);
  }

  // Add bug report issue to 'Releases' Github Project Board
  await addIssueToGithubProject(octokit, project.id, issueId);

  // Update bug report issue's date property on 'Releases' Github Project Board
  await updateGithubProjectDateFieldValue(octokit, project.id, projectField.id, issueId, getCurrentDateFormatted());
}
