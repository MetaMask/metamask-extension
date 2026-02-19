/**
 * GitHub API client for retrieving PR information
 */

import type {
  PullRequestFile,
  PullRequestInfo,
  PullRequestCommit,
} from '../types';

type GitHubFile = {
  filename: string;
  additions: number | null;
  deletions: number | null;
  status: 'added' | 'removed' | 'modified' | 'renamed' | undefined;
  patch: string | null | undefined;
};

type Octokit = {
  rest: {
    pulls: {
      get: (params: {
        owner: string;
        repo: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: number;
      }) => Promise<{
        data: {
          title: string;
          body: string | null;
          user: { login: string } | null;
          base: { ref: string };
          head: { ref: string };
        };
      }>;
      listFiles: (params: {
        owner: string;
        repo: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: number;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        per_page: number;
      }) => Promise<{ data: GitHubFile[] }>;
      listCommits: (params: {
        owner: string;
        repo: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: number;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        per_page: number;
      }) => Promise<{
        data: { sha: string; commit?: { message?: string } }[];
      }>;
    };
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  paginate: <TItem>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (params: any) => Promise<{ data: TItem[] }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any,
  ) => Promise<TItem[]>;
};

export class GitHubClient {
  private octokit: Octokit | null = null;

  private owner: string;

  private repo: string;

  private token: string | undefined;

  constructor(
    token: string | undefined,
    owner: string = 'MetaMask',
    repo: string = 'metamask-extension',
  ) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Lazily initialize the Octokit client
   */
  private async getOctokit(): Promise<Octokit> {
    if (!this.octokit) {
      // Use dynamic import for ESM module
      const { Octokit } = await import('@octokit/rest');
      this.octokit = new Octokit(
        this.token ? { auth: this.token } : {},
      ) as Octokit;
    }
    return this.octokit;
  }

  /**
   * Retrieves pull request information including changed files
   *
   * @param prNumber
   */
  async getPullRequestInfo(prNumber: number): Promise<PullRequestInfo> {
    try {
      const octokit = await this.getOctokit();
      // Get PR details
      const { data: pr } = await octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pull_number: prNumber,
      });

      // Get all changed files with pagination
      const allFiles = await octokit.paginate<GitHubFile>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        octokit.rest.pulls.listFiles as any,
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
      const allCommits = await octokit.paginate<{
        sha: string;
        commit?: { message?: string };
      }>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        octokit.rest.pulls.listCommits as any,
        {
          owner: this.owner,
          repo: this.repo,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pull_number: prNumber,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          per_page: 100,
        },
      );

      const prCommits: PullRequestCommit[] = allCommits.map((c) => ({
        sha: c.sha,
        message: c.commit?.message ?? '',
      }));

      const prFiles: PullRequestFile[] = allFiles.map((file: GitHubFile) => ({
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
        commits: prCommits,
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
      const octokit = await this.getOctokit();
      await octokit.rest.pulls.get({
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
