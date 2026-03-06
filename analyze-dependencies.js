const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run shell commands
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Function to fetch the current dependencies
async function fetchCurrentDependencies() {
  try {
    const currentDependencies = await runCommand('npm ls --json');
    return JSON.parse(currentDependencies);
  } catch (error) {
    console.error('Failed to fetch current dependencies', error);
  }
}

// Function to fetch dependencies of the PR (using the specific PR branch)
async function fetchPRDependencies(prBranch) {
  try {
    const prDependencies = await runCommand(`git fetch origin pull/${prBranch}/head:pr-branch && git checkout pr-branch && npm ls --json`);
    return JSON.parse(prDependencies);
  } catch (error) {
    console.error('Failed to fetch PR dependencies', error);
  }
}

// Function to compare two dependency trees
function compareDependencies(currentDeps, prDeps) {
  const differences = [];

  const currentDependencies = currentDeps.dependencies;
  const prDependencies = prDeps.dependencies;

  // Compare dependencies in both trees
  Object.keys(prDependencies).forEach(dep => {
    if (!currentDependencies[dep]) {
      differences.push(`New dependency found: ${dep}`);
    }
  });

  return differences;
}

// Main function to trigger the dependency comparison
async function analyzeDependencies() {
  const currentDeps = await fetchCurrentDependencies();
  const prDeps = await fetchPRDependencies('6698'); // PR Number from MetaMask

  if (currentDeps && prDeps) {
    const differences = compareDependencies(currentDeps, prDeps);
    if (differences.length > 0) {
      console.log('Differences found in dependencies:');
      differences.forEach(diff => console.log(diff));
    } else {
      console.log('No differences found in dependencies.');
    }
  }
}

// Run the analysis
analyzeDependencies();