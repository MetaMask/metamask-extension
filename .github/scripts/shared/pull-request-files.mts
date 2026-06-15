import { GitHub } from '@actions/github/lib/utils';

export type PullRequestFile = {
  filename: string;
  additions: number;
  deletions: number;
};

/**
 * Retrieves files changed in a specific pull request.
 *
 * Uses `octokit.paginate` so PRs with more than one page of files (e.g.
 * large refactors) return every changed file, otherwise downstream
 * consumers (e.g. codeowner matching) silently see only the first page.
 *
 * @param octokit - GitHub API client
 * @param repoOwner - Repository owner (e.g. "MetaMask")
 * @param repoName - Repository name (e.g. "metamask-extension")
 * @param prNumber - Pull request number
 * @returns Array of changed files with their addition and deletion counts.
 */
export async function retrievePullRequestFiles(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
  prNumber: number,
): Promise<PullRequestFile[]> {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner: repoOwner,
    repo: repoName,
    pull_number: prNumber,
    per_page: 100,
  });

  return files.map((file) => ({
    filename: file.filename,
    additions: file.additions || 0,
    deletions: file.deletions || 0,
  }));
}
