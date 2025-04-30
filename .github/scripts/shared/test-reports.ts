export interface TestRun {
  name: string;
  testFiles: TestFile[];
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
    runId: string;
  };
  date: Date;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  attempts: TestSuite[];
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
