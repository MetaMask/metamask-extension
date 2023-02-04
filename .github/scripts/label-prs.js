async function runLabelPRsAutomation(context, github) {
  let issueNumber = getIssueNumberFromPullRequestBody(context);

  if (issueNumber === -1) {
    bailIfIsBranchNameInvalid(process.env.HEAD_REF);
    bailIfIsNotFeatureBranch();
    issueNumber = getIssueNumberFromBranchName(process.env.HEAD_REF);
  }

  await updateLabels(context, github, issueNumber);
}

function getIssueNumberFromPullRequestBody(context) {
  console.log("Checking if the PR's body references an issue...");

  let ISSUE_LINK_IN_PR_DESCRIPTION_REGEX =
    /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s#\d+/gi;

  const prBody = context.payload.pull_request.body;

  let matches = prBody.match(ISSUE_LINK_IN_PR_DESCRIPTION_REGEX);
  if (matches.length === 0) {
    console.log(
      'No direct link can be drawn between the PR and an issue from the PR body because no issue number was referenced.',
    );
    return -1;
  }

  if (matches.length > 1) {
    console.log(
      'No direct link can be drawn between the PR and an issue from the PR body because more than one issue number was referenced.',
    );
    return -1;
  }

  ISSUE_NUMBER_REGEX = /\d+/;
  const issueNumber = matches[0].match(ISSUE_NUMBER_REGEX)[0];

  console.log(`Found issue number ${issueNumber} in PR body.`);

  return issueNumber;
}

function bailIfIsBranchNameInvalid(branchName) {
  const BRANCH_REGEX =
    /^(main|develop|(ci|chore|docs|feat|feature|fix|perf|refactor|revert|style)\/\d*(?:[-](?![-])\w*)*|Version-v\d+\.\d+\.\d+)$/;
  const isValidBranchName = new RegExp(BRANCH_REGEX).test(branchName);

  if (!isValidBranchName) {
    console.log('This branch name does not follow the convention.');
    console.log(
      'Here are some example branch names that are accepted: "fix/123-description", "feat/123-longer-description", "feature/123", "main", "develop", "Version-v10.24.2".',
    );
    console.log(
      'No issue could be linked to this PR, so no labels were copied',
    );

    process.exit(0);
  }
}

function bailIfIsNotFeatureBranch() {
  if (
    process.env.HEAD_REF === 'main' ||
    process.env.HEAD_REF === 'develop' ||
    process.env.HEAD_REF.startsWith('Version-v')
  ) {
    console.log(`${process.env.HEAD_REF} is not a feature branch.`);
    console.log(
      'No issue could be linked to this PR, so no labels were copied',
    );
    process.exit(0);
  }
}

async function updateLabels(context, github, issueNumber) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const issue = await github.request(
    `GET /repos/${owner}/${repo}/issues/${issueNumber}`,
    { owner, repo, issue_number: issueNumber },
  );

  const issueLabels = issue.data.labels.map((label) => label.name);

  const prNumber = context.payload.number;

  const pr = await github.request(
    `GET /repos/${owner}/${repo}/issues/${prNumber}`,
    {
      owner,
      repo,
      issue_number: issueNumber,
    },
  );

  const startingPRLabels = pr.data.labels.map((label) => label.name);

  const dedupedFinalPRLabels = [
    ...new Set([...startingPRLabels, ...issueLabels]),
  ];

  const hasIssueAdditionalLabels = !sortedArrayEqual(
    startingPRLabels,
    dedupedFinalPRLabels,
  );
  if (hasIssueAdditionalLabels) {
    await github.request(`PATCH /repos/${owner}/${repo}/issues/${prNumber}`, {
      owner,
      repo,
      issue_number: prNumber,
      labels: dedupedFinalPRLabels,
    });
  }
}

function getIssueNumberFromBranchName(branchName) {
  console.log('Checking if the branch name references an issue...');

  let issueNumber;
  if (branchName.split('/').length > 1) {
    issueNumber = branchName.split('/')[1].split('-')[0];
  } else {
    issueNumber = branchName.split('-')[0];
  }

  console.log(`Found issue number ${issueNumber} in branch name.`);

  return issueNumber;
}

function sortedArrayEqual(array1, array2) {
  const lengthsAreEqual = array1.length === array2.length;
  const everyElementMatchesByIndex = array1.every(
    (value, index) => value === array2[index],
  );

  return lengthsAreEqual && everyElementMatchesByIndex;
}

module.exports = { runLabelPRsAutomation };
