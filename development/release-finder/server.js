const { execSync } = require('child_process');
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static'); // Add this line

const app = new Koa();
const router = new Router();

const port = 3000;

app.use(bodyParser());
app.use(serve('public'));

router.post('/find-commits', async (ctx) => {
  const { commitMessage } = ctx.request.body;
  let commitSHAList = [];

  // Check if the input matches the pattern of a commit hash
  if (
    /^[0-9a-fA-F]+$/u.test(commitMessage) &&
    !/^[0-9]{5}$/u.test(commitMessage)
  ) {
    commitSHAList.push(commitMessage);
  } else {
    // Find commits matching the commit message
    commitSHAList = execSync(
      `git log --grep="${commitMessage}" --pretty=format:%h`,
    )
      .toString()
      .split('\n')
      .filter(Boolean);
  }

  const response = [];
  const uniqueCommitMessages = new Set(); // Use a Set to track unique commit messages

  for (const commitSHA of commitSHAList) {
    // Find release tags containing the commit
    const releaseTags = execSync(`git tag --contains ${commitSHA}`)
      .toString()
      .split('\n')
      .filter(Boolean);
    const commitDetails = {
      commitHash: commitSHA,
      commitMessage: execSync(
        `git log -n 1 --pretty=format:%s ${commitSHA}`,
      ).toString(),
      releaseTags,
    };

    const ignoreList = ['master sync'];

    // If there are multiple release tags, find the earliest one
    if (releaseTags.length > 1) {
      const earliestReleaseTag = findEarliestReleaseTag(releaseTags);
      commitDetails.earliestReleaseTag = earliestReleaseTag;
    } else if (releaseTags.length === 0) {
      commitDetails.earliestReleaseTag = await findReleaseCandidateTag(
        commitSHA,
      );
    } else {
      commitDetails.earliestReleaseTag = releaseTags[0];
    }

    const isIgnored = ignoreList.some((ignoreStr) =>
      commitDetails.commitMessage
        .toLowerCase()
        .includes(ignoreStr.toLowerCase()),
    );

    // Check if the commit message is unique; if not, skip it
    if (!uniqueCommitMessages.has(commitDetails.commitMessage) && !isIgnored) {
      uniqueCommitMessages.add(commitDetails.commitMessage);
      response.push(commitDetails);
    }
  }

  ctx.body = response;
});

async function findReleaseCandidateTag(commitSHA) {
  // Find the highest versioned release tag (e.g., "v1.2.3")
  const tagList = execSync(`git tag --list`)
    .toString()
    .split('\n')
    .filter((tag) => {
      if (tag && /^v(\d+)\.(\d+)\.(\d+)$/u.exec(tag)) {
        return true;
      }
      return false;
    });
  // console.log('tagList', JSON.stringify(tagList, null, 2))
  const sortedTagList = [...tagList].sort((aTag, bTag) => {
    const [, aMajor, aMinor, aPatch] = /^v(\d+)\.(\d+)\.(\d+)$/u.exec(aTag);
    const [, bMajor, bMinor, bPatch] = /^v(\d+)\.(\d+)\.(\d+)$/u.exec(bTag);

    if (Number(aMajor) > Number(bMajor)) {
      // console.log('aTag, bTag', aTag, bTag)
      // console.log('aMajor, bMajor', aMajor, bMajor)
      return 1;
    } else if (Number(bMajor) > Number(aMajor)) {
      // console.log('aTag, bTag', aTag, bTag)
      // console.log('bMajor, aMajor', bMajor, aMajor)
      return -1;
    } else if (Number(aMinor) > Number(bMinor)) {
      // console.log('aMinor, bMinor', aMinor, bMinor)
      return 1;
    } else if (Number(bMinor) > Number(aMinor)) {
      // console.log('bMinor, aMinor', bMinor, aMinor)
      return -1;
    } else if (Number(aPatch) > Number(bPatch)) {
      // console.log('aPatch, bPatch', aPatch, bPatch)
      return 1;
    } else if (Number(bPatch) > Number(aPatch)) {
      // console.log('bPatch, aPatch', bPatch, aPatch)
      return -1;
    }

    return 0;
  });
  const highestVersionedTag = sortedTagList[sortedTagList.length - 1];
  if (!highestVersionedTag) {
    return null; // No release tags found, cannot determine a release candidate tag
  }

  // Extract the version number from the highest versioned tag
  const [, major, minor, patch] = /^v(\d+)\.(\d+)\.(\d+)$/u.exec(
    highestVersionedTag,
  );

  // Find the next possible release candidate version
  const nextPatchVersion = getNextVersion(patch, 'PATCH');
  const nextMinorVersion = getNextVersion(minor, 'MINOR');
  const nextMajorVersion = getNextVersion(major, 'MAJOR');

  // Check if any of the potential release candidate branches exist in the origin remote
  const potentialBranches = [
    `v${nextMajorVersion}.0.0`,
    `v${major}.${nextMinorVersion}.0`,
    `v${major}.${minor}.${nextPatchVersion}`,
  ];

  const branchesContainingCommit = execSync(
    `git branch -r --contains ${commitSHA}`,
  )
    .toString()
    .trim();

  for (const branchName of potentialBranches) {
    const branchExistsAndCommitOnBranch = branchesContainingCommit.includes(
      `origin/Version-${branchName}`,
    );
    if (branchExistsAndCommitOnBranch) {
      return `${branchName}-RC`; // Release candidate tag found
    }
  }

  const remoteBranches = execSync(`git branch -r`).toString().trim();
  const nextMinorVersionExists = remoteBranches.includes(
    `origin/Version-${`v${major}.${nextMinorVersion}.0`}`,
  );
  const possibleNextNextMinorVersion = nextMinorVersionExists
    ? getNextVersion(nextMinorVersion, 'MINOR')
    : nextMinorVersion;

  return `possibly v${major}.${possibleNextNextMinorVersion}.0`; // No release candidate tag found, possibly on develop branch
}

function getNextVersion(_version, type) {
  // Implement your logic to get the next version based on 'type' (MAJOR, MINOR, or PATCH)
  // For simplicity, let's assume version is a string representing a number (e.g., "1")
  const version = parseInt(_version, 10);

  if (type === 'MAJOR') {
    return (version + 1).toString();
  } else if (type === 'MINOR') {
    return (version + 1).toString();
  } else if (type === 'PATCH') {
    return (version + 1).toString();
  }

  return version.toString();
}

function findEarliestReleaseTag(releaseTags) {
  return releaseTags.reduce((earliest, current) => {
    return earliest.localeCompare(current) < 0 ? earliest : current;
  });
}

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access app at http://localhost:3000`);
});
