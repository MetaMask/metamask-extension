import type { Endpoints } from '@octokit/types';
import * as fs from 'fs/promises';
import path from 'path';
import type {
  TestCase,
  TestFile,
  TestRun,
  TestSuite,
} from './shared/test-reports.mts';
import {
  consoleBold,
  formatTime,
  normalizeTestPath,
  withTimeout,
  XML,
} from './shared/utils.mts';

type Job =
  Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs']['response']['data']['jobs'][number];

// Maximum time to wait for the GitHub jobs API for a single workflow run.
// If exceeded, the lookup is abandoned and the report is generated without
// job-link enrichment for that run.
const JOBS_LOOKUP_TIMEOUT_MS = 30_000;

async function main() {
  const { Octokit } = await import('octokit');

  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    BRANCH: process.env.BRANCH || 'main',
    TEST_SUMMARY_PATH:
      process.env.TEST_SUMMARY_PATH || 'test/test-results/summary.md',
    TEST_RESULTS_PATH: process.env.TEST_RESULTS_PATH || 'test/test-results/e2e',
    TEST_RUNS_PATH:
      process.env.TEST_RUNS_PATH || 'test/test-results/test-runs.json',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
  };

  const github = new Octokit({ auth: env.GITHUB_TOKEN });

  // Successful lookups are cached. Failed lookups are recorded in
  // failedRunIds so we don't retry (and re-warn) for the same runId, and so
  // the final summary can list everything that was skipped.
  const jobsCache: { [runId: number]: Job[] } = {};
  const failedRunIds = new Map<number, string>();

  async function getJobs(runId: number) {
    if (!runId) {
      return [];
    }
    if (jobsCache[runId]) {
      return jobsCache[runId];
    }
    if (failedRunIds.has(runId)) {
      return [];
    }
    try {
      const jobs = await withTimeout(
        github.paginate(github.rest.actions.listJobsForWorkflowRun, {
          owner: env.OWNER,
          repo: env.REPOSITORY,
          run_id: runId,
          per_page: 100,
        }),
        JOBS_LOOKUP_TIMEOUT_MS,
        `listJobsForWorkflowRun(runId=${runId})`,
      );
      jobsCache[runId] = jobs;
      return jobsCache[runId];
    } catch (error) {
      // Best-effort: degrade to no job-link enrichment for this runId rather
      // than failing report generation. Returning [] makes downstream code
      // emit the report without "Job: [name](url)" lines for affected suites.
      const reason = error instanceof Error ? error.message : String(error);
      failedRunIds.set(runId, reason);
      console.warn(
        `⚠️ Skipping job-link enrichment for runId=${runId}: ${reason}`,
      );
      return [];
    }
  }

  async function getJobId(runId: number, jobName: string) {
    const jobs = await getJobs(runId);
    const job = jobs.find((job) => job.name.endsWith(jobName));
    return job?.id;
  }

  let summary = '';
  const core = env.GITHUB_ACTIONS
    ? await import('@actions/core')
    : {
        summary: {
          addRaw: (text: string) => {
            summary += text;
          },
          write: async () => await fs.writeFile(env.TEST_SUMMARY_PATH, summary),
        },
        setFailed: (msg: string) => console.error(msg),
      };

  const repositoryUrl = new URL('https://github.com');
  repositoryUrl.pathname = `/${env.OWNER}/${env.REPOSITORY}`;

  try {
    const testRuns: TestRun[] = [];
    const filenames = await fs.readdir(env.TEST_RESULTS_PATH);

    // Three-phase structure so that a slow GitHub jobs API can't serialize
    // N timeouts back-to-back and exceed the workflow step's overall budget.
    // Phase 1: parse every XML in parallel.
    const parsedFiles = await Promise.all(
      filenames.map(async (filename) => {
        const file = await fs.readFile(
          path.join(env.TEST_RESULTS_PATH, filename),
          'utf8',
        );
        return XML.parse(file);
      }),
    );

    // Phase 2: collect every unique runId referenced by any suite, then
    // prefetch their jobs concurrently. Worst-case wall time becomes ~one
    // timeout regardless of how many runIds, instead of N × timeout.
    const uniqueRunIds = new Set<number>();
    for (const results of parsedFiles) {
      for (const suite of results.testsuites.testsuite || []) {
        const runId = suite.properties?.[0].property?.[1]?.$.value
          ? +suite.properties?.[0].property?.[1]?.$.value
          : 0;
        if (runId) uniqueRunIds.add(runId);
      }
    }
    await Promise.all([...uniqueRunIds].map((id) => getJobs(id)));

    // Phase 3: build the report. getJobId() below now hits jobsCache (or
    // failedRunIds) synchronously and never makes a network call.
    for (const results of parsedFiles) {
      for (const suite of results.testsuites.testsuite || []) {
        if (!suite.testcase || !suite.$.file) continue;
        const tests = +suite.$.tests;
        const failed = +suite.$.failures;
        const skipped = tests - suite.testcase.length;
        const passed = tests - failed - skipped;

        const jobName = suite.properties?.[0].property?.[0]?.$.value
          ? `${suite.properties?.[0].property?.[0]?.$.value}`
          : '';
        const runId = suite.properties?.[0].property?.[1]?.$.value
          ? +suite.properties?.[0].property?.[1]?.$.value
          : 0;
        const jobId = (await getJobId(runId, jobName)) ?? 0;
        const prNumber = suite.properties?.[0].property?.[2]?.$.value
          ? +suite.properties?.[0].property?.[2]?.$.value
          : 0;

        const testSuite: TestSuite = {
          name: suite.$.name,
          job: { name: jobName, id: jobId, runId, prNumber },
          date: new Date(suite.$.timestamp),
          tests,
          passed,
          failed,
          skipped,
          time: +suite.$.time * 1000, // convert to ms,
          attempts: [],
          testCases: [],
        };

        for (const test of suite.testcase || []) {
          const testCase: TestCase = {
            name: test.$.name,
            time: +test.$.time * 1000, // convert to ms
            status: test.failure ? 'failed' : 'passed',
            error: test.failure ? test.failure[0]._ : undefined,
          };
          testSuite.testCases.push(testCase);
        }

        const testFile: TestFile = {
          path: normalizeTestPath(suite.$.file),
          tests: testSuite.tests,
          passed: testSuite.passed,
          failed: testSuite.failed,
          skipped: testSuite.skipped,
          time: testSuite.time,
          testSuites: [testSuite],
        };

        const testRun: TestRun = {
          // regex to remove the shard number from the job name
          name: testSuite.job.name.replace(/\s+\(\d+\)$/, ''),
          testFiles: [testFile],
        };

        const existingRun = testRuns.find((run) => run.name === testRun.name);
        if (existingRun) {
          const existingFile = existingRun.testFiles.find(
            (file) => file.path === testFile.path,
          );
          if (existingFile) {
            existingFile.testSuites.push(testSuite);
          } else {
            existingRun.testFiles.push(testFile);
          }
        } else {
          testRuns.push(testRun);
        }
      }
    }

    for (const testRun of testRuns) {
      for (const testFile of testRun.testFiles) {
        // Group test suites by name
        const suitesByName: Record<string, TestSuite[]> = {};

        for (const suite of testFile.testSuites) {
          if (!suitesByName[suite.name]) {
            suitesByName[suite.name] = [];
          }
          suitesByName[suite.name].push(suite);
        }

        // Determine the latest test suite by date and nest attempts
        const attempts: TestSuite[][] = [];
        for (const suites of Object.values(suitesByName)) {
          suites.sort((a, b) => b.date.getTime() - a.date.getTime()); // sort newest first
          const [latest, ...otherAttempts] = suites;
          latest.attempts = otherAttempts;
          attempts.push(otherAttempts);
        }

        // Remove the nested attempts from the top-level list
        const attemptSet = new Set(attempts.flat());
        testFile.testSuites = testFile.testSuites.filter(
          (suite) => !attemptSet.has(suite),
        );

        const total = testFile.testSuites.reduce(
          (acc, suite) => ({
            tests: acc.tests + suite.tests,
            passed: acc.passed + suite.passed,
            failed: acc.failed + suite.failed,
            skipped: acc.skipped + suite.skipped,
            time: acc.time + suite.time,
          }),
          { tests: 0, passed: 0, failed: 0, skipped: 0, time: 0 },
        );

        testFile.tests = total.tests;
        testFile.passed = total.passed;
        testFile.failed = total.failed;
        testFile.skipped = total.skipped;
        testFile.time = total.time;
      }

      testRun.testFiles.sort((a, b) => a.path.localeCompare(b.path));

      const title = `<strong>${testRun.name}</strong>`;

      if (testRun.testFiles.length) {
        const total = testRun.testFiles.reduce(
          (acc, file) => ({
            tests: acc.tests + file.tests,
            passed: acc.passed + file.passed,
            failed: acc.failed + file.failed,
            skipped: acc.skipped + file.skipped,
            time: acc.time + file.time,
          }),
          { tests: 0, passed: 0, failed: 0, skipped: 0, time: 0 },
        );

        if (total.failed > 0) {
          if (testRun.name) console.log(`${consoleBold(title)} ❌`);
          core.summary.addRaw(`\n<details open>\n`);
          core.summary.addRaw(`\n<summary>${title} ❌</summary>\n`);
        } else {
          if (testRun.name) console.log(`${consoleBold(title)} ✅`);
          core.summary.addRaw(`\n<details>\n`);
          core.summary.addRaw(`\n<summary>${title} ✅</summary>\n`);
        }

        const times = testRun.testFiles
          .map((file) =>
            file.testSuites.map((suite) => ({
              start: suite.date.getTime(),
              end: suite.date.getTime() + suite.time,
            })),
          )
          .flat();
        const earliestStart = Math.min(...times.map((t) => t.start));
        const latestEnd = Math.max(...times.map((t) => t.end));
        const executionTime = latestEnd - earliestStart;

        const conclusion = `<strong>${total.tests}</strong> ${
          total.tests === 1 ? 'test was' : 'tests were'
        } completed in <strong>${formatTime(
          executionTime,
        )}</strong> with <strong>${total.passed}</strong> passed, <strong>${
          total.failed
        }</strong> failed and <strong>${total.skipped}</strong> skipped.`;

        console.log(consoleBold(conclusion));
        core.summary.addRaw(`\n${conclusion}\n`);

        if (total.failed) {
          console.error(`\n❌ Failed tests\n`);
          core.summary.addRaw(`\n#### ❌ Failed tests\n`);
          core.summary.addRaw(
            `\n<hr style="height: 1px; margin-top: -5px; margin-bottom: 10px;">\n`,
          );
          for (const file of testRun.testFiles) {
            if (file.failed === 0) continue;
            console.error(file.path);
            const testUrl = new URL(repositoryUrl);
            testUrl.pathname += `/blob/${env.BRANCH}/${file.path}`;
            core.summary.addRaw(`\n#### [${file.path}](${testUrl})\n`);
            for (const suite of file.testSuites) {
              if (suite.failed === 0) continue;
              if (suite.job.name && suite.job.id && suite.job.runId) {
                const jobUrl = new URL(repositoryUrl);
                jobUrl.pathname += `/actions/runs/${suite.job.runId}/job/${suite.job.id}`;
                if (suite.job.prNumber) {
                  jobUrl.search = new URLSearchParams({
                    pr: suite.job.prNumber.toString(),
                  }).toString();
                }
                core.summary.addRaw(
                  `\n##### Job: [${suite.job.name}](${jobUrl})\n`,
                );
              }
              for (const test of suite.testCases) {
                if (test.status !== 'failed') continue;
                console.error(`  ${test.name}`);
                console.error(`  ${test.error}\n`);
                core.summary.addRaw(`\n##### ${test.name}\n`);
                core.summary.addRaw(`\n\`\`\`js\n${test.error}\n\`\`\`\n`);
              }
            }
          }
        }

        const rows = testRun.testFiles.map((file) => ({
          'Test file': file.path,
          Passed: file.passed ? `${file.passed} ✅` : '',
          Failed: file.failed ? `${file.failed} ❌` : '',
          Skipped: file.skipped ? `${file.skipped} ⏩` : '',
          Time: formatTime(file.time),
        }));

        const columns = Object.keys(rows[0]);
        const header = `| ${columns.join(' | ')} |`;
        const alignment = '| :--- | ---: | ---: | ---: | ---: |';
        const body = rows
          .map((row) => {
            const testUrl = new URL(repositoryUrl);
            testUrl.pathname += `/blob/${env.BRANCH}/${row['Test file']}`;
            const data = {
              ...row,
              'Test file': `[${row['Test file']}](${testUrl})`,
            };
            return `| ${Object.values(data).join(' | ')} |`;
          })
          .join('\n');
        const table = [header, alignment, body].join('\n');

        console.table(rows);
        core.summary.addRaw(`\n${table}\n`);
      } else {
        core.summary.addRaw(`\n<details open>\n`);
        core.summary.addRaw(`<summary>${title}</summary>\n`);
        console.log('No tests found');
        core.summary.addRaw('No tests found');
      }
      console.log();
      core.summary.addRaw(`</details>\n`);
    }

    await core.summary.write();
    await fs.writeFile(env.TEST_RUNS_PATH, JSON.stringify(testRuns, null, 2));

    if (failedRunIds.size > 0) {
      console.warn(
        `⚠️ Job-link enrichment was skipped for ${failedRunIds.size} workflow run(s): ${[
          ...failedRunIds.keys(),
        ].join(', ')}`,
      );
    }
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main();
