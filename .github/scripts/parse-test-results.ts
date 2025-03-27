import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as xml2js from 'xml2js';
import { Octokit } from '@octokit/rest';
import * as core from '@actions/core';
import { context } from '@actions/github';

interface GitHubContext {
  token: string;
  owner: string;
  repo: string;
  prNumber?: number;
  runId: number;
}

interface TestFailure {
  testName: string;
  message: string;
  build: string;
  job: string;
  jobWithMatrix: string;
  spec: string;
  runId: string;
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

// Function to extract failure information
function extractFailures(testsuites: any, filePath: string): TestFailure[] {
  const failures: TestFailure[] = [];
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
      if (testcase.failure) {
        const failureMessage = typeof testcase.failure === 'object'
          ? testcase.failure._ || testcase.failure.message
          : testcase.failure;

        failures.push({
          testName: `${testsuite.name}: ${testcase.$.name || 'Unnamed test'}`,
          message: testcase.failure.message || failureMessage || 'No failure message provided',
          build,
          job,
          jobWithMatrix,
          spec,
          runId
        });
      }
    }
  }

  return failures;
}

// Format the failures into a PR comment
function formatPrComment(failures: TestFailure[], githubContext: GitHubContext): string {
  if (failures.length === 0) {
    return '✅ All tests passed!';
  }

  let comment = `# ❌ E2E Test Failures\n\n`;
  comment += `Found ${failures.length} test failure${failures.length > 1 ? 's' : ''}:\n\n`;

  failures.forEach((failure) => {
    const jobUrl = getJobUrl(
      githubContext.owner,
      githubContext.repo,
      failure.job,
      failure.runId,
      process.env.MATRIX_INDEX
    );

    comment += `**Build**: ${failure.build}\n`;
    comment += `**Job**: [${failure.jobWithMatrix}](${jobUrl})\n`;
    comment += `**Spec**: \`${failure.spec}\`\n\n`;
    comment += "```\n";
    comment += failure.message;
    comment += "\n```\n\n";
    comment += "---\n\n";
  });

  return comment;
}

// Post a comment to the PR
async function postPrComment(comment: string, githubContext: GitHubContext): Promise<void> {
  try {
    const octokit = new Octokit({ auth: githubContext.token });

    await octokit.rest.issues.createComment({
      owner: githubContext.owner,
      repo: githubContext.repo,
      issue_number: githubContext.prNumber,
      body: comment
    });

    core.info(`Successfully posted comment to PR #${githubContext.prNumber}`);
  } catch (error) {
    core.setFailed(`Failed to post comment to PR: ${error}`);
    throw error;
  }
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
async function processXmlFile(file: string): Promise<TestFailure[]> {
  const fullPath = path.resolve(__dirname, file);

  try {
    const parsedXml = await parseXmlFile(fullPath);

    if (!parsedXml.testsuites) {
      core.warning(`Warning: ${file} does not contain testsuites element`);
      return [];
    }

    const failureCount = parseInt(parsedXml.testsuites.$.failures, 10) || 0;

    if (failureCount > 0) {
      return extractFailures(parsedXml.testsuites, fullPath);
    }

    return [];
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
    const failuresArrays = await Promise.all(
      xmlFiles.map(file => processXmlFile(file))
    );

    // Flatten the array of arrays
    const allFailures = failuresArrays.flat();

    if (allFailures.length === 0) {
      core.info('✅ All tests passed! No comment needed.');
    } else {
      core.info(`❌ Found ${allFailures.length} test failures. Posting comment to PR #${githubContext.prNumber}`);
      const comment = formatPrComment(allFailures, githubContext);
      await postPrComment(comment, githubContext);
    }

    core.info('Test results parser completed successfully');
  } catch (error) {
    core.setFailed(`Error processing test results: ${error}`);
  }
}

main().catch(error => {
  core.setFailed(`Unhandled error: ${error}`);
});
