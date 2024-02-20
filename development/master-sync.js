#!/usr/bin/env node

// USAGE:
// Simply run `yarn master-sync` from any branch.
// This will create/update a local master-sync branch
// and get it in the state needed for a master-sync PR
// Once the script successfully completes, you just
// need to push the branch to the remote repo. This will
// likely require a `git push --force`

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

async function runGitCommands() {
  const branchName = 'master-sync';

  try {
    try {
      // Check if the branch already exists
      const { stdout: branchExists } = await exec(
        `git rev-parse --quiet --verify ${branchName}`,
      );
      if (branchExists.trim()) {
        // Branch exists, so simply check it out
        await exec(`git checkout ${branchName}`);
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

    await exec('git reset --hard origin/master');
    console.log('Executed: git reset --hard origin/master');

    try {
      await exec('git merge origin/develop');
      console.log('Executed: git merge origin/develop');
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

    await exec('git restore --source origin/develop .');
    console.log('Executed: it restore --source origin/develop .');

    await exec('git checkout origin/develop -- .');
    console.log('Executed: git checkout origin/develop -- .');

    await exec('git checkout origin/master -- CHANGELOG.md');
    console.log('Executed: git checkout origin/master -- CHANGELOG.md');

    const { stdout: packageJsonContent } = await exec(
      'git show origin/master:package.json',
    );
    const packageJson = JSON.parse(packageJsonContent);
    const packageVersion = packageJson.version;

    await exec(`yarn version "${packageVersion}"`);
    console.log('Executed: yarn version');

    await exec('git add .');
    console.log('Executed: git add .');

    await exec('git commit -m "Merge origin/develop into master-sync"');
    console.log('Executed: git commit');

    console.log('Your local master-sync branch is now ready to become a PR.');
    console.log('You likely now need to do `git push --force`');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

runGitCommands();
