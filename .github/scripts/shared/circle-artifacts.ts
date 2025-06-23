import fs from 'fs';

// Set OWNER and REPOSITORY based on the environment
const OWNER =
  process.env.CIRCLE_PROJECT_USERNAME || process.env.OWNER || 'MetaMask';
const REPOSITORY =
  process.env.CIRCLE_PROJECT_REPONAME ||
  process.env.REPOSITORY ||
  'metamask-extension';
const CIRCLE_BASE_URL = 'https://circleci.com/api/v2';

/**
 * Retrieves the pipeline ID for a given branch and optional commit hash.
 *
 * @param {string} branch - The branch name to fetch the pipeline for.
 * @param {string} [headCommitHash] - Optional commit hash to match a specific pipeline.
 * @returns {Promise<string>} A promise that resolves to the pipeline ID.
 * @throws Will throw an error if no pipeline is found or if the HTTP request fails.
 */
export async function getPipelineId(branch: string, headCommitHash?: string): Promise<string> {
    const url = `${CIRCLE_BASE_URL}/project/gh/${OWNER}/${REPOSITORY}/pipeline?branch=${branch}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch pipeline data: ${response.statusText}`);
    }

    const pipelineData = await response.json();
    const pipelineItem = headCommitHash
        ? pipelineData.items.find((item: any) => item.vcs.revision === headCommitHash)
        : pipelineData.items[0];
    if (!pipelineItem) {
        throw new Error('Pipeline ID not found');
    }
    console.log('pipelineId:', pipelineItem.id);

    return pipelineItem.id;
}

/**
 * Retrieves the workflow ID for a given pipeline ID.
 *
 * @param {string} pipelineId - The ID of the pipeline to fetch the workflow for.
 * @returns {Promise<string>} A promise that resolves to the workflow ID.
 * @throws Will throw an error if no workflow is found or if the HTTP request fails.
 */
export async function getWorkflowId(pipelineId: string): Promise<string> {
    const url = `${CIRCLE_BASE_URL}/pipeline/${pipelineId}/workflow`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch workflow data: ${response.statusText}`);
    }
    const workflowData = await response.json();
    const workflowId = workflowData.items[0]?.id;
    if (!workflowId) {
        throw new Error('Workflow ID not found');
    }
    console.log('workflowId:', workflowId);
    return workflowId;
}

/**
 * Retrieves a list of jobs for a given workflow ID.
 *
 * @param {string} workflowId - The ID of the workflow to fetch jobs for.
 * @returns {Promise<any[]>} A promise that resolves to an array of jobs.
 * @throws Will throw an error if no jobs are found or if the HTTP request fails.
 */
export async function getJobsByWorkflowId(workflowId: string): Promise<any[]> {
    const url = `${CIRCLE_BASE_URL}/workflow/${workflowId}/job`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }
    const jobs = (await response.json()).items;
    return jobs;
}

/**
 * Retrieves job details for a given workflow ID and optional job name.
 *
 * @param {string} workflowId - The ID of the workflow to fetch job details for.
 * @param {string} [jobName] - Optional job name to match a specific job.
 * @returns {Promise<any>} A promise that resolves to the job details.
 * @throws Will throw an error if no job details are found or if the HTTP request fails.
 */
export async function getJobDetails(workflowId: string, jobName?: string): Promise<any> {
    const jobs = await getJobsByWorkflowId(workflowId);
    const jobDetails = jobName
        ? jobs.find((item: any) => item.name === jobName)
        : jobs[0];
    if (!jobDetails) {
        throw new Error('Job details not found');
    }
    return jobDetails;
}

/**
 * Retrieves the artifact URL for a given branch, commit hash, job name, and artifact name.
 * @param {string} branch - The branch name.
 * @param {string} headCommitHash - The commit hash of the branch.
 * @param {string} jobName - The name of the job that produced the artifact.
 * @param {string} artifactName - The name of the artifact to retrieve.
 * @returns {Promise<string>} A promise that resolves to the artifact URL.
 * @throws Will throw an error if the artifact is not found or if any HTTP request fails.
 */
export async function getArtifactUrl(branch: string, headCommitHash: string, jobName: string, artifactName: string): Promise<string> {
    const pipelineId = await getPipelineId(branch, headCommitHash);
    const workflowId = await getWorkflowId(pipelineId);
    const jobDetails = await getJobDetails(workflowId, jobName);

    const jobNumber = jobDetails.job_number;
    console.log('Job number', jobNumber);

    const artifactResponse = await fetch(`${CIRCLE_BASE_URL}/project/gh/${OWNER}/${REPOSITORY}/${jobNumber}/artifacts`);
    const artifactData = await artifactResponse.json();
    const artifact = artifactData.items.find((item: any) => item.path.includes(artifactName));

    if (!artifact) {
        throw new Error(`Artifact ${artifactName} not found`);
    }

    const artifactUrl = artifact.url;
    console.log('Artifact URL:', artifactUrl);;

    return artifactUrl;
}

/**
 * Downloads an artifact from a given URL and saves it to the specified output path.
 * @param {string} artifactUrl - The URL of the artifact to download.
 * @param {string} outputFilePath - The path where the artifact should be saved.
 * @returns {Promise<void>} A promise that resolves when the download is complete.
 * @throws Will throw an error if the download fails or if the file cannot be written.
 */
export async function downloadArtifact(artifactUrl: string, outputFilePath: string): Promise<void> {
    try {
        // Ensure the directory exists
        const dir = require('path').dirname(outputFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log(`Downloading artifact from URL: ${artifactUrl} to ${outputFilePath}`);

        // Download the artifact
        const artifactDownloadResponse = await fetch(artifactUrl);
        if (!artifactDownloadResponse.ok) {
            throw new Error(`Failed to download artifact: ${artifactDownloadResponse.statusText}`);
        }
        const artifactArrayBuffer = await artifactDownloadResponse.arrayBuffer();
        const artifactBuffer = Buffer.from(artifactArrayBuffer);
        fs.writeFileSync(outputFilePath, artifactBuffer);

        if (!fs.existsSync(outputFilePath)) {
            throw new Error(`Failed to download artifact to ${outputFilePath}`);
        }

        console.log(`Artifact downloaded successfully to ${outputFilePath}`);
    } catch (error) {
        console.error(`Error during artifact download: ${error.message}`);
        throw error;
    }
}

/**
 * Reads the content of a file.
 * @param filePath - The path to the file.
 * @returns The content of the file.
 */
export function readFileContent(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8').trim();
    return content;
}

/**
 * Sleep function to pause execution for a specified number of seconds.
 * @param seconds - The number of seconds to sleep.
 */
export function sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}