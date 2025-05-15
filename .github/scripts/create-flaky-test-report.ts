import unzipper from 'unzipper';
import type { TestRun } from './shared/test-reports';
import { IncomingWebhook } from '@slack/webhook';
import { hasProperty } from '@metamask/utils';
import type { AnyBlock } from '@slack/types';

async function main() {
  const { Octokit } = await import('octokit');

  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    WORKFLOW_ID: process.env.WORKFLOW_ID || 'main.yml',
    BRANCH: process.env.BRANCH || 'main',
    FROM_DATE:
      process.env.FROM_DATE ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // default: yesterday
    TO_DATE: process.env.TO_DATE || new Date().toISOString(), // default: today
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  };

  const github = new Octokit({ auth: env.GITHUB_TOKEN });
  const webhook = new IncomingWebhook(env.SLACK_WEBHOOK_URL);

  const from = new Date(env.FROM_DATE);
  const to = new Date(env.TO_DATE);

  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    owner: env.OWNER,
    repo: env.REPOSITORY,
    workflow_id: env.WORKFLOW_ID,
    branch: env.BRANCH,
    event: 'push',
    status: 'failure',
    created: `${from.toISOString()}..${to.toISOString()}`,
    per_page: 100,
  });

  const artifacts = (
    await Promise.all(
      runs.map(async (run) => {
        const artifacts = await github.paginate(
          github.rest.actions.listWorkflowRunArtifacts,
          {
            owner: env.OWNER,
            repo: env.REPOSITORY,
            run_id: run.id,
            per_page: 100,
          },
        );

        const chromeTestReport = artifacts.find(
          (artifact) => artifact.name === 'test-e2e-chrome-report',
        );
        if (!chromeTestReport) return [];

        const firefoxTestReport = artifacts.find(
          (artifact) => artifact.name === 'test-e2e-firefox-report',
        );
        if (!firefoxTestReport) return [];

        return [chromeTestReport, firefoxTestReport];
      }),
    )
  ).flat();

  const testRuns: TestRun[] = (
    await Promise.all(
      artifacts.map(async (artifact) => {
        const response = await github.rest.actions.downloadArtifact({
          owner: env.OWNER,
          repo: env.REPOSITORY,
          artifact_id: artifact.id,
          archive_format: 'zip',
        });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        const zip = await unzipper.Open.buffer(buffer);
        const file = zip.files.find((file) =>
          file.path.startsWith('test-runs'),
        );
        if (!file) throw new Error(`test-runs file in zip not found!`);
        const content = await file.buffer();
        return JSON.parse(content.toString());
      }),
    )
  ).flat();

  const failedTests = testRuns
    .flatMap((testRun) =>
      testRun.testFiles.flatMap((testFile) =>
        testFile.testSuites.flatMap((testSuite) =>
          testSuite.testCases
            .map((testCase) => ({
              ...testCase,
              path: testFile.path,
              jobId: testSuite.job.id,
              runId: testSuite.job.runId,
              date: new Date(testSuite.date),
            }))
            .concat(
              testSuite.attempts.flatMap((attempt) =>
                attempt.testCases.map((testCase) => ({
                  ...testCase,
                  path: testFile.path,
                  jobId: attempt.job.id,
                  runId: attempt.job.runId,
                  date: new Date(attempt.date),
                })),
              ),
            )
            .filter((testCase) => testCase.status === 'failed'),
        ),
      ),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const summarizedFailedTests = Object.values(
    failedTests.reduce<
      Record<string, (typeof failedTests)[number] & { count: number }>
    >((summary, test) => {
      if (hasProperty(summary, test.name) && summary[test.name]) {
        summary[test.name].count += 1;
      } else {
        summary[test.name] = { ...test, count: 1 };
      }
      return summary;
    }, {}),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const options = { year: 'numeric', month: 'long', day: 'numeric' } as const;
  const fromDateString = from.toLocaleDateString('en-US', options);
  const toDateString = to.toLocaleDateString('en-US', options);

  const repositoryUrl = new URL('https://github.com');
  repositoryUrl.pathname = `/${env.OWNER}/${env.REPOSITORY}`;

  const branchUrl = new URL(repositoryUrl);
  branchUrl.pathname += `/tree/${env.BRANCH}`;

  console.log(
    `❌ Top 10 failed tests on the ${env.REPOSITORY} repository ${env.BRANCH} branch from ${fromDateString} to ${toDateString}`,
  );
  const blocks: AnyBlock[] = [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'x',
            },
            {
              type: 'text',
              text: ' Top 10 failed tests on the ',
            },
            {
              type: 'link',
              url: repositoryUrl.toString(),
              text: env.REPOSITORY,
            },
            {
              type: 'text',
              text: ' repository ',
            },
            {
              type: 'link',
              url: branchUrl.toString(),
              text: env.BRANCH,
            },
            {
              type: 'text',
              text: ` branch from ${fromDateString} to ${toDateString}`,
            },
          ],
        },
      ],
    },
  ];

  if (!summarizedFailedTests.length) {
    console.log('No failed tests found, good job!');
    blocks.push({
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'No failed tests found, good job!',
            },
          ],
        },
      ],
    });
  } else {
    for (const test of summarizedFailedTests) {
      const testUrl = new URL(repositoryUrl);
      testUrl.pathname += `/blob/${env.BRANCH}/${test.path}`;

      const jobUrl = new URL(repositoryUrl);
      jobUrl.pathname += `/actions/runs/${test.runId}/job/${test.jobId}`;

      const issueUrl = new URL(repositoryUrl);
      issueUrl.pathname += '/issues/new';
      issueUrl.search = new URLSearchParams({
        template: 'general-issue.yml',
        labels: ['type-bug', 'Sev2-normal', 'flaky tests'].toString(),
        title: `Flaky test: \`${test.name}\``,
        description: `[View logs](${jobUrl})\n\`\`\`js\n${test.error}\n\`\`\``,
      }).toString();

      console.error(
        `• ${test.name} failed ${test.count} time${test.count > 1 ? 's' : ''}`,
      );

      blocks.push({
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '• ',
              },
              {
                type: 'link',
                url: testUrl.toString(),
                text: test.name,
              },
              {
                type: 'text',
                text: ` failed ${test.count} time${test.count > 1 ? 's' : ''} `,
              },
              {
                type: 'emoji',
                name: 'arrow_right',
              },
              {
                type: 'text',
                text: ' ',
              },
              {
                type: 'link',
                url: jobUrl.toString(),
                text: 'View logs',
              },
              {
                type: 'text',
                text: ' | ',
              },
              {
                type: 'link',
                url: issueUrl.toString(),
                text: 'Create issue',
              },
            ],
          },
        ],
      });
    }
  }

  if (env.SLACK_WEBHOOK_URL) {
    const BATCH_SIZE = 50; // Slack API limit is 50 blocks per request
    for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
      const batch = blocks.slice(i, i + BATCH_SIZE);
      await webhook.send({ blocks: batch });
    }
  }
}

main();
