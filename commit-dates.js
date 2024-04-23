
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const csvParser = require('csv-parser');
const {createObjectCsvWriter} = require('csv-writer');
const { chunk } = require('lodash');

const GITHUB_TOKEN = '';

axios.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`;

const authorTeams = {
  Accounts: [
    'Owen Craston',
    'Gustavo Antunes',
    'Monte Lai',
    'Daniel Rocha',
    'Kate Johnson',
  ],
  'Extension UX': ['David Walsh', 'vthomas13', 'Nidhi Kumari', 'Victor Thomas'],
  'Extension Platform': [
    'chloeYue',
    'Chloe Gao',
    'Pedro Figueiredo',
    'danjm',
    'Danica Shen',
    'Brad Decker',
    'hjetpoluru',
    'Harika Jetpoluru',
    'Marina Boboc',
    'Gauthier Petetin',
    'Dan Miller',
    'Dan J Miller',
    'David Murdoch',
    'Howard Braham',
  ],
  'Confirmation UX': [
    'Sylva Elendu',
    'Olusegun Akintayo',
    'Jyoti Puri',
    'Ariella Vu',
    'Sylva Elendu',
    'seaona',
  ],
  'Confirmation Systems': [
    'OGPoyraz',
    'vinistevam',
    'Matthew Walsh',
    'cryptotavares',
    'Vinicius Stevam',
    'Derek Brans',
  ],
  'Design Systems': ['georgewrmarshall', 'Garrett Bear', 'George Marshall'],
  Snaps: [
    'David Drazic',
    'hmalik88',
    'Montoya',
    'Mrtenz',
    'Frederik Bolding',
    'Bowen Sanders',
    'Guillaume Roux',
    'Hassan Malik',
    'Maarten Zuidhoorn',
  ],
  Assets: ['salimtb', 'sahar-fehri', 'Brian Bergeron'],
  Linea: ['VGau'],
  lavamoat: ['weizman', 'legobeat', 'kumavis'],
  'Shared Libraries': ['Michele Esposito', 'Elliot Winkler', 'Mark Stacey','Gudahtt',],
  MMI: [
    'António Regadas',
    'Albert Olivé',
    'Ramon AC',
    'Shane T',
    'Bernardo Garces Chapero',
  ],
  Swaps: ['Daniel', 'Davide Brocchetto'],
  WalletAPI: ['Thomas Huang', 'Alex Donesky', 'jiexi', 'Zachary Belford','tmashuang', 'jiexi', 'BelfordZ', 'Shane'],
};

// Function to get the team for a given author
function getTeamForAuthor(authorName) {
  for (const [team, authors] of Object.entries(authorTeams)) {
    if (authors.includes(authorName)) {
      return team;
    }
  }
  return authorName; // Default team for unknown authors
}

const removeTrailingZ = (str) => {
	if (str && str.length && str[str.length - 1] === 'Z') {
		return str.slice(str, str.length - 1)
	}
	return str
}

const readCSV = async (filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csvParser(['Datetime', 'Commit Hash', 'Commit Message', 'Author', 'Team', 'PR Link']))
            .on('data', (row) => {
              console.log('row', row)
            	if (row['PR Link']?.match(/\d{5}/)) {
	            	rows.push(row)
            	}
            })
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
};
let count = 0
const fetchPRDetails = async (prLink) => {
    const prNumber = prLink.split('/').pop();
    const repoPath = prLink.split('/').slice(-4, -2).join('/');
    const apiUrl = `https://api.github.com/repos/${repoPath}/pulls/${prNumber}`;
    const reviews = await axios.get(`${apiUrl}/reviews`);
    const approvals = reviews.data.filter(r => r.state === 'APPROVED').slice(0,2);

    return {prLink, prCreatedAt: '', prReadyForReviewAt: '', firstReviewLeftAt: '', twoApprovalsAt: '', prMergedAt: '',
    approver1: approvals && getTeamForAuthor(approvals[0]?.user?.login), approver2: approvals && getTeamForAuthor(approvals[1]?.user?.login)};
};

const writeCSV = async (data, t) => {
    const csvWriter = createObjectCsvWriter({
        path: './output.csv',
        header: [
    			{id: 'datetime', title: 'Datetime',},
    			{id: 'commitHash', title: 'Commit Hash',},
    			{id: 'commitMessage', title: 'Commit Message',},
    			{id: 'author', title: 'Author',},
    			{id: 'team',title: 'Team'},
          {id: 'prLink', title: 'PR Link'},
          {id: 'prCreatedAt', title: 'PR Created At'},
          {id: 'prReadyForReviewAt', title: 'Ready for Review At'},
          {id: 'firstReviewLeftAt', title: 'First Review Left At'},
          {id: 'twoApprovalsAt', title: 'Two Approvals At'},
          {id: 'prMergedAt', title: 'PR Merged At'},
          {id: 'approver1', title: 'Approver 1'},
          {id: 'approver2', title: 'Approver 2'}
        ]
    });

    await csvWriter.writeRecords(data);
    console.log('output.csv written', (t ? ' despite error. Length: ' + data?.length : ''))
};

const processChunk = async (chunk) => {
	const prDetailsPromises = chunk.map(row => {
		const newRow = {...row};
		delete newRow['PR Link'];
		return fetchPRDetails(row['PR Link'])
			.then(prDetails => ({...newRow, ...prDetails}))
	});
	const prDetails = await Promise.all(prDetailsPromises);
	return prDetails;
}

const processPRs = async (filePath) => {
	let prDetails = [];
	try {
    let csvRows = await readCSV(filePath);
    csvRows = csvRows.slice(0,5)
		csvRows = csvRows.map(row => ({
			...row,
			datetime: row['Datetime'],
			commitHash: row['Commit Hash'],
			commitMessage: row['Commit Message'],
			author: row['Author'],
			team: row['Team'],
		}))
		let chunks = chunk(csvRows, 1)
		let nextChunk
		let nextPD
		while (chunks.length) {
			nextChunk = chunks.pop();
			nextPD = await processChunk(nextChunk);
			await (new Promise(resolve => setTimeout(resolve, 1000)))
			prDetails = [...prDetails, ...nextPD];
		}
	    await writeCSV(prDetails);
	} catch (e) {
		console.error(e)
		if (prDetails.length) {
		    await writeCSV(prDetails, true);
		}
	}
};

// Example usage
processPRs('./commits.csv').catch(console.error);
