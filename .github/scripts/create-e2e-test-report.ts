import * as fs from 'fs/promises';
import humanizeDuration from 'humanize-duration';
import path from 'path';
import * as xml2js from 'xml2js';
import { TestCase, TestRun, TestSuite } from './shared/test-reports';
import { normalizeTestPath } from './shared/utils';

const XML = {
  parse: new xml2js.Parser().parseStringPromise,
};

const humanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
  delimiter: ' ',
  spacer: '',
  round: true,
});

function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return humanizer(ms);
}

/**
 * Replaces HTML `<strong>` tags with ANSI escape codes to format
 * text as bold in the console output.
 */
function consoleBold(str: string): string {
  return str
    .replaceAll('<strong>', '\x1b[1m')
    .replaceAll('</strong>', '\x1b[0m');
}

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
    const testRuns: Record<string, TestRun> = {};
    const filenames = await fs.readdir(env.TEST_RESULTS_PATH);

    for (const filename of filenames) {
      const file = await fs.readFile(
        path.join(env.TEST_RESULTS_PATH, filename),
        'utf8',
      );
      const results = await XML.parse(file);

      for (const suite of results.testsuites.testsuite || []) {
        if (!suite.testcase || !suite.$.file) continue;
        const path = normalizeTestPath(suite.$.file);
        const tests = +suite.$.tests;
        const failed = +suite.$.failures;
        const skipped = tests - suite.testcase.length;
        const passed = tests - failed - skipped;

        const testSuite: TestSuite = {
          name: suite.$.name,
          job: {
            name: suite.properties?.[0].property?.[0]?.$.value ?? '',
            id: suite.properties?.[0].property?.[1]?.$.value ?? '',
          },
          date: new Date(suite.$.timestamp),
          tests,
          passed,
          failed,
          skipped,
          time: +suite.$.time * 1000, // convert to ms,
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

        // regex to remove the shard number from the job name
        const testRunName = testSuite.job.name.replace(/\s+\(\d+\)$/, '');

        if (!testRuns[testRunName]) {
          testRuns[testRunName] = new TestRun();
        }

        // Add with allowDuplicates = true to keep all test suites
        testRuns[testRunName].addTestSuite(testSuite, path, true);
      }
    }

    const deduped: Record<string, TestRun> = {};

    for (const testRunName in testRuns) {
      const testRun = testRuns[testRunName];
      deduped[testRunName] = new TestRun();
      const dedupedRun = deduped[testRunName];

      for (const path in testRun.testFiles) {
        const testFile = testRun.testFiles[path];

        // Sort test suites with newest first
        testFile.testSuites.sort((a, b) => b.date.getTime() - a.date.getTime());

        for (const suite of testFile.testSuites) {
          // Add with allowDuplicates = false to keep only the latest test suite
          dedupedRun.addTestSuite(suite, path, false);
        }
      }

      const dedupedTestFiles = Object.values(dedupedRun.testFiles).sort(
        (a, b) => a.path.localeCompare(b.path),
      );

      const title = `<strong>${testRunName}</strong>`;

      if (dedupedTestFiles.length) {
        const total = dedupedTestFiles.reduce(
          (acc, file) => ({
            tests: acc.tests + file.totalTests,
            passed: acc.passed + file.totalPassed,
            failed: acc.failed + file.totalFailed,
            skipped: acc.skipped + file.totalSkipped,
          }),
          { tests: 0, passed: 0, failed: 0, skipped: 0 },
        );

        if (total.failed > 0) {
          console.log(consoleBold(title) + ' ❌');
          core.summary.addRaw(`\n<details open>\n`);
          core.summary.addRaw(`\n<summary>${title} ❌</summary>\n`);
        } else {
          console.log(consoleBold(title) + ' ✔️');
          core.summary.addRaw(`\n<details>\n`);
          core.summary.addRaw(`\n<summary>${title} ✔️</summary>\n`);
        }

        let earliestStart = Infinity;
        let latestEnd = 0;

        for (const file of dedupedTestFiles) {
          for (const suite of file.testSuites) {
            const start = suite.date.getTime();
            const end = start + suite.time;
            if (start < earliestStart) {
              earliestStart = start;
            }
            if (end > latestEnd) {
              latestEnd = end;
            }
          }
        }

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
          for (const file of dedupedTestFiles) {
            if (file.totalFailed === 0) continue;
            console.error(file.path);
            core.summary.addRaw(
              `\n#### [${file.path}](https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${env.BRANCH}/${file.path})\n`,
            );
            for (const suite of file.testSuites) {
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

        const rows = dedupedTestFiles.map((file) => ({
          'Test file': file.path,
          Passed: file.totalPassed ? `${file.totalPassed} ✔️` : '',
          Failed: file.totalFailed ? `${file.totalFailed} ❌` : '',
          Skipped: file.totalSkipped ? `${file.totalSkipped} ⏩` : '',
          Time: formatTime(file.totalTime),
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
    await fs.writeFile(
      env.TEST_RUNS_PATH.replace('.json', '-deduped.json'),
      JSON.stringify(deduped, null, 2),
    );
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main();
