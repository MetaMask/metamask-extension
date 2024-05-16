const axios = require('axios');

const PR_URL = `${process.env.CIRCLE_PULL_REQUEST}`;
const PR_NUMBER = PR_URL.match(/\/(\d+)$/u);

const GH_API_URL = `https://api.github.com/repos/MetaMask/metamask-extension/pulls/${PR_NUMBER}/files`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

async function fetchFilesChanged() {
  try {
    const response = await axios.get(GH_API_URL, { headers });
    const filesChanged = response.data
      .filter(
        (file) =>
          file.filename.startsWith('test/e2e/') &&
          file.filename.endsWith('.spec.js'),
      )
      .map((file) => file.filename)
      .join('\n');

    return filesChanged;
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
}

module.exports = { fetchFilesChanged };
