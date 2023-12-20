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

  const builds = artifacts.filter((artifact: any) =>
    artifact.path.endsWith('.zip'),
  );

  console.log('builds', builds);

  return builds;
}

async function downloadBuilds(builds: any[]) {
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

async function unzipBuilds(folder: 'builds' | 'builds-test') {
  exec('mkdir -p dist');

  exec(`unzip ${folder}/metamask-chrome-*.zip -d dist/chrome`);

  exec(`unzip ${folder}/metamask-firefox-*.zip -d dist/firefox`);
}

async function main() {
  const branch = getGitBranch();

  const builds = await getBuilds(branch);
  // const builds = await getBuilds('e2e-revoke-permissions2');
  await downloadBuilds(builds);

  unzipBuilds('builds');
}

main();
