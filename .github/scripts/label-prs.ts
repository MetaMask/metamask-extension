import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    core.setFailed('GITHUB_TOKEN not found');
    process.exit(1);
  }

  const octokit = getOctokit(token);

  const headRef = context.payload.pull_request?.head.ref || '';

  let issueNumber = await getIssueNumberFromPullRequestBody();
  if (issueNumber === "") {
    bailIfIsBranchNameInvalid(headRef);
    bailIfIsNotFeatureBranch(headRef);
    issueNumber = getIssueNumberFromBranchName(headRef);
  }

  await updateLabels(octokit, issueNumber);
}

async function getIssueNumberFromPullRequestBody(): Promise<string> {
  console.log("Checking if the PR's body references an issue...");

  let ISSUE_LINK_IN_PR_DESCRIPTION_REGEX =
    /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s#\d+/gi;

  const prBody = await getPullRequestBody();

  let matches = prBody.match(ISSUE_LINK_IN_PR_DESCRIPTION_REGEX);
  if (!matches || matches?.length === 0) {
    console.log(
      'No direct link can be drawn between the PR and an issue from the PR body because no issue number was referenced.',
    );
    return "";
  }

  if (matches?.length > 1) {
    console.log(
      'No direct link can be drawn between the PR and an issue from the PR body because more than one issue number was referenced.',
    );
    return "";
  }

  const ISSUE_NUMBER_REGEX = /\d+/;
  const issueNumber = matches[0].match(ISSUE_NUMBER_REGEX)?.[0] || '';

  console.log(`Found issue number ${issueNumber} in PR body.`);

  return issueNumber;
}

async function getPullRequestBody(): Promise<string> {
  if (context.eventName !== 'pull_request') {
    console.log('This action should only run on pull_request events.');
    process.exit(1);
  }

  const prBody = context.payload.pull_request?.body || '';
  return prBody;
}

function bailIfIsBranchNameInvalid(branchName: string): void {
  const BRANCH_REGEX =
    /^(main|develop|(ci|chore|docs|feat|feature|fix|perf|refactor|revert|style)\/\d*(?:[-](?![-])\w*)*|Version-v\d+\.\d+\.\d+)$/;
  const isValidBranchName = new RegExp(BRANCH_REGEX).test(branchName);

  if (!isValidBranchName) {
    console.log('This branch name does not follow the convention.');
    console.log(
      'Here are some example branch names that are accepted: "fix/123-description", "feat/123-longer-description", "feature/123", "main", "develop", "Version-v10.24.2".',
    );
    console.log(
      'No issue could be linked to this PR, so no labels were copied',
    );

    process.exit(0);
  }
}

function bailIfIsNotFeatureBranch(branchName: string): void {
  if (
    branchName === 'main' ||
    branchName === 'develop' ||
    branchName.startsWith('Version-v')
  ) {
    console.log(`${branchName} is not a feature branch.`);
    console.log(
      'No issue could be linked to this PR, so no labels were copied',
    );
    process.exit(0);
  }
}

async function updateLabels(octokit: InstanceType<typeof GitHub>, issueNumber: string): Promise<void> {
  interface ILabel {
    name: string;
  };

  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const issue = await octokit.rest.issues.get({
    owner: owner,
    repo: repo,
    issue_number: Number(issueNumber),
  });

  const getNameFromLabel = (label: ILabel): string => label.name

  const issueLabels = issue.data.labels.map(label => getNameFromLabel(label as ILabel));

  const prNumber = context.payload.number;

  const pr = await octokit.rest.issues.get({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
  });

  const startingPRLabels = pr.data.labels.map(label => getNameFromLabel(label as ILabel));

  const dedupedFinalPRLabels = [
    ...new Set([...startingPRLabels, ...issueLabels]),
  ];

  const hasIssueAdditionalLabels = !sortedArrayEqual(
    startingPRLabels,
    dedupedFinalPRLabels,
  );
  if (hasIssueAdditionalLabels) {
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: prNumber,
      labels: dedupedFinalPRLabels,
    });
  }
}

function getIssueNumberFromBranchName(branchName: string): string {
  console.log('Checking if the branch name references an issue...');

  let issueNumber: string;
  if (branchName.split('/').length > 1) {
    issueNumber = branchName.split('/')[1].split('-')[0];
  } else {
    issueNumber = branchName.split('-')[0];
  }

  console.log(`Found issue number ${issueNumber} in branch name.`);

  return issueNumber;
}

function sortedArrayEqual(array1: string[], array2: string[]): boolean {
  const lengthsAreEqual = array1.length === array2.length;
  const everyElementMatchesByIndex = array1.every(
    (value: string, index: number): boolean => value === array2[index],
  );

  return lengthsAreEqual && everyElementMatchesByIndex;
}
