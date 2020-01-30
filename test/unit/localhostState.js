
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
      type: 'rpc',
      rpcTarget: 'http://localhost:8545',
    },
  },
}

module.exports = initialState
