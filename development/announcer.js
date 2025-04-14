const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

const changelog = fs.readFileSync(
  path.join(__dirname, '..', 'CHANGELOG.md'),
  'utf8',
);

const log = changelog.split(version)[1].split('##')[0].trim();
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
// eslint-disable-next-line id-denylist
const msg = `*MetaMask ${version}* now published! It should auto-update soon!\n${log}`;

console.log(msg);
