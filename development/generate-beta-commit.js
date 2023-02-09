const { promisify } = require('util');
const { promises: fs } = require('fs');
const exec = promisify(require('child_process').exec);
const VERSION = require('../package.json').version;

start().catch(console.error);

async function start() {
  let betaVersion;
  if (VERSION.includes('beta')) {
    // Remove auto generated stableVersion to achieve bump
    // You can find the issue here: https://github.com/yarnpkg/berry/issues/4328
    const packageJsonData = JSON.parse(
      await fs.readFile('package.json', 'utf8'),
    );
    delete packageJsonData.stableVersion;
    await fs.writeFile(
      'package.json',
      JSON.stringify(packageJsonData, null, 2),
    );
    // generate next valid beta version
    const splitVersion = VERSION.split('-beta.');
    const currentBetaVersion = Number(splitVersion[1]) + 1;
    betaVersion = `${splitVersion[0]}-beta.${currentBetaVersion}`;
    // bump existing beta version to next +1 one
    await exec(`yarn version ${betaVersion}`);
  } else {
    betaVersion = `${VERSION}-beta.0`;
    // change package.json version to beta-0
    await exec(`yarn version ${betaVersion}`);
  }
  // Generate a beta commit message and push changes to github
  // Later on this will be picked up by CircleCI with the format of Version vx.x.x-beta.x
  await exec(
    `git add . && git commit -m "Version v${betaVersion}" && git push`,
  );
}
