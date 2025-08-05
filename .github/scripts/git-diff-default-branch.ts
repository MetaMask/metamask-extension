import fs from 'fs';
import path from 'path';
import { context, getOctokit } from '@actions/github';
import * as core from '@actions/core';

// Get PR number from GitHub Actions environment variables
const PR_NUMBER = context.payload.pull_request?.number;

const CHANGED_FILES_DIR = 'changed-files';

const octokit = getOctokit(process.env.GITHUB_TOKEN || '');

type PRInfo = {
  base: {
    ref: string;
  };
  body: string;
  labels: { name: string }[];
};

/**
 * Get JSON info about the given pull request using Octokit
 *
 * @returns PR information from GitHub
 */
async function getPrInfo(): Promise<PRInfo | null> {
  if (!PR_NUMBER) {
    return null;
  }

  const { owner, repo } = context.repo;

  return (
    await octokit.request(`GET /repos/${owner}/${repo}/pulls/${PR_NUMBER}`)
  ).data;
}

/**
 * Get the list of files changed in the pull request using GraphQL
 *
 * @returns List of files changed in the PR
 */
async function getPrFilesChanged() {
  const { owner, repo } = context.repo;

  const response = await octokit.graphql({
    query: `
        {
          repository(owner: "${owner}", name: "${repo}") {
            pullRequest(number: ${PR_NUMBER}) {
              files(first: 100) {
                nodes {
                  changeType
                  path,
                }
              }
            }
          }
        }`,
  });

  return response.repository.pullRequest.files.nodes;
}

function writePrBodyAndInfoToFile(prInfo: PRInfo) {
  const prBodyPath = path.resolve(CHANGED_FILES_DIR, 'pr-body.txt');
  const labels = prInfo.labels.map((label) => label.name).join(', ');
  const updatedPrBody = `PR labels: {${labels}}\nPR base: {${
    prInfo.base.ref
  }}\n${prInfo.body?.trim()}`;
  fs.writeFileSync(prBodyPath, updatedPrBody);
  core.info(`PR body and info saved to ${prBodyPath}`);
}

function writeEmptyGitDiff() {
  core.info('Not a PR, skipping git diff');
  const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.json');
  fs.writeFileSync(outputPath, '[]');
  core.info(`Empty git diff results saved to ${outputPath}`);
}

/**
 * Main run function, stores the output of git diff and the body of the matching PR to a file.
 *
 * @returns Returns a promise that resolves when the git diff output and PR body is successfully stored.
 */
async function storeGitDiffOutputAndPrBody() {
  try {
    // Create the directory
    fs.mkdirSync(CHANGED_FILES_DIR, { recursive: true });

    core.info(`Determining whether to run git diff...`);
    if (!PR_NUMBER) {
      writeEmptyGitDiff();
      return;
    }

    const prInfo = await getPrInfo();

    const baseRef = prInfo?.base.ref;
    if (!baseRef) {
      writeEmptyGitDiff();
      return;
    }
    // We perform git diff even if the PR base is not main or skip-e2e-quality-gate label is applied
    // because we rely on the git diff results for other jobs
    core.info('Attempting to get git diff...');
    const diffOutput = JSON.stringify(await getPrFilesChanged());
    core.info(diffOutput);

    // Store the output of git diff
    const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.json');
    fs.writeFileSync(outputPath, diffOutput);
    core.info(`Git diff results saved to ${outputPath}`);

    writePrBodyAndInfoToFile(prInfo);

    core.info('success');
  } catch (error: any) {
    core.setFailed(`Failed to process git diff: ${error.message}`);
  }
}

// If main module (i.e. this is the TS file that was run directly)
if (require.main === module) {
  storeGitDiffOutputAndPrBody();
}
