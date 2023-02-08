#!/usr/bin/env node
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const rebaseLatestCmd = (branch) => {
  return `git checkout ${branch} && git fetch origin && git rebase origin/${branch}`;
};

const generateDiffLogObjs = (logs) => {
  return logs.split('\n').map((line) => {
    const spaceSplit = line.split(' ');
    const hash = spaceSplit[0];
    const identifier = spaceSplit[spaceSplit.length - 1];
    const message = spaceSplit?.splice(1, spaceSplit.length - 2)?.join(' ');

    return {
      hash,
      identifier,
      message,
    };
  });
};

const printForPaste = (logs) => {
  const getPrLink = (identifier) => {
    const pullRequestNo = identifier?.split('#')[1]?.split(')')[0];
    return `https://github.com/MetaMask/metamask-extension/pull/${
      pullRequestNo || ''
    }`;
  };
  logs.forEach((log) => {
    console.log(
      `${log.hash} ${log.message} ${log.identifier}, ${getPrLink(
        log.identifier,
      )}`,
    );
  });
};

async function syncBranches() {
  await exec(rebaseLatestCmd('master'));
  await exec(rebaseLatestCmd('develop'));
  if (process.argv.length === 3) {
    await exec(rebaseLatestCmd(`Version-v${process.argv[2]}`));
  }
}

async function getLogs() {
  await syncBranches();

  const { stdout: developMasterDiff } = await exec(
    'git log master..develop --oneline --no-merges',
  );
  const developMasterDiffLogObjs = generateDiffLogObjs(developMasterDiff);

  if (process.argv.length < 3) {
    return printForPaste(developMasterDiffLogObjs);
  }

  const { stdout: developLatestRcDiff } = await exec(
    `git log Version-v${process.argv[2]}..develop --oneline --no-merges`,
  );

  return printForPaste(generateDiffLogObjs(developLatestRcDiff));
}

getLogs();
