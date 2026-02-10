/**
 * GitHub API client for retrieving PR information
 */

import { Octokit } from '@octokit/rest';
import type { PullRequestFile, PullRequestInfo } from '../types';

export class GitHubClient {
  private octokit: Octokit;

  private owner: string;

  private repo: string;

  constructor(
    token: string | undefined,
    owner: string = 'MetaMask',
    repo: string = 'metamask-extension',
  ) {
    // Create Octokit instance - works without auth for public repos
    this.octokit = new Octokit(token ? { auth: token } : {});
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Retrieves pull request information including changed files
   *
   * @param prNumber
   */
  async getPullRequestInfo(prNumber: number): Promise<PullRequestInfo> {
    try {
      // Get PR details
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: prNumber,
      });

      // Get all changed files with pagination
      const allFiles = await this.octokit.paginate(
        this.octokit.rest.pulls.listFiles,
        {
          owner: this.owner,
          repo: this.repo,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pull_number: prNumber,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          per_page: 100,
        },
      );

      // Get all commits with pagination
      const allCommits = await this.octokit.paginate(
        this.octokit.rest.pulls.listCommits,
        {
          owner: this.owner,
          repo: this.repo,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pull_number: prNumber,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          per_page: 100,
        },
      );

      const prFiles: PullRequestFile[] = allFiles.map((file) => ({
        filename: file.filename,
        additions: file.additions || 0,
        deletions: file.deletions || 0,
        status: file.status as PullRequestFile['status'],
        patch: file.patch || undefined,
      }));

      return {
        number: prNumber,
        title: pr.title,
        body: pr.body || '',
        author: pr.user?.login || 'unknown',
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        files: prFiles,
        commitCount: allCommits.length,
      };
    } catch (error: unknown) {
      const githubError = error as { status?: number; message?: string };
      if (
        githubError?.status === 403 &&
        githubError?.message?.includes('rate limit')
      ) {
        const errorMessage =
          `GitHub API rate limit exceeded.\n\n` +
          `To fix this, provide a GitHub token for higher rate limits:\n` +
          `  1. Create a token at: https://github.com/settings/tokens\n` +
          `  2. Set it as environment variable: export GITHUB_TOKEN="your-token"\n` +
          `  3. Or pass it via: --github-token "your-token"\n\n` +
          `Unauthenticated requests: 60 requests/hour\n` +
          `Authenticated requests: 5,000 requests/hour`;
        throw new Error(errorMessage);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to fetch PR #${prNumber}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validates that a PR exists and is accessible
   *
   * @param prNumber
   */
  async validatePullRequest(prNumber: number): Promise<boolean> {
    try {
      await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: prNumber,
      });
      return true;
    } catch {
      return false;
    }
  }
}
