import { NETWORK_TYPE_RPC } from '../../shared/constants/network';

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
      type: NETWORK_TYPE_RPC,
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
    },
  },
};

export default initialState;
