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
    const searchQuery = `is:open is:pr repo:${context.repo.owner}/${context.repo.repo} updated:>2023-01-15`;

    const response = await octokit.rest.search.issuesAndPullRequests({ q: searchQuery });

    console.log({ totalCount: response.data.total_count, response });

    // .issues({ q: searchQuery })
    //   .then(response => {
    //     const totalIssues = response.data.total_count;
    //     const issues = response.data.items;

    //     console.log(`Total number of open issues: ${totalIssues}`);
    //     console.log('List of issues:');
    //     issues.forEach(issue => console.log(issue.html_url));
    //   })
    //   .catch(error => {
    //     console.error('Error occurred while searching for issues:', error);
    //   });


    // // Get all open PRs
    // const response = await octokit.rest.pulls.list({
    //   owner: context.repo.owner,
    //   repo: context.repo.repo,
    //   state: 'open',
    //   perPage: 100,
    //   page: 1,
    // });

    console.log(Object.keys(response));

    // const { data: pulls } = response;

    // const staleThreshold = Date.now() - A_MONTH_IN_MS;

    // const stalePRs = [];
    // for (const pr of pulls) {
    //   const prLastUpdated = new Date(pr.updated_at).getTime();
    //   console.log({ prLastUpdated });
    //   const isPRStale = prLastUpdated < staleThreshold;

    //   if (isPRStale) {
    //     stalePRs.push(pr.number);
    //     // // Close the PR
    //     // await octokit.rest.pulls.update({
    //     //   owner: context.repo.owner,
    //     //   repo: context.repo.repo,
    //     //   pull_number: pr.number,
    //     //   state: 'closed',
    //     // });

    //     // // Comment on the PR
    //     // await octokit.rest.issues.createComment({
    //     //   owner: context.repo.owner,
    //     //   repo: context.repo.repo,
    //     //   issue_number: pr.number,
    //     //   body: 'Thank you for your contribution to MetaMask Extension. In order to maintain a clean and relevant PR queue, we close all PRs after 30 days of inactivity. Please reopen this PR once your changes address our feedback.',
    //     // });
      // }
    // }
    // console.log(stalePRs);
  } catch (error) {
    console.error(`Error processing PRs: ${error}`);
  }
}
