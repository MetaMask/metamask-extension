import { retry } from './shared/utils';
import { z } from 'zod';
import * as core from '@actions/core';

async function main() {
  const { Octokit } = await import('octokit');

  const env = z
    .object({
      OWNER: z.string().default('metamask'),
      REPOSITORY: z.string().default('metamask-extension'),
      RUN_ID: z.coerce.number(),
      JOB_NAME: z.string(),
      ATTEMPT_NUMBER: z.coerce.number(),
      GITHUB_TOKEN: z.string(),
      GITHUB_ACTIONS: z.coerce.boolean().default(false),
    })
    .parse(process.env);

  const github = new Octokit({ auth: env.GITHUB_TOKEN });

  const job = await retry(async () => {
    const jobs = await github.paginate(
      github.rest.actions.listJobsForWorkflowRunAttempt,
      {
        owner: env.OWNER,
        repo: env.REPOSITORY,
        run_id: env.RUN_ID,
        attempt_number: env.ATTEMPT_NUMBER,
        per_page: 100,
      },
    );
    const job = jobs.find((job) => job.name.endsWith(env.JOB_NAME));
    if (!job) {
      throw new Error(`Job with name '${env.JOB_NAME}' not found`);
    }
    return job;
  });

  console.log(`The job id for '${env.JOB_NAME}' is '${job.id}'`);
  if (env.GITHUB_ACTIONS) core.setOutput('job-id', job.id);
}

main();
