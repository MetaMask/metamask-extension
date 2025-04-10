import * as fs from 'fs/promises';
import humanizeDuration from 'humanize-duration';
import * as xml2js from 'xml2js';
import path from 'path';

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

interface TestSuite {
  name: string;
  job: {
    name: string | null;
    id: string | null;
  };
  path: string;
  date: Date;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testCases: (
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
      }
  )[];
}

async function main() {
  const {
    OWNER = 'metamask',
    REPOSITORY = 'metamask-extension',
    BRANCH = 'main',
    TEST_RESULTS_PATH = 'test/test-results/e2e',
    RUN_ID,
    PR_NUMBER,
  } = process.env;
  let summary = '';
  const core = process.env.GITHUB_ACTIONS
    ? await import('@actions/core')
    : {
        summary: {
          addRaw: (text: string) => {
            summary += text;
          },
          write: async () =>
            await fs.writeFile('test/test-results/summary.md', summary),
        },
        setFailed: (msg: string) => console.error(msg),
      };

  try {
    const filenames = await fs.readdir(TEST_RESULTS_PATH);
    const testSuites: TestSuite[] = [];

    for (const filename of filenames) {
      const file = await fs.readFile(
        path.join(TEST_RESULTS_PATH, filename),
        'utf8',
      );
      const results = await XML.parse(file);
      for (const suite of results.testsuites.testsuite || []) {
        if (!suite.testcase) continue;
        const name = `${suite.$.name}`;
        const fullPath = `${suite.$.file}`;
        const testPath = fullPath.slice(fullPath.indexOf(`test${path.sep}`));
        const date = new Date(suite.$.timestamp);
        const tests = +suite.$.tests;
        const time = +suite.$.time * 1000; // convert to ms
        const failed = +suite.$.failures;
        const skipped = tests - suite.testcase.length;
        const passed = tests - failed - skipped;
        const testSuite: TestSuite = {
          name,
          path: testPath,
          job: {
            name: suite.properties?.[0].property?.[0]?.$.value || null,
            id: suite.properties?.[0].property?.[1]?.$.value || null,
          },
          date,
          tests,
          passed,
          failed,
          skipped,
          time,
          testCases: [],
        };
        for (const test of suite.testcase) {
          const testCase: TestSuite['testCases'][number] = {
            name: test.$.name,
            time: +test.$.time * 1000, // convert to ms
            status: test.failure ? 'failed' : 'passed',
            error: test.failure ? test.failure[0]._ : undefined,
          };
          testSuite.testCases.push(testCase);
        }
        testSuites.push(testSuite);
      }
    }

    const deduped: { [path: string]: TestSuite } = {};
    for (const suite of testSuites) {
      const existing = deduped[suite.path];
      // If there is a duplicate, we keep the suite with the latest date
      if (!existing || existing.date < suite.date) {
        deduped[suite.path] = suite;
      }
    }

    const suites = Object.values(deduped);

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

      // replace html bold with ANSI escape codes
      console.log(
        conclusion
          .replaceAll('<strong>', '\x1b[1m')
          .replaceAll('</strong>', '\x1b[0m'),
      );

      core.summary.addRaw(`\n<details>\n`);
      core.summary.addRaw(`<summary>${conclusion}</summary>\n`);

      const rows = suites.map((suite) => ({
        'Test suite': process.env.GITHUB_ACTIONS
          ? `[${suite.path}](https://github.com/${OWNER}/${REPOSITORY}/blob/${BRANCH}/${suite.path})`
          : suite.path,
        Passed: suite.passed ? `${suite.passed} ✅` : '',
        Failed: suite.failed ? `${suite.failed} ❌` : '',
        Skipped: suite.skipped ? `${suite.skipped} ⏩` : '',
        Time: formatTime(suite.time),
      }));

      const columns = Object.keys(rows[0]);

      const markdownTable = rows
        .map((row) => `| ${Object.values(row).join(' | ')} |`)
        .join('\n');

      console.table(rows);

      core.summary.addRaw(
        `\n| ${columns.join(' | ')} |
| :--- | ---: | ---: | ---: | ---: |
${markdownTable}\n
`,
      );

      core.summary.addRaw(`</details>\n`);

      if (total.failed > 0) {
        core.summary.addRaw(`\n## ❌ Failed tests\n`);
        console.error(`❌ Failed tests`);
        for (const suite of suites) {
          if (suite.failed === 0) continue;
          core.summary.addRaw(`\n<details open>\n`);
          core.summary.addRaw(
            `<summary><strong>${suite.path}</strong></summary>\n`,
          );
          if (suite.job.name && suite.job.id && RUN_ID) {
            core.summary.addRaw(
              `\n##### Job: [${
                suite.job.name
              }](https://github.com/${OWNER}/${REPOSITORY}/actions/runs/${RUN_ID}/job/${
                suite.job.id
              }${PR_NUMBER ? `?pr=${PR_NUMBER}` : ''})\n`,
            );
          }
          console.error(suite.name);
          for (const test of suite.testCases) {
            if (test.status !== 'failed') continue;
            core.summary.addRaw(`\n##### ${test.name}\n`);
            console.error(`- ${test.name}`);
            core.summary.addRaw(`\n\`\`\`js\n${test.error}\n\`\`\`\n`);
            console.error(`  ${test.error}\n`);
          }
          core.summary.addRaw(`</details>\n`);
        }
      }
    } else {
      core.summary.addRaw('No tests found');
    }

    await core.summary.write();
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main();
