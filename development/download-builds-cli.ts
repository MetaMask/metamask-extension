import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { program, Option } from 'commander';
import { getGitHubToken } from '../.github/scripts/shared/github-token.mts';
import { downloadBuilds, type DownloadBuildsOptions } from './download-builds';

const GIT_HEAD_REF_PREFIX = 'ref: refs/heads/';
// Resolve the repo root from the invoked script path so branch detection works
// from any cwd. This avoids a PATH-based `git` lookup, which Sonar flags and
// which would be less deterministic than reading the checked-out repo metadata.
const SCRIPT_PATH = resolve(process.argv[1] ?? '.');
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..');

function getBranch(): string {
  try {
    const gitDir = resolveGitDir(REPO_ROOT);
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
    if (head.startsWith(GIT_HEAD_REF_PREFIX)) {
      return head.slice(GIT_HEAD_REF_PREFIX.length);
    }
  } catch {
    // Ignore and fall back to the default branch.
  }
  return 'main';
}

function resolveGitDir(root: string): string {
  const dotGitPath = join(root, '.git');
  const gitMetadata = statSync(dotGitPath);
  if (gitMetadata.isDirectory()) {
    return dotGitPath;
  }
  const gitdir = readFileSync(dotGitPath, 'utf8').trim();
  if (!gitdir.startsWith('gitdir: ')) {
    throw new Error('Unexpected .git file format');
  }
  return resolve(root, gitdir.slice('gitdir: '.length).trim());
}

type DownloadBuildsArgs = DownloadBuildsOptions & {
  githubToken: string;
};

program
  .name('download-builds')
  .addOption(
    new Option('-o, --owner <string>', 'owner of the repository')
      .default('metamask')
      .env('OWNER'),
  )
  .addOption(
    new Option('-r, --repository <string>', 'repository name')
      .default('metamask-extension')
      .env('REPOSITORY'),
  )
  .addOption(
    new Option('-w, --workflow-id <string>', 'workflow id')
      .default('main.yml')
      .env('WORKFLOW_ID'),
  )
  .addOption(
    new Option('-b, --branch <string>', 'branch name')
      .default(getBranch())
      .env('BRANCH'),
  )
  .addOption(
    new Option('-t, --build-type <string>', 'build type')
      .default('main')
      .env('BUILD_TYPE')
      .choices(['main', 'beta', 'experimental', 'flask', 'test', 'test-flask']),
  )
  .addOption(
    new Option('-g, --github-token <string>', 'github token')
      .default('')
      .env('GITHUB_TOKEN'),
  )
  .addOption(
    new Option('-a, --aws-cloudfront-url <string>', 'aws cloudfront url')
      .default('https://diuv6g5fj9pvx.cloudfront.net')
      .env('AWS_CLOUDFRONT_URL'),
  )
  .option(
    '--ref <commit>',
    'pin an exact commit/ref instead of the latest branch workflow run',
  )
  .addOption(
    new Option('--browser <browser>', 'browser to download')
      .choices(['chrome', 'firefox', 'all'])
      .default('all'),
  )
  .option(
    '--destination <directory>',
    'browser output parent directory',
    'dist',
  )
  .option(
    '--metadata <file>',
    'write source/build provenance and download URLs as JSON',
  )
  .option(
    '--wait-seconds <seconds>',
    'polling budget for canonical build availability',
    Number,
    1200,
  )
  .option('--poll-seconds <seconds>', 'poll interval while waiting', Number, 20)
  .action(async (args: DownloadBuildsArgs) => {
    const { Octokit } = await import('octokit');
    const github = new Octokit({ auth: args.githubToken || getGitHubToken() });
    const metadata = await downloadBuilds(args, {
      api: async (endpoint) => (await github.request(`GET /${endpoint}`)).data,
    });
    console.log(
      `Build run: ${metadata.runId} · source: ${metadata.requestedCommit} · donor: ${metadata.buildCommit}`,
    );
    console.log('Builds downloaded and unzipped successfully.');
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
