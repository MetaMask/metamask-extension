// import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import * as github from '@actions/github';
import * as core from '@actions/core';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import { spawnSync } from 'child_process';

const CHANGED_FILES_DIR = 'changed-files';

function getGithubToken(): string {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_ACCESS_TOKEN ||
    core.getInput('github-token') ||
    spawnSync('gh', ['auth', 'token'], { encoding: 'utf-8' })
      .stdout.toString()
      .trim();

  if (!token) {
    throw new Error(
      'Missing GitHub token. Set GITHUB_TOKEN (recommended) or provide the `github-token` input.',
    );
  }

  return token;
}

type GitDiffChangedFileNode = {
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  path: string;
};

type Octokit = ReturnType<typeof github.getOctokit>;
type CompareCommitsResponseData = GetResponseDataTypeFromEndpointMethod<
  Octokit['rest']['repos']['compareCommitsWithBasehead']
>;

function toGitDiffNameStatusOutput(
  comparisonData: CompareCommitsResponseData,
): string {
  // Matches `git diff --name-status --no-renames <base>...<head>` output.
  // We intentionally do not try to output `Rxxx old\tnew` rename lines because
  // the compare API does not provide similarity scores.
  const files = (comparisonData as any).files as
    | Array<{
        filename: string;
        status: string;
        previous_filename?: string;
      }>
    | undefined;

  if (!files) {
    return '';
  }

  const lines: string[] = [];
  for (const file of files) {
    const filename = file.filename;
    const status = file.status;

    if (status === 'added') {
      lines.push(`A\t${filename}`);
    } else if (status === 'modified') {
      lines.push(`M\t${filename}`);
    } else if (status === 'removed') {
      lines.push(`D\t${filename}`);
    } else if (status === 'renamed') {
      // `--no-renames` represents a rename as delete+add.
      if (file.previous_filename) {
        lines.push(`D\t${file.previous_filename}`);
      }
      lines.push(`A\t${filename}`);
    } else {
      core.warning(
        `Unknown compare status "${status}" for file "${filename}"; treating as modified`,
      );
      lines.push(`M\t${filename}`);
    }
  }

  return lines.join('\n') + (lines.length ? '\n' : '');
}

function toGitDiffChangedFiles(
  comparisonData: CompareCommitsResponseData,
): GitDiffChangedFileNode[] {
  // The compare API uses lowercase file status strings.
  // The existing "git diff" workflow output uses GraphQL changeType values.
  const files = (comparisonData as any).files as
    | Array<{
        filename: string;
        status: string;
        previous_filename?: string;
      }>
    | undefined;

  if (!files) {
    return [];
  }

  const changedFiles: GitDiffChangedFileNode[] = [];
  for (const file of files) {
    const filename = file.filename;
    const status = file.status;

    if (status === 'renamed') {
      // Match the behavior in getChangedFilesFromApi below: treat rename as delete+add.
      changedFiles.push({ changeType: 'ADDED', path: filename });
      if (file.previous_filename) {
        changedFiles.push({
          changeType: 'DELETED',
          path: file.previous_filename,
        });
      }
      continue;
    }

    if (status === 'added') {
      changedFiles.push({ changeType: 'ADDED', path: filename });
    } else if (status === 'modified') {
      changedFiles.push({ changeType: 'MODIFIED', path: filename });
    } else if (status === 'removed') {
      changedFiles.push({ changeType: 'DELETED', path: filename });
    } else {
      core.warning(
        `Unknown compare status "${status}" for file "${filename}"; treating as MODIFIED`,
      );
      changedFiles.push({ changeType: 'MODIFIED', path: filename });
    }
  }

  return changedFiles;
}

async function main() {
  const client = github.getOctokit(getGithubToken());

  const comparison = await client.rest.repos.compareCommitsWithBasehead({
    owner: 'MetaMask',
    repo: 'MetaMask-extension',
    basehead: `main...release/13.20.0`,
  });

  // Take comparison.data and make it into the same output format that `git diff --name-status` returns
  const gitDiffNameStatus = toGitDiffNameStatusOutput(comparison.data as any);

  // Also generate the structured format used by our workflow script (GraphQL changeType/path)
  const changedFiles = toGitDiffChangedFiles(comparison.data as any);

  fs.mkdirSync(CHANGED_FILES_DIR, { recursive: true });
  const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.json');
  fs.writeFileSync(outputPath, JSON.stringify(changedFiles, null, 2));
  core.info(`Wrote ${changedFiles.length} changed files to ${outputPath}`);

  const nameStatusPath = path.resolve(
    CHANGED_FILES_DIR,
    'git-diff-name-status.txt',
  );
  fs.writeFileSync(nameStatusPath, gitDiffNameStatus);
  core.info(`Wrote git diff name-status output to ${nameStatusPath}`);

  // const pulls = await github.rest.pulls.get({
  //   owner: 'MetaMask',
  //   repo: 'MetaMask-extension',
  //   pull_number: 39859,
  // });

  // console.log(pulls.data);

  // console.log(`Lines added: ${pulls.data.additions}`);
  // console.log(`Lines removed: ${pulls.data.deletions}`);

  // const two = await github.request(
  //   'GET /repos/{owner}/{repo}/compare/{basehead}',
  //   {
  //     owner: 'MetaMask',
  //     repo: 'MetaMask-extension',
  //     basehead: `main...trigger-ci-prep-deps-speedup`,
  //     headers: {
  //       'X-GitHub-Api-Version': '2022-11-28',
  //     },
  //   },
  // );

  // console.log(two.data);

  // Using comparison, get the number of lines added and removed in the comparison
  // const linesAdded = comparison.data.files.reduce(
  //   (acc, file) => acc + file.additions,
  //   0,
  // );
  // const linesRemoved = comparison.data.files.reduce(
  //   (acc, file) => acc + file.deletions,
  //   0,
  // );
  // console.log(`Lines added: ${linesAdded}`);
  // console.log(`Lines removed: ${linesRemoved}`);
}

interface ChangedFile {
  filename: string;
  status: string;
}

// Uses github REST api to get list of files changed in PR
async function getChangedFilesFromApi(
  token: string,
  prNumber: number,
): Promise<ChangedFile[]> {
  core.startGroup(
    `Fetching list of changed files for PR#${prNumber} from Github API`,
  );
  try {
    const client = github.getOctokit(token);
    const per_page = 100;
    const files: ChangedFile[] = [];

    core.info(
      `Invoking listFiles(pull_number: ${prNumber}, per_page: ${per_page})`,
    );
    for await (const response of client.paginate.iterator(
      client.rest.pulls.listFiles.endpoint.merge({
        owner: /*github.context.repo.owner*/ 'MetaMask',
        repo: /*github.context.repo.repo*/ 'MetaMask-extension',
        pull_number: prNumber,
        per_page,
      }),
    )) {
      if (response.status !== 200) {
        throw new Error(
          `Fetching list of changed files from GitHub API failed with error code ${response.status}`,
        );
      }
      core.info(`Received ${response.data.length} items`);

      for (const row of response.data as GetResponseDataTypeFromEndpointMethod<
        typeof client.rest.pulls.listFiles
      >) {
        core.info(`[${row.status}] ${row.filename}`);
        // There's no obvious use-case for detection of renames
        // Therefore we treat it as if rename detection in git diff was turned off.
        // Rename is replaced by delete of original filename and add of new filename
        if (row.status === 'renamed') {
          files.push({
            filename: row.filename,
            status: 'added',
          });
          files.push({
            // 'previous_filename' for some unknown reason isn't in the type definition or documentation
            filename: (<any>row).previous_filename as string,
            status: 'deleted',
          });
        } else {
          // Github status and git status variants are same except for deleted files
          const status = row.status === 'removed' ? 'deleted' : row.status;
          files.push({
            filename: row.filename,
            status,
          });
        }
      }
    }

    return files;
  } finally {
    core.endGroup();
  }
}

// main().catch((error: unknown) => {
//   const message = error instanceof Error ? error.message : String(error);
//   core.setFailed(message);
// });

async function doop() {
  const client = github.getOctokit(getGithubToken());

  const response = await client.request(
    'GET /repos/{owner}/{repo}/compare/{basehead}',
    {
      owner: 'MetaMask',
      repo: 'metamask-extension',
      basehead: 'main...deep-link-e2e-split',
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
    },
  );

  const diffText = response.data; // string diff

  console.log(diffText);
}

doop();
