import { retry } from './shared/utils';
import * as core from '@actions/core';

async function main() {
  const { Octokit } = await import('octokit');

  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    RUN_ID: +process.env.RUN_ID!,
    JOB_NAME: process.env.JOB_NAME!,
    ATTEMPT_NUMBER: +process.env.ATTEMPT_NUMBER!,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
  };

  const github = new Octokit({ auth: env.GITHUB_TOKEN });

  const job = await retry(async () => {
    const jobs = github.paginate.iterator(
      github.rest.actions.listJobsForWorkflowRunAttempt,
      {
        owner: env.OWNER,
        repo: env.REPOSITORY,
        run_id: env.RUN_ID,
        attempt_number: env.ATTEMPT_NUMBER,
        per_page: 100,
      },
    );
    for await (const response of jobs) {
      const job = response.data.find((job) => job.name.endsWith(env.JOB_NAME));
      if (job) return job;
    }
    throw new Error(`Job with name '${env.JOB_NAME}' not found`);
  });

  console.log(`The job id for '${env.JOB_NAME}' is '${job.id}'`);
  if (env.GITHUB_ACTIONS) core.setOutput('job-id', job.id);
}

main();
