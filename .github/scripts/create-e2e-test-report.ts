import * as fs from 'fs/promises';
import path from 'path';
import type {
  TestCase,
  TestFile,
  TestRun,
  TestSuite,
} from './shared/test-reports';
import {
  consoleBold,
  formatTime,
  normalizeTestPath,
  XML,
} from './shared/utils';

async function main() {
  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    BRANCH: process.env.BRANCH || 'main',
    TEST_SUMMARY_PATH:
      process.env.TEST_SUMMARY_PATH || 'test/test-results/summary.md',
    TEST_RESULTS_PATH: process.env.TEST_RESULTS_PATH || 'test/test-results/e2e',
    TEST_RUNS_PATH:
      process.env.TEST_RUNS_PATH || 'test/test-results/test-runs.json',
    RUN_ID: process.env.RUN_ID ? +process.env.RUN_ID : 0,
    PR_NUMBER: process.env.PR_NUMBER ? +process.env.PR_NUMBER : 0,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
  };

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

  try {
    const testRuns: TestRun[] = [];
    const filenames = await fs.readdir(env.TEST_RESULTS_PATH);

    for (const filename of filenames) {
      const file = await fs.readFile(
        path.join(env.TEST_RESULTS_PATH, filename),
        'utf8',
      );
      const results = await XML.parse(file);

      for (const suite of results.testsuites.testsuite || []) {
        if (!suite.testcase || !suite.$.file) continue;
        const tests = +suite.$.tests;
        const failed = +suite.$.failures;
        const skipped = tests - suite.testcase.length;
        const passed = tests - failed - skipped;

        const testSuite: TestSuite = {
          name: suite.$.name,
          job: {
            name: suite.properties?.[0].property?.[0]?.$.value ?? '',
            id: suite.properties?.[0].property?.[1]?.$.value ?? '',
            runId: suite.properties?.[0].property?.[2]?.$.value ?? '',
          },
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
            core.summary.addRaw(
              `\n#### [${file.path}](https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${env.BRANCH}/${file.path})\n`,
            );
            for (const suite of file.testSuites) {
              if (suite.failed === 0) continue;
              if (suite.job.name && suite.job.id && env.RUN_ID) {
                core.summary.addRaw(
                  `\n##### Job: [${suite.job.name}](https://github.com/${
                    env.OWNER
                  }/${env.REPOSITORY}/actions/runs/${env.RUN_ID}/job/${
                    suite.job.id
                  }${env.PR_NUMBER ? `?pr=${env.PR_NUMBER}` : ''})\n`,
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
            const data = {
              ...row,
              'Test file': `[${row['Test file']}](https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${env.BRANCH}/${row['Test file']})`,
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
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main();
