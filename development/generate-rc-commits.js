const fs = require('fs');
const simpleGit = require('simple-git');

const { Octokit } = require('@octokit/core');

const octokit = new Octokit({
  auth: 'your-access-token',
});

/**
 * This script is used to filter and group commits by teams based on unique commit messages.
 * It takes two branches as input and generates a CSV file with the commit message, author,PR link, team,release tag and commit hash
 * The teams and their members are defined in the 'teams.json' file.
 *
 * Command to run the script: node development/generate-rc-commits.js origin/branchA origin/branchB
 *
 * @example <caption> Sample command to get all the commits from release v11.13.0 to v11.14.0 </caption>
 *        node development/generate-rc-commits.js origin/Version-v11.14.0 origin/Version-v11.13.0
 * Output: the generated commits will be in a file named 'commits.csv'.
 */

// JSON mapping authors to teams

// Function to fetch author teams file from teams.json

async function fetchAuthorTeamsFile(owner, repo, path) {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        path,
      }
    );

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(content); // Assuming the file is in JSON format
  } catch (error) {
    console.error('Error fetching author teams file:', error);
    return {};
  }
}

// Function to get PR labels

async function getPRLabels(owner, repo, prNumber) {
  try {
    const response = await octokit.request(
      'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
      {
        owner,
        repo,
        issue_number: prNumber,
      },
    );

    return response.data.map((label) => label.name);
  } catch (error) {
    console.error('Error fetching PR labels:', error);
    return {};
  }
}

// Function to get the team for a given author

let authorTeams = {};

function getTeamForAuthor(authorName) {
  const team = authorTeams[authorName] || 'Other/Unknown';
  const teamName = team.replace(/^team-/, ''); // Remove the "team-" prefix
  return teamName.charAt(0).toUpperCase() + teamName.slice(1); // Capitalize the first letter
}

// Function to get the GitHub username for a given commit hash

async function getGitHubUsername(owner, repo, commitHash) {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{ref}',
      {
        owner,
        repo,
        ref: commitHash,
      }
    );

    return data.author ? data.author.login : null;
  } catch (error) {
    console.error('Error fetching GitHub username:', error);
    return null;
  }
}

// Function to filter commits based on unique commit messages and group by teams
async function filterCommitsByTeam(branchA, branchB) {
  try {
    const git = simpleGit();

    const logOptions = {
      from: branchB,
      to: branchA,
      format: {
        hash: '%H',
        author: '%an',
        message: '%s',
      },
    };

    const log = await git.log(logOptions);
    const seenMessages = new Set();
    const commitsByTeam = {};

    const MAX_COMMITS = 500; // Limit the number of commits to process
    let processedCommits = 0;
    console.log('Generation of the CSV file "commits.csv" is in progress...');

    for (const commit of log.all) {
      if (processedCommits >= MAX_COMMITS) {
        break;
      }

      const { author, message, hash } = commit;
      const githubUsername = await getGitHubUsername('MetaMask', 'metamask-extension', hash);

      // Log the author and GitHub username for debugging
      console.log(`Author: ${author}, GitHub Username: ${githubUsername}`);

      const team = getTeamForAuthor(githubUsername);


      // Extract PR number from the commit message using regex
      const prMatch = message.match(/\(#(\d+)\)/u);
      const prLink = prMatch
        ? `https://github.com/MetaMask/metamask-extension/pull/${prMatch[1]}`
        : '';

      // Check if the commit message is unique and exclude 'Changelog' or 'Merge pull request' or 'master-sync' in the message
      if (
        !seenMessages.has(message) &&
        prMatch &&
        !message.includes('changelog') &&
        !message.includes('Merge pull request') &&
        !message.includes('master-sync')
      ) {
        const labels = await getPRLabels(
          'MetaMask',
          'metamask-extension',
          prMatch[1],
        );
        const filteredLabels = labels.filter((label) =>
          label.includes('release'),
        );
        const releaseLabel = filteredLabels[0];
        seenMessages.add(message);

        // Initialize the team's commits array if it doesn't exist
        if (!commitsByTeam[team]) {
          commitsByTeam[team] = [];
        }

        commitsByTeam[team].push({
          message,
          author: githubUsername, // Use GitHub username instead of author name,
          prLink,
          releaseLabel,
          hash: hash.substring(0, 10),
        });

        processedCommits++;
      }
    }

    return commitsByTeam;
  } catch (error) {
    console.error(error);
    return {};
  }
}

function formatAsCSV(commitsByTeam) {
  const csvContent = [];
  for (const [team, commits] of Object.entries(commitsByTeam)) {
    commits.forEach((commit) => {
      commit.message = commit.message.replace(/,/gu, ''); // Remove commas from the commit message
      const row = [
        commit.message,
        commit.author,
        commit.prLink,
        team,
        commit.releaseLabel,
        commit.hash,
      ];
      csvContent.push(row.join(','));
    });
  }
  csvContent.unshift(
    'Commit Message,Author,PR Link,Team,Release Label,Commit Hash',
  );

  return csvContent;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node script.js branchA branchB');
    process.exit(1);
  }

  const branchA = args[0];
  const branchB = args[1];

  // Fetch author teams from the teams.json file
  authorTeams = await fetchAuthorTeamsFile('MetaMask', 'MetaMask-planning', 'teams.json');

  const commitsByTeam = await filterCommitsByTeam(branchA, branchB);

  if (Object.keys(commitsByTeam).length === 0) {
    console.log('No unique commits found.');
  } else {
    const csvContent = formatAsCSV(commitsByTeam);
    fs.writeFileSync('commits.csv', csvContent.join('\n'));
    console.log('CSV file "commits.csv" created successfully.');
  }
}

main();
