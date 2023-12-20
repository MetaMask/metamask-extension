import { execSync } from 'child_process';
import util from 'util';

const exec = util.promisify(require('node:child_process').exec);

function getGitBranch() {
  const gitOutput = execSync('git status').toString();

  const branchRegex = /On branch (?<branch>.*)\n/;
  return gitOutput.match(branchRegex)?.groups?.branch || 'develop';
}

async function getBuilds(branch: string) {
  let response = await fetch(
    `https://circleci.com/api/v2/project/gh/MetaMask/metamask-extension/pipeline?branch=${branch}`,
  );

  const pipelineId = (await response.json()).items[0].id;

  console.log('pipelineId', pipelineId);

  response = await fetch(
    `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`,
  );

  const workflowId = (await response.json()).items[0].id;

  console.log('workflowId', workflowId);

  response = await fetch(
    `https://circleci.com/api/v2/workflow/${workflowId}/job`,
  );

  const jobs = (await response.json()).items;

  const jobPublishPrereleaseId = jobs.find(
    (job: any) => job.name === 'job-publish-prerelease',
  ).job_number;

  console.log('jobPublishPrereleaseId', jobPublishPrereleaseId);

  response = await fetch(
    `https://circleci.com/api/v2/project/gh/MetaMask/metamask-extension/${jobPublishPrereleaseId}/artifacts`,
  );

  const artifacts = (await response.json()).items;

  if (!artifacts || artifacts.length === 0) {
    return [];
  }

  const builds = artifacts.filter((artifact: any) =>
    artifact.path.endsWith('.zip'),
  );

  console.log('builds', builds);

  return builds;
}

function getVersionNumber(builds: any[]) {
  for (const build of builds) {
    const versionRegex =
      /builds\/metamask-chrome-(?<version>\d+\.\d+\.\d+).zip/;

    const versionNumber = build.path.match(versionRegex)?.groups?.version;

    if (versionNumber) {
      return versionNumber;
    }
  }
}

async function downloadBuilds(builds: any[]) {
  if (!builds || builds.length === 0) {
    console.log('no builds found');
    return;
  }

  const buildPromises = [] as Promise<any>[];

  for (const build of builds) {
    if (
      build.path.startsWith('builds/') ||
      build.path.startsWith('builds-test/')
    ) {
      const { url } = build;

      console.log('downloading', build.path);

      buildPromises.push(exec(`curl -L --create-dirs -o ${build.path} ${url}`));
    }
  }

  await Promise.all(buildPromises);

  console.log('downloads complete');
}

async function unzipBuilds(
  folder: 'builds' | 'builds-test',
  versionNumber: string,
) {
  if (!versionNumber) {
    return;
  }

  execSync('rm -rf dist && mkdir -p dist');

  execSync(
    `unzip ${folder}/metamask-chrome-${versionNumber}.zip -d dist/chrome`,
  );

  execSync(
    `unzip ${folder}/metamask-firefox-${versionNumber}.zip -d dist/firefox`,
  );
}

async function main() {
  const branch = getGitBranch();

  const builds = await getBuilds(branch);

  await downloadBuilds(builds);

  const versionNumber = getVersionNumber(builds);

  unzipBuilds('builds-test', versionNumber);
}

main();
