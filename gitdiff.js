const simpleGit = require('simple-git');
const fs = require('fs');

// JSON mapping authors to teams
const authorTeams = {
  "Accounts": ['Owen Craston', 'Gustavo Antunes', 'Monte Lai', 'Daniel Rocha', 'Howard Braham'],
  "Extension UX": ['David Walsh', 'vthomas13', 'Nidhi Kumari'],
  "Extension Platform": ['chloeYue', 'Pedro Figueiredo', 'danjm', 'Peter', 'Marina Boboc', 'Gauthier Petetin', 'Dan Miller', 'Dan J Miller', 'Dan J Miller'],
  "DappAPI": ['tmashuang', 'jiexi', 'BelfordZ'],
  "Confirmation UX": ['Sylva Elendu', 'Olusegun Akintayo', 'Jyoti Puri', 'Ariella Vu'],
  "Confirmation Systems": ['OGPoyraz', 'vinistevam', 'Matthew Walsh', 'cryptotavares'],
  "Design Systems": ['georgewrmarshall', 'Garrett Bear'],
  "Snaps": ['David Drazic', 'hmalik88', 'Montoya', 'Mrtenz', 'Frederik Bolding', 'Bowen Sanders'],
  "Assets": ['salimtb', 'sahar-fehri'],
  "Linea": ['VGau'],
  "lavamoat": ['weizman', 'legobeat', 'kumavis'],
  "Shared Libraries": ['Michele Esposito'],
  "MMI": ['António Regadas', 'Albert Olivé']
}

// Function to get the team for a given author
function getTeamForAuthor(authorName) {
  for (const [team, authors] of Object.entries(authorTeams)) {
    if (authors.includes(authorName)) {
      return team;
    }
  }
  return 'Other/Unknown'; // Default team for unknown authors
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
    const seenMessagesArray = [];
    const commitsByTeam = {};

    const MAX_COMMITS = 500; // Limit the number of commits to process

    for (const commit of log.all) {
      if (commitsByTeam.length >= MAX_COMMITS) break;

      const authorName = commit.author;
      const team = getTeamForAuthor(authorName);

      // Extract PR number from the commit message using regex
      const prMatch = commit.message.match(/\(#(\d{5})\)$/);
      const prLink = prMatch ? `https://github.com/MetaMask/metamask-extension/pull/${prMatch[1]}` : '';

      // Check if the commit message is unique
      if (!seenMessages.has(commit.message)) {
        seenMessagesArray.push(commit.message)
        seenMessages.add(commit.message);

        // Initialize the team's commits array if it doesn't exist
        if (!commitsByTeam[team]) {
          commitsByTeam[team] = [];
        }

        commitsByTeam[team].push({
          message: commit.message,
          author: commit.author,
          hash: commit.hash.substring(0, 10),
          prLink: prLink,
        });
      }
    }

    return commitsByTeam;
  } catch (error) {
    console.error(error);
    return {};
  }
}

function formatAsCSV(commitsByTeam) {
  let csvContent = 'Commit Hash,Commit Message,Author,Team,PR Link\n';

  for (const [team, commits] of Object.entries(commitsByTeam)) {
    commits.forEach(commit => {
      csvContent += `"${commit.hash}","${commit.message}","${commit.author}","${team}","${commit.prLink}"\n`;
    });
  }

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

  const commitsByTeam = await filterCommitsByTeam(branchA, branchB);

  if (Object.keys(commitsByTeam).length === 0) {
    console.log('No unique commits found.');
  } else {
    const csvContent = formatAsCSV(commitsByTeam);
    fs.writeFileSync('commits.csv', csvContent);
    console.log('CSV file "commits.csv" created successfully.');
  }
}

main();
