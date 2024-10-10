require('@babel/register');

require('./helpers/setup-helper');

global.platform = {
  // Required for: coin overviews components
  openTab: () => undefined,
  // Required for: settings info tab
  getVersion: () => '<version>',
  // Allow TypeScript to be used in Mocha
  require: ['tsx/esm'],
  'node-option': ['import=tsx'],
};
