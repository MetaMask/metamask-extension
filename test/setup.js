require('@babel/register');
require('ts-node').register({ transpileOnly: true });

require('./helpers/setup-helper');

const { globalSetup, globalTeardown } = require('./e2e-global-setup');

global.platform = {
  // Required for: coin overviews components
  openTab: () => undefined,
  // Required for: settings info tab
  getVersion: () => '<version>',
};


before(async function () {
  this.timeout(15000);
  await globalSetup();
});


after(async function () {
  await globalTeardown();
});