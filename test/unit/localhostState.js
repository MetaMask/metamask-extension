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
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
    },
  },
}

export default initialState
