require('@babel/register');

require('./helpers/setup-helper');

global.platform = {
  // Required for: coin overviews components
  openTab: () => undefined,
  // Required for: settings info tab
  getVersion: () => '<version>',
};

global.browser = {
  permissions: {
    request: jest.fn().mockResolvedValue(true),
  },
};
