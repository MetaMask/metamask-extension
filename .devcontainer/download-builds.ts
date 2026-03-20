import { execSync } from 'node:child_process';
import unzipper from 'unzipper';
import { version } from '../package.json';
import { program, Option } from 'commander';
import {
  BuildType,
  getBuildLinks,
} from '../development/metamaskbot-build-announce/artifacts';

const getBranch = () => {
  try {
    return execSync('git symbolic-ref --short HEAD').toString().trim();
  } catch (error) {
    return 'main';
  }
};

interface DownloadBuildsArgs {
  owner: string;
  repository: string;
  workflowId: string;
  branch: string;
  buildType: BuildType;
  githubToken: string;
  awsCloudfrontUrl: string;
}

program
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
  .action(async (args: DownloadBuildsArgs) => {
    const { Octokit } = await import('octokit');

    console.log('Downloading latest builds from');
    console.log(`- Branch: ${args.branch}`);
    console.log(`- Build type: ${args.buildType}`);

    const github = new Octokit({ auth: args.githubToken });

    const runs = await github.rest.actions.listWorkflowRuns({
      owner: args.owner,
      repo: args.repository,
      workflow_id: args.workflowId,
      branch: args.branch,
      status: 'success',
      per_page: 1,
    });

    const latestRun = runs.data.workflow_runs.at(0);

    if (!latestRun)
      throw new Error(`No successful builds found on branch '${args.branch}'`);

    console.log(`- Run number: ${latestRun.id}`);

    const HOST_URL = `${args.awsCloudfrontUrl}/${args.repository}/${latestRun.id}`;

    const buildLinks = getBuildLinks({ hostUrl: HOST_URL, version });

    const builds = buildLinks.browserify[args.buildType];

    console.log(`Downloading build for chrome from ${builds.chrome}`);
    console.log(`Downloading build for firefox from ${builds.firefox}`);

    await Promise.all(
      Object.entries(builds).map(async ([platform, url]) => {
        const artifact = await fetch(url);
        const buffer = Buffer.from(await artifact.arrayBuffer());
        const zip = await unzipper.Open.buffer(buffer);
        await zip.extract({ path: `dist/${platform}` });
      }),
    );

    console.log('Builds downloaded and unzipped successfully.');
  });

program.parse();
