const Koa = require('koa');
const Router = require('@koa/router');
const { execSync } = require('child_process');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static'); // Add this line

const app = new Koa();
const router = new Router();

const port = 3000;

app.use(bodyParser());
app.use(serve('public')); 

const commitMessagesToExclude = ['master sync']

router.post('/find-commits', async (ctx) => {
  const commitMessage = ctx.request.body.commitMessage;
  let commitSHAList = [];

  // Check if the input matches the pattern of a commit hash
  if (/^[0-9a-fA-F]+$/.test(commitMessage) && !/^[0-9]{5}$/.test(commitMessage)) {
    commitSHAList.push(commitMessage);
  } else {
    // Find commits matching the commit message
    commitSHAList = execSync(`git log --grep="${commitMessage}" --pretty=format:%h`).toString().split('\n').filter(Boolean);
  }

  const response = [];
  const uniqueCommitMessages = new Set(); // Use a Set to track unique commit messages

  for (const commitSHA of commitSHAList) {
    // Find release tags containing the commit
    const releaseTags = execSync(`git tag --contains ${commitSHA}`).toString().split('\n').filter(Boolean);
    const commitDetails = {
      commitHash: commitSHA,
      commitMessage: execSync(`git log -n 1 --pretty=format:%s ${commitSHA}`).toString(),
      releaseTags: releaseTags,
    };

    const ignoreList = ["master sync"]; 

    // If there are multiple release tags, find the earliest one
    if (releaseTags.length > 1) {
      const earliestReleaseTag = findEarliestReleaseTag(releaseTags);
      commitDetails.earliestReleaseTag = earliestReleaseTag;
    }

    const isIgnored = ignoreList.some(ignoreStr =>
      commitDetails.commitMessage.toLowerCase().includes(ignoreStr.toLowerCase())
    );

    // Check if the commit message is unique; if not, skip it
    if (!uniqueCommitMessages.has(commitDetails.commitMessage) && !isIgnored) {
      uniqueCommitMessages.add(commitDetails.commitMessage);
      response.push(commitDetails);
    }
  }

  ctx.body = response;
});

function findEarliestReleaseTag(releaseTags) {
  return releaseTags.reduce((earliest, current) => {
    return earliest.localeCompare(current) < 0 ? earliest : current;
  });
}

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});