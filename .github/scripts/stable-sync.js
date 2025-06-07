#!/usr/bin/env node

// USAGE:
// This will create/update a local stable-sync branch
// and get it in the state needed for a stable-sync PR
// Once the script successfully completes, you just
// need to push the branch to the remote repo. This will
// likely require a `git push --force`
//
// Usage: node stable-sync.js [branch-name]
// If no branch name is provided, defaults to 'stable-sync'
//
// Environment variables:
// CREATE_BRANCH - if set to 'true', will push the branch at the end

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

async function runGitCommands() {
  // Get branch name from command line arguments or use default
  const branchName = process.argv[2] || 'stable-main';

  // Check if CREATE_BRANCH environment variable exists and is set to true
  const shouldPushBranch = (process.env.CREATE_BRANCH || 'false').toLowerCase() === 'true';

  try {
    try {
      // Check if the branch already exists
      const { stdout: branchExists } = await exec(
        //`git rev-parse --quiet --verify ${branchName}`,
        `git ls-remote origin ${branchName}`,
      );
      if (branchExists.trim()) {
        // Branch exists, so simply check it out
        await exec(`git checkout ${branchName}`);
        await exec(`git pull origin ${branchName}`);
        console.log(`Checked out branch: ${branchName}`);
      } else {
        throw new Error(
          'git rev-parse --quiet --verify failed. Branch hash empty',
        );
      }
    } catch (error) {
      if (error.stdout === '') {
        console.warn(
          `Branch does not exist, creating new ${branchName} branch.`,
        );

        // Branch does not exist, create and check it out
        await exec(`git checkout -b ${branchName}`);
        console.log(`Created and checked out branch: ${branchName}`);
      } else {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    }

    await exec('git fetch');
    console.log('Executed: git fetch');

    await exec('git reset --hard origin/stable');
    console.log('Executed: git reset --hard origin/stable');

    try {
      await exec('git merge origin/main');
      console.log('Executed: git merge origin/main');
    } catch (error) {
      // Handle the error but continue script execution
      if (
        error.stdout.includes(
          'Automatic merge failed; fix conflicts and then commit the result.',
        )
      ) {
        console.warn(
          'Merge conflict encountered. Continuing script execution.',
        );
      } else {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    }

    await exec('git add .');
    await exec('git restore --source origin/main .');
    console.log('Executed: it restore --source origin/main .');

    await exec('git checkout origin/main -- .');
    console.log('Executed: git checkout origin/main -- .');

    await exec('git checkout origin/stable -- CHANGELOG.md');
    console.log('Executed: git checkout origin/stable -- CHANGELOG.md');

    // Execute mobile-specific commands if REPO is 'mobile'
    if (process.env.REPO === 'mobile') {
      console.log('Executing mobile-specific commands...');

      await exec('git checkout origin/stable -- bitrise.yml');
      console.log('Executed: git checkout origin/stable -- bitrise.yml');

      await exec('git checkout origin/stable -- android/app/build.gradle');
      console.log('Executed: git checkout origin/stable -- android/app/build.gradle');

      await exec('git checkout origin/stable -- ios/MetaMask.xcodeproj/project.pbxproj');
      console.log('Executed: git checkout origin/stable -- ios/MetaMask.xcodeproj/project.pbxproj');

      await exec('git checkout origin/stable -- package.json');
      console.log('Executed: git checkout origin/stable -- package.json');
    }
    // Execute extension-specific commands if REPO is 'extension'
    else if (process.env.REPO === 'extension') {
      console.log('Executing extension-specific commands...');

      const { stdout: packageJsonContent } = await exec(
        'git show origin/main:package.json',
      );
      const packageJson = JSON.parse(packageJsonContent);
      const packageVersion = packageJson.version;

      await exec(`yarn version "${packageVersion}"`);
      console.log('Executed: yarn version');
    }
    // If REPO is not set or has an invalid value, skip both
    else {
      console.log('REPO environment variable not set or invalid. Skipping mobile/extension specific commands.');
    }

    await exec('git add .');
    console.log('Executed: git add .');

    try {
      // Check if there are any changes to commit
      const { stdout: status } = await exec('git status --porcelain');
      if (!status.trim()) {
        console.log('No changes to commit, skipping commit step');
        return;
      }

      await exec(`git commit -m "Merge origin/main into ${branchName}" --no-verify`);
      console.log('Executed: git commit');
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    console.log(`Your local ${branchName} branch is now ready to become a PR.`);

    // Push the branch if CREATE_BRANCH is true
    if (shouldPushBranch) {
      try {
        console.log(`Checking if branch ${branchName} exists remotely...`);
        const { stdout: remoteBranches } = await exec('git ls-remote --heads origin');
        const branchExists = remoteBranches.includes(`refs/heads/${branchName}`);

        if (branchExists) {
          console.log(`Branch ${branchName} exists remotely, updating...`);
          await exec(`git push origin ${branchName}`);
        } else {
          console.log(`Branch ${branchName} does not exist remotely, creating...`);
          await exec(`git push --set-upstream origin ${branchName}`);
        }
        console.log(`Successfully pushed branch ${branchName} to remote`);
      } catch (error) {
        console.error(`Error pushing branch: ${error.message}`);
        process.exit(1);
      }
    } else {
      console.log('You likely now need to do `git push --force`');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

runGitCommands();
