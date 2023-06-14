import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

// 30 days in milliseconds
const A_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

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
    // Get all open PRs
    const { data: pulls } = await octokit.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
    });

    const staleThreshold = Date.now() - A_MONTH_IN_MS;

    const stalePRs = [];
    for (const pr of pulls) {
      const prLastUpdated = new Date(pr.updated_at).getTime();
      console.log({ prLastUpdated });
      const isPRStale = prLastUpdated < staleThreshold;

      if (isPRStale) {
        stalePRs.push(pr.number);
        // // Close the PR
        // await octokit.rest.pulls.update({
        //   owner: context.repo.owner,
        //   repo: context.repo.repo,
        //   pull_number: pr.number,
        //   state: 'closed',
        // });

        // // Comment on the PR
        // await octokit.rest.issues.createComment({
        //   owner: context.repo.owner,
        //   repo: context.repo.repo,
        //   issue_number: pr.number,
        //   body: 'Thank you for your contribution to MetaMask Extension. In order to maintain a clean and relevant PR queue, we close all PRs after 30 days of inactivity. Please reopen this PR once your changes address our feedback.',
        // });
      }
    }
    console.log(stalePRs);
  } catch (error) {
    console.error(`Error processing PRs: ${error}`);
  }
}
