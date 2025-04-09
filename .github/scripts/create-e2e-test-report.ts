import * as fs from 'fs/promises';
import humanizeDuration from 'humanize-duration';
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

function formatTime(seconds: number): string {
  const miliseconds = seconds * 1000;
  if (miliseconds < 1000) {
    return `${Math.round(miliseconds)}ms`;
  }
  return humanizer(miliseconds);
}

interface TestSuite {
  name: string;
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
  const { OWNER, REPOSITORY, BRANCH } = process.env;
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
    const filenames = await fs.readdir('./test/test-results/e2e');
    const testSuites: TestSuite[] = [];

    for (const filename of filenames) {
      const file = await fs.readFile(
        `./test/test-results/e2e/${filename}`,
        'utf8',
      );
      const results = await XML.parse(file);
      for (const suite of results.testsuites.testsuite || []) {
        if (!suite.testcase) continue;
        const name = `${suite.$.name}`;
        const fullPath = `${suite.$.file}`;
        const path = fullPath.slice(fullPath.indexOf('test/'));
        const date = new Date(suite.$.timestamp);
        const tests = +suite.$.tests;
        const time = +suite.$.time;
        const failed = +suite.$.failures;
        const skipped = tests - suite.testcase.length;
        const passed = tests - failed - skipped;
        const testSuite: TestSuite = {
          name,
          path,
          date,
          tests,
          passed,
          failed,
          skipped,
          time,
          testCases: [],
        };
        for (const testcase of suite.testcase) {
          const testCase: TestSuite['testCases'][number] = {
            name: testcase.$.name,
            time: +testcase.$.time,
            status: testcase.failure ? 'failed' : 'passed',
            error: testcase.failure ? testcase.failure[0]._ : undefined,
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
          time: acc.time + suite.time,
        }),
        { tests: 0, passed: 0, failed: 0, skipped: 0, time: 0 },
      );

      const conclusion = `**${
        total.tests
      }** tests were completed in **${formatTime(total.time)}** with **${
        total.passed
      }** passed, **${total.failed}** failed and **${total.skipped}** skipped.`;

      // replace markdown bold with ANSI escape codes
      console.log(conclusion.replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m'));

      core.summary.addRaw(`${conclusion}\n`);

      const rows = suites.map((suite) => ({
        'Test suite': process.env.GITHUB_ACTIONS
          ? `[${suite.name}](https://github.com/${OWNER}/${REPOSITORY}/blob/${BRANCH}/${suite.path})`
          : `[${suite.name}](${suite.path})`,
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
        `| ${columns.join(' | ')} |
| :--- | ---: | ---: | ---: | ---: |
${markdownTable}
`,
      );
    } else {
      core.summary.addRaw('No tests found');
    }

    await core.summary.write();
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main();
