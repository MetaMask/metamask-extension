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
  PreferencesController: {
    frequentRpcListDetail: [
      // {
      //   rpcUrl: 'http://localhost:8545',
      //   chainId: '0x539',
      //   ticker: 'ETH',
      //   nickname: 'Localhost 8545',
      //   rpcPrefs: {},
      // },
      {
        nickname: 'Leucine100',
        labelKey: 'leucine100',
        rpcUrl: 'https://leucine0.node.alphacarbon.network',
        chainId: `0x${(31337).toString(16)}`,
        ticker: 'TACT',
        rpcPrefs: {
          blockExplorerUrl: 'https://leucine0.blockscout.alphacarbon.network/',
        },
        viewOnly: true,
      },
      {
        nickname: 'Leucine101',
        labelKey: 'leucine101',
        rpcUrl: 'https://leucine1.node.alphacarbon.network',
        chainId: `0x${(31338).toString(16)}`,
        ticker: 'TACT',
        rpcPrefs: {
          blockExplorerUrl: 'https://leucine1.blockscout.alphacarbon.network/',
        },
        viewOnly: true,
      },
    ],
  },
};

export default initialState;
