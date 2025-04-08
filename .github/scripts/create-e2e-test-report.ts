import * as core from '@actions/core';
import * as fs from 'fs/promises';
import * as xml2js from 'xml2js';

const XML = {
  parse: new xml2js.Parser().parseStringPromise,
};

function formatTime(ms: number): string {
  if (ms > 1000) {
    return `${Math.round(ms / 1000)}s`;
  }
  return `${Math.round(ms)}ms`;
}

interface TestSuite {
  name: string;
  path: string;
  date: Date;
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

    console.table(
      suites.map((testSuite) => ({
        name: testSuite.name,
        path: testSuite.path,
        passed: testSuite.passed,
        failed: testSuite.failed,
        skipped: testSuite.skipped,
        time: formatTime(testSuite.time),
      })),
    );

    if (process.env.GITHUB_ACTIONS) {
      await core.summary.clear();

      core.summary.addTable([
        [
          { data: 'Test suite', header: true },
          { data: 'Passed', header: true },
          { data: 'Failed', header: true },
          { data: 'Skipped', header: true },
          { data: 'Time', header: true },
        ],
        ...suites.map((testSuite) => [
          testSuite.name,
          testSuite.passed.toString(),
          testSuite.failed.toString(),
          testSuite.skipped.toString(),
          formatTime(testSuite.time),
        ]),
      ]);

      await core.summary.write();
    }
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main().catch((error) => {
  core.setFailed(`Unhandled error: ${error}`);
});
