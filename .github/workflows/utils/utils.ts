import { execSync } from 'child_process';
import fs from 'fs';

const OWNER = 'MetaMask';
const REPOSITORY = 'metamask-extension';

/**
 * Downloads an artifact from CircleCI.
 * @param branch - The branch name.
 * @param headCommitHash - The commit hash of the branch.
 * @param artifactName - The name of the artifact to download.
 * @param outputFilePath - The path to save the downloaded artifact.
 * @param jobName - The name of the job that produced the artifact.
 */
export function downloadCircleCiArtifact(branch: string, headCommitHash: string, artifactName: string, outputFilePath: string, jobName: string): void {
    // Get the pipeline ID for the current branch
    const pipelineId = execSync(
        `curl --silent "https://circleci.com/api/v2/project/gh/${OWNER}/${REPOSITORY}/pipeline?branch=${branch}" | jq --arg head_commit_hash "${headCommitHash}" -r '.items | map(select(.vcs.revision == $head_commit_hash)) | first | .id'`
    ).toString().trim();

    // Get the workflow ID for the pipeline
    const workflowId = execSync(
        `curl --silent "https://circleci.com/api/v2/pipeline/${pipelineId}/workflow" | jq -r '.items[0].id'`
    ).toString().trim();

    // Get the job details for the specific job that produces artifacts
    const jobDetails = execSync(
        `curl --silent "https://circleci.com/api/v2/workflow/${workflowId}/job" | jq --arg job_name "${jobName}" -r '.items[] | select(.name == $job_name)'`
    ).toString();

    const jobId = JSON.parse(jobDetails).id;

    // Get the artifact URL
    const artifactList = execSync(
        `curl --silent "https://circleci.com/api/v2/project/gh/${OWNER}/${REPOSITORY}/${jobId}/artifacts"`
    ).toString();
    const artifact = JSON.parse(artifactList).items.find((item: any) => item.path.includes(artifactName));

    if (!artifact) {
        throw new Error(`Artifact ${artifactName} not found`);
    }

    const artifactUrl = artifact.url;

    // Download the artifact
    execSync(`curl --silent --location "${artifactUrl}" --output "${outputFilePath}"`);

    if (!fs.existsSync(outputFilePath)) {
        throw new Error(`Failed to download artifact to ${outputFilePath}`);
    }
}

/**
 * Reads the content of an artifact file.
 * @param filePath - The path to the downloaded artifact.
 * @returns The content of the artifact file.
 */
export function readArtifact(filePath: string): string {
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