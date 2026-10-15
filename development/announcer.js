#!/usr/bin/env node

/**
 * Script to extract the latest changelog entry based on the current package version
 * and generate a release announcement message.
 */

const fs = require('fs/promises');
const path = require('path');

// Execute the main logic using an async function wrapper
async function main() {
    let pkg;
    try {
        // 1. Read package.json to get the version
        const pkgPath = path.join(__dirname, '..', 'package.json');
        const pkgContent = await fs.readFile(pkgPath, 'utf8');
        pkg = JSON.parse(pkgContent);
    } catch (error) {
        console.error("Error reading or parsing package.json:", error.message);
        process.exit(1);
    }

    const { version } = pkg;
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

    try {
        // 2. Read the CHANGELOG file asynchronously
        const changelog = await fs.readFile(changelogPath, 'utf8');

        // 3. Define the section header pattern for the current version.
        // This is a safer way to isolate the log than relying on the bare version string.
        // It looks for the content *after* '## [VERSION]' until the *next* '##' header.
        const versionHeader = `## ${version}`;
        const parts = changelog.split(versionHeader);

        if (parts.length < 2) {
            console.error(`Error: Could not find release header "${versionHeader}" in CHANGELOG.md`);
            process.exit(1);
        }

        // The relevant changes are in the second part (index 1)
        const contentAfterVersion = parts[1];
        
        // Split by the next '##' header (which denotes the start of the previous version's log)
        const log = contentAfterVersion.split('##')[0].trim();

        // 4. Construct the final announcement message
        const msg = `*MetaMask ${version}* now published! It should auto-update soon!\n\n${log}`;

        console.log(msg);

    } catch (error) {
        console.error(`Error processing CHANGELOG.md at ${changelogPath}:`, error.message);
        process.exit(1);
    }
}

main();
