import { cloneDeep, noop } from 'lodash';

import { NETWORK_TYPES } from '../../shared/constants/network';
import mockEncryptor from '../lib/mock-encryptor';

const NOTIFICATION_ID = 'NHL8f2eSSTn9TKBamRLiU';

const ALT_MAINNET_RPC_URL = 'http://localhost:8545';
const POLYGON_RPC_URL = 'https://polygon.llamarpc.com';
const POLYGON_RPC_URL_2 = 'https://polygon-rpc.com';

const NETWORK_CONFIGURATION_ID_1 = 'networkConfigurationId1';
const NETWORK_CONFIGURATION_ID_2 = 'networkConfigurationId2';
const NETWORK_CONFIGURATION_ID_3 = 'networkConfigurationId3';

const ALT_MAINNET_NAME = 'Alt Mainnet';
const ALT_POLYGON_NAME = 'Alt Polygon';
const POLYGON_NAME = 'Polygon';

const ETH = 'ETH';
const MATIC = 'MATIC';

const POLYGON_CHAIN_ID = '0x89';
const MAINNET_CHAIN_ID = '0x1';

export const FIRST_TIME_CONTROLLER_STATE = {
  config: {},
  NetworkController: {
    providerConfig: {
      type: NETWORK_TYPES.RPC,
      rpcUrl: ALT_MAINNET_RPC_URL,
      chainId: MAINNET_CHAIN_ID,
      ticker: ETH,
      nickname: ALT_MAINNET_NAME,
      id: NETWORK_CONFIGURATION_ID_1,
    },
    networkConfigurations: {
      [NETWORK_CONFIGURATION_ID_1]: {
        rpcUrl: ALT_MAINNET_RPC_URL,
        type: NETWORK_TYPES.RPC,
        chainId: MAINNET_CHAIN_ID,
        ticker: ETH,
        nickname: ALT_MAINNET_NAME,
        id: NETWORK_CONFIGURATION_ID_1,
      },
      [NETWORK_CONFIGURATION_ID_2]: {
        rpcUrl: POLYGON_RPC_URL,
        type: NETWORK_TYPES.RPC,
        chainId: POLYGON_CHAIN_ID,
        ticker: MATIC,
        nickname: POLYGON_NAME,
        id: NETWORK_CONFIGURATION_ID_2,
      },
      [NETWORK_CONFIGURATION_ID_3]: {
        rpcUrl: POLYGON_RPC_URL_2,
        type: NETWORK_TYPES.RPC,
        chainId: POLYGON_CHAIN_ID,
        ticker: MATIC,
        nickname: ALT_POLYGON_NAME,
        id: NETWORK_CONFIGURATION_ID_1,
      },
    },
    networkDetails: {
      EIPS: {
        1559: false,
      },
    },
  },
  NotificationController: {
    notifications: {
      [NOTIFICATION_ID]: {
        id: NOTIFICATION_ID,
        origin: 'local:http://localhost:8086/',
        createdDate: 1652967897732,
        readDate: null,
        message: 'Hello, http://localhost:8086!',
      },
    },
  },
};

const MOCK_TOKEN_BALANCE = '888';
const INFURA_PROJECT_ID = 'foo';

export const MockEthContract = () => () => {
  return {
    at: () => {
      return {
        balanceOf: () => MOCK_TOKEN_BALANCE,
      };
    },
  };
};

export const browserPolyfillMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: () => undefined,
    },
    onMessageExternal: {
      addListener: () => undefined,
    },
    getPlatformInfo: async () => 'mac',
  },
  storage: {
    session: {
      set: jest.fn(),
      get: jest.fn(),
    },
  },
};

export function metamaskControllerArgumentConstructor({
  isFirstMetaMaskControllerSetup = false,
} = {}) {
  return {
    showUserConfirmation: noop,
    encryptor: mockEncryptor,
    initState: cloneDeep(FIRST_TIME_CONTROLLER_STATE),
    initLangCode: 'en_US',
    platform: {
      showTransactionNotification: () => undefined,
      getVersion: () => 'foo',
    },
    browser: browserPolyfillMock,
    infuraProjectId: INFURA_PROJECT_ID,
    isFirstMetaMaskControllerSetup,
  };
}
