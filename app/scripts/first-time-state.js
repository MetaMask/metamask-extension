/**
 * @typedef {object} FirstTimeState
 * @property {object} config Initial configuration parameters
 * @property {object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const initialState = {
  config: {},
  NetworkController: {
    networkConfigurations: {
      uuid: {
        rpcUrl: 'http://localhost:8545',
        chainId: '0x539',
        ticker: 'ETH',
        chainName: 'Localhost 8545',
        rpcPrefs: {},
      },
    },
  },
};
export default initialState;
