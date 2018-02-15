
// test and development environment variables
const { createTestProviderTools } = require('../stub/provider')
const providerResultStub = {}
const provider = createTestProviderTools({ scaffold: providerResultStub }).provider
//
// The default state of MetaMask
//
module.exports = {
  config: {},
  NetworkController: {
    provider,
  },
}
