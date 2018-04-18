// test and development environment variables
const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = process.env.METAMASK_DEBUG

/**
 * @typedef {Object} FirstTimeState
 * @property {Object} config Initial configuration parameters
 * @property {Object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const initialState = {
  config: {},
  NetworkController: {
    provider: {
      type: (METAMASK_DEBUG || env === 'test') ? 'rinkeby' : 'mainnet',
    },
  },
}

module.exports = initialState
