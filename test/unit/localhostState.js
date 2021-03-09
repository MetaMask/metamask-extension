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
      rpcTarget: 'http://localhost:12537',
      chainId: '2999',
      networkId: 2999,
    },
  },
}

export default initialState
