import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

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


  try {
    const stalenessThreshold = Number(new Date()) - ONE_MONTH_IN_MS;
    const formattedThreshold = convertDateFormat(String(stalenessThreshold));

    console.log({ formattedThreshold });

    const searchQuery = `is:open is:pr repo:${context.repo.owner}/${context.repo.repo} updated:>${formattedThreshold}`;

    const response = await octokit.rest.search.issuesAndPullRequests({ q: searchQuery });

    const prNumbers = response.data.items.map((item) => item.number);

    for (let i = 0 ; i < prNumbers.length; i += 1) {
      console.log(prNumbers[i]);
      // await commentAndClosePR(octokit, prNumbers[i]);
    }
  } catch (error) {
    console.error(`Error processing PRs: ${error}`);
  }
}

async function commentAndClosePR(octokit: InstanceType<typeof GitHub>, prNumber: number): Promise<void> {
  // Comment on the PR
  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body: 'Thank you for your contribution to MetaMask Extension. In order to maintain a clean and relevant PR queue, we close all PRs after 30 days of inactivity. Please reopen this PR once your changes address our feedback.',
  });

  // Close the PR
  await octokit.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    state: 'closed',
  });
}

function convertDateFormat(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
