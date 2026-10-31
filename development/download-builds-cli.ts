import { execFileSync } from 'node:child_process';
import { program, Option } from 'commander';
import { getGitHubToken } from '../.github/scripts/shared/github-token.mts';
import { downloadBuilds, type DownloadBuildsOptions } from './download-builds';

function getDefaultBranch(): string {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'main';
  }
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
      .default(getDefaultBranch())
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
      `Build run: ${metadata.runId} · source: ${metadata.requestedCommit} · run head: ${metadata.runHeadCommit} · build: ${metadata.buildCommit}`,
    );
    console.log('Builds downloaded and unzipped successfully.');
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
