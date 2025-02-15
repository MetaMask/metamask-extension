const { Client } = require('@notionhq/client');
const { Octokit } = require('@octokit/rest');
const fetch = require('node-fetch');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Initialize Octokit client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Fetch release dates from Runway
async function fetchReleaseDatesFromRunway() {
  const response = await fetch('https://runway.example.com/api/releases');
  const data = await response.json();
  return data;
}

// Update Notion with release dates
async function updateNotion(releaseDates) {
  for (const release of releaseDates) {
    await notion.pages.update({
      page_id: release.notionPageId,
      properties: {
        'Cut Date': {
          date: {
            start: release.cutDate,
          },
        },
        'Validated Date': {
          date: {
            start: release.validatedDate,
          },
        },
        'Rollout Started Date': {
          date: {
            start: release.rolloutStartedDate,
          },
        },
        'Rollout Completed Date': {
          date: {
            start: release.rolloutCompletedDate,
          },
        },
      },
    });
  }
}

// Update GitHub Project Board with release dates
async function updateGitHubProjectBoard(releaseDates) {
  for (const release of releaseDates) {
    await octokit.projects.updateCard({
      card_id: release.githubCardId,
      note: `Cut Date: ${release.cutDate}\nValidated Date: ${release.validatedDate}\nRollout Started Date: ${release.rolloutStartedDate}\nRollout Completed Date: ${release.rolloutCompletedDate}`,
    });
  }
}

// Main function to fetch release dates and update Notion and GitHub Project Board
async function main() {
  const releaseDates = await fetchReleaseDatesFromRunway();
  await updateNotion(releaseDates);
  await updateGitHubProjectBoard(releaseDates);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
