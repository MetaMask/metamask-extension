export class TestRun {
  testFiles: Record<string, TestFile> = {};

  addTestSuite(testSuite: TestSuite, path: string, allowDuplicates: boolean) {
    const testFile = this.testFiles[path];

    if (testFile) {
      const existingSuite = testFile.testSuites.find(
        (suite) => suite.name === testSuite.name,
      );

      if (!existingSuite || allowDuplicates) {
        testFile.testSuites.push(testSuite);
        testFile.time += testSuite.time;
        testFile.tests += testSuite.tests;
        testFile.passed += testSuite.passed;
        testFile.failed += testSuite.failed;
        testFile.skipped += testSuite.skipped;
      } else {
        console.warn(
          `Test suite ${testSuite.name} already exists in ${path}. Skipping duplicate.`,
        );
      }
    } else {
      this.testFiles[path] = {
        path,
        time: testSuite.time,
        tests: testSuite.tests,
        passed: testSuite.passed,
        failed: testSuite.failed,
        skipped: testSuite.skipped,
        testSuites: [testSuite],
      };
    }
  }
}

export interface TestFile {
  path: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testSuites: TestSuite[];
}

export interface TestSuite {
  name: string;
  job: {
    name: string;
    id: string;
  };
  date: Date;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testCases: TestCase[];
}

export type TestCase =
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
