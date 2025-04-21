import * as fs from 'fs/promises';
import humanizeDuration from 'humanize-duration';
import path from 'path';
import * as xml2js from 'xml2js';

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

interface TestRun {
  name: string;
  testSuites: TestSuite[];
}

interface TestSuite {
  name: string;
  job: {
    name: string;
    id: string;
  };
  path: string;
  date: Date;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testCases: TestCase[];
}

type TestCase =
  | {
      name: string;
      time: number;
      status: 'passed';
    }
  | {
      name: string;
      time: number;
      status: 'failed';
      error: string;
    };

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
          path: suite.$.file.slice(suite.$.file.indexOf(`test${path.sep}`)),
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
        const testRun: TestRun = {
          // regex to remove the shard number from the job name
          name: testSuite.job.name.replace(/\s+\(\d+\)$/, ''),
          testSuites: [testSuite],
        };
        const existingRun = testRuns.find((run) => run.name === testRun.name);
        if (existingRun) {
          existingRun.testSuites.push(testSuite);
        } else {
          testRuns.push(testRun);
        }
      }
    }

    for (const testRun of testRuns) {
      const deduped: { [path: string]: TestSuite } = {};
      for (const suite of testRun.testSuites) {
        const existing = deduped[suite.path];
        // If there is a duplicate, we keep the suite with the latest date
        if (!existing || existing.date < suite.date) {
          deduped[suite.path] = suite;
        }
      }

      const suites = Object.values(deduped);

      const title = `<strong>${testRun.name}</strong>`;
      console.log(consoleBold(title));

      if (suites.length) {
        const total = suites.reduce(
          (acc, suite) => ({
            tests: acc.tests + suite.tests,
            passed: acc.passed + suite.passed,
            failed: acc.failed + suite.failed,
            skipped: acc.skipped + suite.skipped,
          }),
          { tests: 0, passed: 0, failed: 0, skipped: 0 },
        );

        core.summary.addRaw(
          total.failed ? `\n<details open>\n` : `\n<details>\n`,
        );
        core.summary.addRaw(`\n<summary>${title}</summary>\n`);

        const times = suites.map((suite) => {
          const start = suite.date.getTime();
          const duration = suite.time;
          return { start, end: start + duration };
        });
        const earliestStart = Math.min(...times.map((t) => t.start));
        const latestEnd = Math.max(...times.map((t) => t.end));
        const executionTime = latestEnd - earliestStart;

        const conclusion = `<strong>${
          total.tests
        }</strong> tests were completed in <strong>${formatTime(
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
          for (const suite of suites) {
            if (!suite.failed) continue;
            console.error(suite.path);
            core.summary.addRaw(
              `\n#### [${suite.path}](https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${env.BRANCH}/${suite.path})\n`,
            );
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

        const rows = suites.map((suite) => ({
          'Test suite': suite.path,
          Passed: suite.passed ? `${suite.passed} ✅` : '',
          Failed: suite.failed ? `${suite.failed} ❌` : '',
          Skipped: suite.skipped ? `${suite.skipped} ⏩` : '',
          Time: formatTime(suite.time),
        }));

        const columns = Object.keys(rows[0]);
        const header = `| ${columns.join(' | ')} |`;
        const alignment = '| :--- | ---: | ---: | ---: | ---: |';
        const body = rows
          .map((row) => {
            const data = {
              ...row,
              'Test suite': `[${row['Test suite']}](https://github.com/${env.OWNER}/${env.REPOSITORY}/blob/${env.BRANCH}/${row['Test suite']})`,
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
