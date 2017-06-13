// test and development environment variables
const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

//
// The default state of MetaMask
//
module.exports = {
  config: {},
  NetworkController: {
    provider: {
      type: (METAMASK_DEBUG || env === 'test') ? 'rinkeby' : 'mainnet',
    },
  },
}
