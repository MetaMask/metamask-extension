import { execSync } from 'child_process';
import fs from 'fs';

const owner = process.env.OWNER;
const repository = process.env.REPOSITORY;

/**
 * Downloads an artifact from CircleCI.
 * @param branch - The branch name.
 * @param headCommitHash - The commit hash of the branch.
 * @param artifactName - The name of the artifact to download.
 * @param outputFilePath - The path to save the downloaded artifact.
 * @param jobName - The name of the job that produced the artifact.
 */
export async function downloadCircleCiArtifact(branch: string, headCommitHash: string, artifactName: string, outputFilePath: string, jobName: string): Promise<void> {
    console.log('Branch', branch);
    console.log('Commit', headCommitHash);
    console.log('Owner', owner);
    console.log('Repository', repository);
    console.log('url', `https://circleci.com/api/v2/project/gh/${owner}/${repository}/pipeline?branch=${branch}`);

    // Get the pipeline ID for the current branch
    const pipelineResponse = await fetch(
        `https://circleci.com/api/v2/project/gh/${owner}/${repository}/pipeline?branch=${branch}`
    );

    if (!pipelineResponse.ok) {
        throw new Error(`Failed to fetch pipeline: ${pipelineResponse.statusText}`);
    }

    const pipelineData = await pipelineResponse.json();
    console.log('Pipeline data:', JSON.stringify(pipelineData, null, 2));

    if (!pipelineData.items || pipelineData.items.length === 0) {
        throw new Error('No pipeline items found');
    }

    const pipelineId = pipelineData.items.find((item: any) => item.vcs.revision === headCommitHash)?.id;
    console.log('Pipeline ID', pipelineId);

    if (!pipelineId) {
        throw new Error('Pipeline ID not found');
    }

    // Get the workflow ID for the pipeline
    const workflowResponse = await fetch(`https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`);
    const workflowData = await workflowResponse.json();
    const workflowId = workflowData.items[0]?.id;
    console.log('Workflow ID', workflowId);

    if (!workflowId) {
        throw new Error('Workflow ID not found');
    }

    // Get the job details for the specific job that produces artifacts
    const jobResponse = await fetch(`https://circleci.com/api/v2/workflow/${workflowId}/job`);
    const jobData = await jobResponse.json();
    const jobDetails = jobData.items.find((item: any) => item.name === jobName);
    console.log('Job Details', jobDetails);

    if (!jobDetails) {
        throw new Error('Job details not found');
    }

    const jobNumber = jobDetails.job_number;
    console.log('Job ID', jobNumber);

    // Get the artifact URL
    const artifactResponse = await fetch(`https://circleci.com/api/v2/project/gh/${owner}/${repository}/${jobNumber}/artifacts`);
    const artifactData = await artifactResponse.json();
    const artifact = artifactData.items.find((item: any) => item.path.includes(artifactName));

    if (!artifact) {
        throw new Error(`Artifact ${artifactName} not found`);
    }

    const artifactUrl = artifact.url;

    // Download the artifact
    const artifactDownloadResponse = await fetch(artifactUrl);
    const artifactArrayBuffer = await artifactDownloadResponse.arrayBuffer();
    const artifactBuffer = Buffer.from(artifactArrayBuffer);
    fs.writeFileSync(outputFilePath, artifactBuffer);

    if (!fs.existsSync(outputFilePath)) {
        throw new Error(`Failed to download artifact to ${outputFilePath}`);
    }
}

/**
 * Reads the content of an artifact file.
 * @param filePath - The path to the downloaded artifact.
 * @returns The content of the artifact file.
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