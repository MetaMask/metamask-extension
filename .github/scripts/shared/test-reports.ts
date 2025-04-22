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
        testFile.totalTime += testSuite.time;
        testFile.totalTests += testSuite.tests;
        testFile.totalPassed += testSuite.passed;
        testFile.totalFailed += testSuite.failed;
        testFile.totalSkipped += testSuite.skipped;
      } else {
        console.warn(
          `Test suite ${testSuite.name} already exists in ${path}. Skipping duplicate.`,
        );
      }
    } else {
      this.testFiles[path] = {
        path,
        totalTime: testSuite.time,
        totalTests: testSuite.tests,
        totalPassed: testSuite.passed,
        totalFailed: testSuite.failed,
        totalSkipped: testSuite.skipped,
        testSuites: [testSuite],
      };
    }
  }
}

export interface TestFile {
  path: string;
  totalTime: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
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
