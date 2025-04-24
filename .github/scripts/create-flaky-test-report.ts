import JSZip from 'jszip';
import type { TestRun } from './shared/test-reports';
import { IncomingWebhook } from '@slack/webhook';

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
        const zip = await JSZip.loadAsync(response.data as ArrayBuffer);
        const file = zip.files['test-runs.json'];
        if (!file) throw new Error(`'test-runs.json' file in zip not found!`);
        const content = await file.async('string');
        return JSON.parse(content);
      }),
    )
  ).flat();

  const failedTests = testRuns.flatMap((testRun) =>
    testRun.testFiles.flatMap((testFile) =>
      testFile.testSuites.flatMap((testSuite) =>
        testSuite.testCases
          .filter((testCase) => testCase.status === 'failed')
          .map((testCase) => ({ ...testCase, path: testFile.path })),
      ),
    ),
  );

  const summarizedFailedTests = Object.values(
    failedTests.reduce<
      Record<string, (typeof failedTests)[number] & { count: number }>
    >((summary, test) => {
      if (summary[test.name]) {
        summary[test.name].count += 1;
      } else {
        summary[test.name] = { ...test, count: 1 };
      }
      return summary;
    }, {}),
  ).sort((a, b) => b.count - a.count);

  const options = { year: 'numeric', month: 'long', day: 'numeric' } as const;
  const fromDateString = from.toLocaleDateString('en-US', options);
  const toDateString = to.toLocaleDateString('en-US', options);

  console.log(
    `❌ Failed tests on the ${env.REPOSITORY} repository ${env.BRANCH} branch from ${fromDateString} to ${toDateString}`,
  );
  const lines = [
    `\n\n:x: Failed tests on the <https://github.com/${env.OWNER}/${env.REPOSITORY}|${env.REPOSITORY}> repository <https://github.com/${env.OWNER}/${env.REPOSITORY}/tree/${env.BRANCH}|${env.BRANCH}> branch from ${fromDateString} to ${toDateString}`,
  ];

  for (const test of summarizedFailedTests) {
    const issue = {
      template: 'general-issue.yml',
      labels: ['type-bug', 'Sev2-normal', 'flaky tests'].toString(),
      title: `Flaky test: \`${test.name}\``,
      description: `\`\`\`js\n${test.error}\n\`\`\``,
    };
    const params = new URLSearchParams(issue);
    console.error(
      `• ${test.name} failed ${test.count} time${test.count > 1 ? 's' : ''}`,
    );
    lines.push(
      `\n• <https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${
        env.BRANCH
      }/${test.path}|${test.name}> failed ${test.count} time${
        test.count > 1 ? 's' : ''
      } :arrow_right: <https://github.com/${env.OWNER}/${
        env.REPOSITORY
      }/issues/new?${params.toString()}|Create an issue>`,
    );
  }

  if (env.SLACK_WEBHOOK_URL) await webhook.send({ text: lines.join('\n') });
}

main();
