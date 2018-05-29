// test and development environment variables
const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const { DEFAULT_NETWORK, MAINNET } = require('./controllers/network/enums')

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
      type: (METAMASK_DEBUG || env === 'test') ? DEFAULT_NETWORK : MAINNET,
    },
  },
}

module.exports = initialState
