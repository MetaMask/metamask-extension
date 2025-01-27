import fs from 'fs';
import { execSync } from 'child_process';
import { filterE2eChangedFiles } from '../../../test/e2e/changedFilesUtil';
import { downloadCircleCiArtifact, readFileContent, sleep } from './utils';

async function verifyE2ePageObjectsUsage() {
    let e2eFiles: string[];

    if (process.env.GITHUB_ACTIONS) {
        // Running in Github Actions
        const branch = process.env.BRANCH || '';
        const headCommitHash = process.env.HEAD_COMMIT_HASH || '';
        const artifactName = 'changed-files.txt';
        const artifactPath = 'changed-files';
        const jobName = 'get-changed-files-with-git-diff'; // Specify the job name

        let attempts = 0;
        const maxAttempts = 3;
        let changedFilesContent = '';

        while (attempts < maxAttempts) {
            try {
                console.log(`Downloading artifact: Attempt ${attempts + 1}/${maxAttempts}`);

                const outputDir = `${artifactPath}/changed-files.txt`;
                downloadCircleCiArtifact(branch, headCommitHash, artifactName, outputDir, jobName); // Pass the job name

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
                console.log(`Retrying in 60 seconds... (${attempts}/${maxAttempts})`);
                await sleep(60000); // Wait for 60 seconds before retrying
            }
        }

        if (!changedFilesContent) {
            console.error('No artifacts found for changed files. Exiting with failure.');
            process.exit(1);
        }

        // Use the filterE2eChangedFiles function to filter E2E files
        e2eFiles = filterE2eChangedFiles(changedFilesContent.split('\n').filter(file => file.trim() !== ''));
        console.log('e2e changed files', e2eFiles);
    } else {
        // Running locally
        console.log('Running locally, performing git diff...');
        const diffOutput = execSync('git diff --name-only HEAD').toString().trim();
        const changedFiles = diffOutput.split('\n').filter(file => file.trim() !== '');
        console.log('Changed files:', changedFiles);

        e2eFiles = filterE2eChangedFiles(changedFiles);
        console.log('Filtered E2E files:', e2eFiles);
    }

    if (e2eFiles.length === 0) {
        console.log('No E2E files to validate. Exiting successfully.');
        process.exit(0);
    }

    // Check each E2E file for page object usage
    for (const file of e2eFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Check for the presence of page object imports
        const usesPageObjectModel = content.includes("from './page-objects/") ||
                                    content.includes("import") && content.includes("from '../../page-objects/");

        if (!usesPageObjectModel) {
            console.error(`\x1b[31mFailure: You need to use Page Object Model in ${file}\x1b[0m`);
            process.exit(1);
        }
    }

    console.log("\x1b[32mSuccess: All the new or modified E2E files use the Page Object Model.\x1b[0m");
}

// Run the verification
verifyE2ePageObjectsUsage().catch((error) => {
    console.error('Not all the modified e2e use the Page Object Model', error);
    process.exit(1);
});