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
      for (const testsuite of results.testsuites.testsuite) {
        if (!testsuite.testcase) continue;
        const name = `${testsuite.$.name}`;
        const tests = +testsuite.$.tests;
        const time = +testsuite.$.time;
        const failed = +testsuite.$.failures;
        const skipped = tests - testsuite.testcase.length;
        const passed = tests - failed - skipped;
        const testSuite: TestSuite = {
          name,
          passed,
          failed,
          skipped,
          time,
          testCases: [],
        };
        for (const testcase of testsuite.testcase) {
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

    await core.summary.clear();

    core.summary.addTable([
      [
        { data: 'Test suite', header: true },
        { data: 'Passed', header: true },
        { data: 'Failed', header: true },
        { data: 'Skipped', header: true },
        { data: 'Time', header: true },
      ],
      ...testSuites.map((testSuite) => [
        testSuite.name,
        testSuite.passed.toString(),
        testSuite.failed.toString(),
        testSuite.skipped.toString(),
        formatTime(testSuite.time),
      ]),
    ]);

    await core.summary.write();
  } catch (error) {
    core.setFailed(`Error creating the test report: ${error}`);
  }
}

main().catch((error) => {
  core.setFailed(`Unhandled error: ${error}`);
});
