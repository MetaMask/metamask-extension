import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as xml2js from 'xml2js';
import * as core from '@actions/core';
import { context } from '@actions/github';

interface GitHubContext {
  token: string;
  owner: string;
  repo: string;
  prNumber?: number;
  runId: number;
}

interface TestResult {
  testName: string;
  status: 'pass' | 'fail';
  message?: string;
  build: string;
  job: string;
  jobWithMatrix: string;
  spec: string;
  runId: string;
  duration?: string;
}

// Get GitHub context from environment variables
async function getGitHubContext(): Promise<GitHubContext> {
  const token = process.env.GITHUB_TOKEN;
  const runId = process.env.GITHUB_RUN_ID ? parseInt(process.env.GITHUB_RUN_ID, 10) : 0;

  if (!token) {
    core.setFailed('Required GitHub token missing. Please set GITHUB_TOKEN');
    throw new Error('GitHub token missing');
  }

  // Get repo info from Actions
  const owner = context.repo.owner
  const repo = context.repo.repo
  const prNumber = context.payload.pull_request?.number;

  return {
    token,
    owner,
    repo,
    prNumber,
    runId
  };
}

// Get GitHub Actions environment variables
function getGitHubActionInfo() {
  // Use GitHub context when possible
  const buildName = context.workflow;
  const jobName = context.job;
  const runId = context.runId?.toString();
  const matrixIndex = process.env.MATRIX_INDEX ? ` (${process.env.MATRIX_INDEX})` : '';
  const e2e_results_path = process.env.E2E_TEST_RESULTS_PATH || './test/test-results/e2e/**/*.xml';

  if (!buildName || !jobName) {
    core.setFailed('Required GitHub Actions environment variables missing');
    throw new Error('Missing workflow or job name');
  }

  return {
    build: buildName,
    job: jobName,
    jobWithMatrix: jobName + matrixIndex,
    runId,
    e2e_results_path
  };
}

// Generate job URL for GitHub Actions
function getJobUrl(owner: string, repo: string, jobName: string, runId: string, matrixIndex?: string) {
  // Base URL for GitHub Actions run
  let url = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

  // If we have a matrix index, we can make the link more specific
  if (matrixIndex) {
    url += `#${jobName}-${matrixIndex}`;
  }

  return url;
}

// Function to parse XML file
async function parseXmlFile(filePath: string) {
  try {
    const xmlContent = await fs.readFile(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    return parser.parseStringPromise(xmlContent);
  } catch (error) {
    core.setFailed(`Error parsing XML file ${filePath}: ${error}`);
    throw error;
  }
}

// Function to extract path starting from /test/
function extractPathFromTest(fullPath: string): string {
  const testIndex = fullPath.indexOf('/test/');
  if (testIndex !== -1) {
    return fullPath.substring(testIndex);
  }
  return fullPath;
}

// Function to extract test results (both passing and failing)
function extractTestResults(testsuites: any, filePath: string): TestResult[] {
  const results: TestResult[] = [];
  const { build, job, jobWithMatrix, runId } = getGitHubActionInfo();

  // Handle single testsuite or array of testsuites
  const testSuites = Array.isArray(testsuites.testsuite)
    ? testsuites.testsuite
    : [testsuites.testsuite];

  for (const testsuite of testSuites) {
    if (!testsuite.testcase) continue;

    // Try to extract spec from file attribute if available
    let spec;

    if (testsuite.$ && testsuite.$.file) {
      // Extract full path from testsuite.$.file starting from /test/
      spec = extractPathFromTest(testsuite.$.file);
    } else {
      // Extract full path from filePath starting from /test/
      spec = extractPathFromTest(filePath);
    }

    // Handle single testcase or array of testcases
    const testCases = Array.isArray(testsuite.testcase)
      ? testsuite.testcase
      : [testsuite.testcase];

    for (const testcase of testCases) {
      // Get test duration if available
      const duration = testcase.$.time ? `${testcase.$.time}s` : undefined;

      if (testcase.failure) {
        const failureMessage = typeof testcase.failure === 'object'
          ? testcase.failure._ || testcase.failure.message
          : testcase.failure;

        results.push({
          testName: `${testsuite.name}: ${testcase.$.name || 'Unnamed test'}`,
          status: 'fail',
          message: testcase.failure.message || failureMessage || 'No failure message provided',
          build,
          job,
          jobWithMatrix,
          spec,
          runId,
          duration
        });
      } else {
        // This is a passing test
        results.push({
          testName: `${testsuite.name}: ${testcase.$.name || 'Unnamed test'}`,
          status: 'pass',
          build,
          job,
          jobWithMatrix,
          spec,
          runId,
          duration
        });
      }
    }
  }

  return results;
}

// Create a summary of test results using GitHub Actions Summary API
async function createTestSummary(
  passedTests: TestResult[],
  failedTests: TestResult[],
  githubContext: GitHubContext
): Promise<void> {

  await core.summary.clear();

  const totalTests = passedTests.length + failedTests.length;
  const passRate = Math.round((passedTests.length / totalTests) * 100);

  // Start with a heading and summary statistics
  core.summary
    .addHeading('E2E Test Results')
    .addRaw(`**Total Tests:** ${totalTests} | **Passed:** ${passedTests.length} | **Failed:** ${failedTests.length} | **Pass Rate:** ${passRate}%`)
    .addSeparator();

  // If there are failed tests, show them first
  if (failedTests.length > 0) {
    core.summary
      .addHeading('❌ Failed Tests', 2)
      .addRaw(`${failedTests.length} test${failedTests.length !== 1 ? 's' : ''} failed`)
      .addSeparator();

    // Create a table for failed tests
    const failedRows = failedTests.map(test => {
      const jobUrl = getJobUrl(
        githubContext.owner,
        githubContext.repo,
        test.job,
        test.runId,
        process.env.MATRIX_INDEX
      );
      const jobLink = `[${test.jobWithMatrix}](${jobUrl})`;

      return [
        test.testName,
        test.spec,
        jobLink,
        test.duration || '-',
        ':x:'
      ];
    });

    core.summary.addTable([
      [{ data: 'Test Name', header: true }, { data: 'Spec File', header: true }, { data: 'Job', header: true }, { data: 'Duration', header: true }, { data: 'Status', header: true }],
      ...failedRows
    ]);

    // For each failed test, add details with the error message
    failedTests.forEach((test, index) => {
      core.summary
        .addDetails(`Error details for: ${test.testName}`, `\`\`\`\n${test.message}\n\`\`\``)
        .addSeparator();
    });
  }

  // Show passing tests
  if (passedTests.length > 0) {
    core.summary
      .addHeading('✅ Passing Tests', 2)
      .addRaw(`${passedTests.length} test${passedTests.length !== 1 ? 's' : ''} passed`)
      .addSeparator();

    // Create a table for passing tests
    const passedRows = passedTests.map(test => [
      test.testName,
      test.spec,
      test.duration || '-',
      ':white_check_mark:'
    ]);

    core.summary.addTable([
      [{ data: 'Test Name', header: true }, { data: 'Spec File', header: true }, { data: 'Duration', header: true }, { data: 'Status', header: true }],
      ...passedRows
    ]);
  }

  // Write the summary to the GitHub Actions UI
  await core.summary.write();
}

async function findXmlFiles(): Promise<string[]> {
  try {
    const { e2e_results_path } = getGitHubActionInfo();
    return await glob(e2e_results_path);
  } catch (error) {
    core.warning(`Error finding XML files: ${error}`);
    return [];
  }
}

// Process a single XML file
async function processXmlFile(file: string): Promise<TestResult[]> {
  const fullPath = path.resolve(process.cwd(), file);

  try {
    const parsedXml = await parseXmlFile(fullPath);

    if (!parsedXml.testsuites) {
      core.warning(`Warning: ${file} does not contain testsuites element`);
      return [];
    }

    return extractTestResults(parsedXml.testsuites, fullPath);
  } catch (error) {
    core.warning(`Error processing file ${file}: ${error}`);
    return [];
  }
}

async function main() {
  try {
    core.info('Starting test results parser for GitHub Actions');

    // Validate GitHub environment
    const githubContext = await getGitHubContext();
    const { build, jobWithMatrix } = getGitHubActionInfo();

    core.info(`Running for PR #${githubContext.prNumber}`);
    core.info(`Build: ${build}`);
    core.info(`Job: ${jobWithMatrix}`);

    // Find all XML files in the specified directory
    const xmlFiles = await findXmlFiles();
    core.info(`Found ${xmlFiles.length} test result files`);

    // Process all XML files concurrently
    const resultsArrays = await Promise.all(
      xmlFiles.map(file => processXmlFile(file))
    );

    // Flatten the array of arrays
    const allResults = resultsArrays.flat();

    // Separate passing and failing tests
    const passedTests = allResults.filter(test => test.status === 'pass');
    const failedTests = allResults.filter(test => test.status === 'fail');

    core.info(`Test results: ${passedTests.length} passed, ${failedTests.length} failed`);

    // Create and write the summary
    await createTestSummary(passedTests, failedTests, githubContext);

    if (failedTests.length === 0) {
      core.info('✅ All tests passed!');
    } else {
      core.info(`❌ Found ${failedTests.length} test failures.`);
      // Set an output variable that can be used by other steps
      core.setOutput('test_failures', failedTests.length);
    }

    core.info('Test results parser completed successfully');
  } catch (error) {
    core.setFailed(`Error processing test results: ${error}`);
  }
}

main().catch(error => {
  core.setFailed(`Unhandled error: ${error}`);
});
