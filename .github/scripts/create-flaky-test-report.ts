import JSZip from 'jszip';
import type { TestRun } from './create-e2e-test-report';

async function main() {
  const { Octokit } = await import('octokit');

  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    WORKFLOW_ID: process.env.WORKFLOW_ID || 'main.yml',
    BRANCH: process.env.BRANCH || 'main',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
  };

  const github = new Octokit({ auth: env.GITHUB_TOKEN });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();

  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    owner: env.OWNER,
    repo: env.REPOSITORY,
    workflow_id: env.WORKFLOW_ID,
    branch: env.BRANCH,
    event: 'push',
    status: 'failure',
    created: `${yesterday.toISOString()}..${today.toISOString()}`,
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
    testRun.testSuites.flatMap((testSuite) =>
      testSuite.testCases.filter((testCase) => testCase.status === 'failed'),
    ),
  );

  const summarizedFailedTests = Object.values(
    failedTests.reduce<Record<string, { name: string; count: number }>>(
      (summary, test) => {
        if (summary[test.name]) {
          summary[test.name].count += 1;
        } else {
          summary[test.name] = { name: test.name, count: 1 };
        }
        return summary;
      },
      {},
    ),
  ).sort((a, b) => b.count - a.count);
}

main();
