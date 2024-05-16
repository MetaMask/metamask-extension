import axios from 'axios';

interface File {
  filename: string;
}

const PR_URL: string = `${process.env.CIRCLE_PULL_REQUEST}`;
const PR_NUMBER: string = PR_URL.match(/\/(\d+)$/u)![1];

const GH_API_URL: string = `https://api.github.com/repos/MetaMask/metamask-extension/pulls/${PR_NUMBER}/files`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

async function fetchChangedE2eFiles(): Promise<string> {
  try {
    const response = await axios.get<File[]>(GH_API_URL, { headers });
    const filesChanged: string = response.data
      .filter(
        (file: File) =>
          file.filename.startsWith('test/e2e/') &&
          file.filename.endsWith('.spec.js'),
      )
      .map((file: File) => file.filename)
      .join('\n');

    return filesChanged;
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
}

export { fetchChangedE2eFiles };
