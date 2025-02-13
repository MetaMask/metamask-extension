import fs from 'fs';
import { execSync } from 'child_process';
import { filterE2eChangedFiles } from '../../test/e2e/changedFilesUtil';
import {
    downloadArtifact,
    getArtifactUrl,
    readFileContent,
    sleep,
} from './shared/circle-artifacts';

async function verifyE2ePageObjectsUsage(fileStatus: 'M' | 'A' | 'both') {
    let e2eFiles: string[];

    if (process.env.GITHUB_ACTIONS) {
        // Running in Github Actions
        const branch = process.env.BRANCH || '';
        const headCommitHash = process.env.HEAD_COMMIT_HASH || '';
        const artifactName = 'changed-files.txt';
        const artifactPath = 'changed-files';
        const jobName = 'get-changed-files-with-git-diff';

        let attempts = 0;
        const maxAttempts = 3;
        let changedFilesContent = '';

        // Small buffer to ensure the job id is accessible in circle ci
        // once we have that job migrated into github actions, we can just add a dependency rule
        await sleep(180);

        while (attempts < maxAttempts) {
            try {
                console.log(`Attempt ${attempts + 1}/${maxAttempts}`);

                const outputDir = `${artifactPath}/changed-files.txt`;
                const changedFilesArtifactUrl = await getArtifactUrl(branch, headCommitHash, jobName, artifactName);

                await downloadArtifact(changedFilesArtifactUrl, outputDir);

                changedFilesContent = readFileContent(outputDir);

                if (changedFilesContent) {
                    console.log('Artifact downloaded and read successfully.');
                    break;
                }
            } catch (error) {
                console.error(`Error fetching artifact: ${error.message}`);
            }

            attempts++;
            if (attempts < maxAttempts) {
                console.log(`Retrying in 15 seconds... (${attempts}/${maxAttempts})`);
                await sleep(15);
            }
        }

        if (!changedFilesContent) {
            console.error('No artifacts found for changed files. Exiting with failure.');
            process.exit(1);
        }

        // Parse the changed and new files with status
        const changedAndNewFilePathsWithStatus = changedFilesContent.split('\n').filter(line => line.trim() !== '').map(line => {
            const [status, filePath] = line.split('\t');
            return { status, filePath };
        });

        // Filter files based on the provided fileStatus
        const filteredFiles = changedAndNewFilePathsWithStatus.filter(file => {
            if (fileStatus === 'both') {
                return file.status === 'A' || file.status === 'M';
            }
            return file.status === fileStatus;
        }).map(file => file.filePath);

        e2eFiles = filterE2eChangedFiles(filteredFiles);
        console.log('Filtered E2E files:', e2eFiles);
    } else {
        // Running locally
        console.log('Running locally, performing git diff against main branch...');
        const diffOutput = execSync('git diff --name-status main...HEAD').toString().trim();
        const changedFiles = diffOutput.split('\n').filter(line => line.trim() !== '').map(line => {
            const [status, filePath] = line.split('\t');
            return { status, filePath };
        });

        // Filter files based on the provided fileStatus
        const filteredFiles = changedFiles.filter(file => {
            if (fileStatus === 'both') {
                return file.status === 'A' || file.status === 'M';
            }
            return file.status === fileStatus;
        }).map(file => file.filePath);

        e2eFiles = filterE2eChangedFiles(filteredFiles);
        console.log('Filtered E2E files:', e2eFiles);
    }

    if (e2eFiles.length === 0) {
        console.log('No E2E files to validate. Exiting successfully.');
        process.exit(0);
    }

    // Check each E2E file for page object usage
    for (const file of e2eFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            // Check for the presence of page object imports
            const usesPageObjectModel = content.includes('./page-objects/');

            if (!usesPageObjectModel) {
                console.error(`\x1b[31mFailure: You need to use Page Object Model in ${file}\x1b[0m`);
                process.exit(1);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`File not found: ${file}`);
                continue; // Skip this file because it was deleted, so no need to validate
            } else {
                throw error; // Re-throw if it's a different error
            }
        }
    }

    console.log("\x1b[32mSuccess: All the new or modified E2E files use the Page Object Model.\x1b[0m");
}

// Run the verification for new files only
verifyE2ePageObjectsUsage('A').catch((error) => {
    console.error('Not all the new e2e files use the Page Object Model', error);
    process.exit(1);
});