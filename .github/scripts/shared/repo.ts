import { GitHub } from '@actions/github/lib/utils';

// This function retrieves the repo
export async function retrieveRepo(
  octokit: InstanceType<typeof GitHub>,
  repoOwner: string,
  repoName: string,
): Promise<string> {
  const retrieveRepoQuery = `
    query RetrieveRepo($repoOwner: String!, $repoName: String!) {
      repository(owner: $repoOwner, name: $repoName) {
        id
      }
    }
  `;

  const retrieveRepoResult: {
    repository: {
      id: string;
    };
  } = await octokit.graphql(retrieveRepoQuery, {
    repoOwner,
    repoName,
  });

  const repoId = retrieveRepoResult?.repository?.id;

  return repoId;
}
