import { promisify } from 'node:util';
import { exec as callbackExec } from 'node:child_process';
import unzipper from 'unzipper';
import { version } from '../package.json';

const exec = promisify(callbackExec);

const getBranch = async () => {
  const { stdout } = await exec('git symbolic-ref --short HEAD');
  return stdout.trim();
};

async function main() {
  const { Octokit } = await import('octokit');

  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    WORKFLOW_ID: process.env.WORKFLOW_ID || 'main.yml',
    BRANCH: process.env.BRANCH || (await getBranch()),
    BUILD_TYPE: process.env.BUILD_TYPE || 'main',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    AWS_CLOUDFRONT_URL: 'https://diuv6g5fj9pvx.cloudfront.net',
  };

  const github = new Octokit({ auth: env.GITHUB_TOKEN });

  const runs = await github.rest.actions.listWorkflowRuns({
    owner: env.OWNER,
    repo: env.REPOSITORY,
    workflow_id: env.WORKFLOW_ID,
    branch: env.BRANCH,
    status: 'success',
    per_page: 1,
  });

  const latestRun = runs.data.workflow_runs.at(0);

  if (!latestRun)
    throw new Error(`No successful builds found on branch '${env.BRANCH}'`);

  const HOST_URL = `${env.AWS_CLOUDFRONT_URL}/${env.REPOSITORY}/${latestRun.id}`;

  const buildMap = {
    main: {
      chrome: `${HOST_URL}/build-dist-browserify/builds/metamask-chrome-${version}.zip`,
      firefox: `${HOST_URL}/build-dist-mv2-browserify/builds/metamask-firefox-${version}.zip`,
    },
    beta: {
      chrome: `${HOST_URL}/build-beta-browserify/builds/metamask-beta-chrome-${version}-beta.0.zip`,
      firefox: `${HOST_URL}/build-beta-mv2-browserify/builds/metamask-beta-firefox-${version}-beta.0.zip`,
    },
    flask: {
      chrome: `${HOST_URL}/build-flask-browserify/builds/metamask-flask-chrome-${version}-flask.0.zip`,
      firefox: `${HOST_URL}/build-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.0.zip`,
    },
    test: {
      chrome: `${HOST_URL}/build-test-browserify/builds/metamask-chrome-${version}.zip`,
      firefox: `${HOST_URL}/build-test-mv2-browserify/builds/metamask-firefox-${version}.zip`,
    },
    'test-flask': {
      chrome: `${HOST_URL}/build-test-flask-browserify/builds/metamask-flask-chrome-${version}-flask.0.zip`,
      firefox: `${HOST_URL}/build-test-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.0.zip`,
    },
  };

  const builds: { chrome: string; firefox: string } | undefined =
    buildMap[env.BUILD_TYPE];

  if (!builds)
    throw new Error(`No builds found for build type '${env.BUILD_TYPE}'`);

  await Promise.all(
    Object.entries(builds).map(async ([platform, url]) => {
      const artifact = await fetch(url);
      const buffer = Buffer.from(await artifact.arrayBuffer());
      const zip = await unzipper.Open.buffer(buffer);
      await zip.extract({ path: `dist/${platform}` });
    }),
  );
}

main();
