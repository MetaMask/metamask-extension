import { execSync } from 'child_process';
import util from 'util';

const exec = util.promisify(require('node:child_process').exec);

function getGitBranch() {
  const gitOutput = execSync('git status').toString();

  const branchRegex = /On branch (?<branch>.*)\n/;
  return gitOutput.match(branchRegex)?.groups?.branch || 'develop';
}

async function getCircleJobs(branch: string) {
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

  return jobs;
}

async function getBuilds(branch: string, jobNames: string[]) {
  const jobs = await getCircleJobs(branch);
  let builds = [] as any[];

  for (const jobName of jobNames) {
    const jobId = jobs.find((job: any) => job.name === jobName).job_number;

    console.log('jobName', jobName, 'jobId', jobId);

    const response = await fetch(
      `https://circleci.com/api/v2/project/gh/MetaMask/metamask-extension/${jobId}/artifacts`,
    );

    const artifacts = (await response.json()).items;

    if (!artifacts || artifacts.length === 0) {
      return [];
    }

    builds = builds.concat(
      artifacts.filter((artifact: any) => artifact.path.endsWith('.zip')),
    );
  }

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

  // const builds = await getBuilds(branch, ['job-publish-prerelease']);
  const builds = await getBuilds(branch, ['prep-build', 'prep-build-test']);

  console.log('builds', builds);

  await downloadBuilds(builds);

  const versionNumber = getVersionNumber(builds);

  unzipBuilds('builds-test', versionNumber);
}

main();
