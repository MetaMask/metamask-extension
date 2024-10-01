import { NetworkType } from '@metamask/controller-utils';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_RPC_URL_MAP,
  LINEA_SEPOLIA_DISPLAY_NAME,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
} from '../../../shared/constants/network';
import { migrate, version } from './121';

const oldVersion = 120;

const ethereumProviderConfig = {
  chainId: '0x1',
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
  },
  ticker: 'ETH',
  type: 'mainnet',
};

const ethereumNetworksMetadata = {
  mainnet: {
    EIPS: {
      '1559': true,
    },
    status: 'available',
  },
};
const ethereumOldState = {
  CurrencyController: {
    currencyRates: {
      ETH: {
        conversionDate: 1708532473.416,
        conversionRate: 2918.02,
        usdConversionRate: 2918.02,
      },
      GoerliETH: {
        conversionDate: 1708532466.732,
        conversionRate: 2918.02,
        usdConversionRate: 2918.02,
      },
    },
    currentCurrency: 'usd',
  },
  NetworkController: {
    networkConfigurations: {},
    networksMetadata: ethereumNetworksMetadata,
    providerConfig: ethereumProviderConfig,
    selectedNetworkClientId: 'mainnet',
  },
};

const lineaGoerliState = {
  NetworkController: {
    networkConfigurations: {},
    networksMetadata: {
      'linea-goerli': {
        EIPS: {
          '1559': true,
        },
        status: 'available',
      },
    },
    providerConfig: {
      chainId: CHAIN_IDS.LINEA_GOERLI,
      rpcPrefs: {},
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_GOERLI],
      type: NETWORK_TYPES.LINEA_GOERLI,
    },
    selectedNetworkClientId: NETWORK_TYPES.LINEA_GOERLI,
  },
};

describe('migration #121', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if no preferences state', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('should return state if chainId is not linea-goerli', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: ethereumOldState,
    });

    expect(transformedState.data).toEqual(ethereumOldState);
  });

  it('should return state if there is no NetworkController in state', async () => {
    const { NetworkController, ...state } = ethereumOldState;
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: state,
    });

    expect(transformedState.data).toEqual(state);
  });

  it('should return state if there is no provider in NetworkController', async () => {
    const state = {
      ...ethereumOldState,
      NetworkController: {},
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: state,
    });

    expect(transformedState.data).toEqual(state);
  });

  it('should return state if there is no chainId in provider in NetworkController', async () => {
    const state = {
      ...ethereumOldState,
      NetworkController: {
        providerConfig: {},
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: state,
    });

    expect(transformedState.data).toEqual(state);
  });

  it('should return state if chainId is not linea-goerli', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: ethereumOldState,
    });

    expect(transformedState.data).toEqual(ethereumOldState);
  });

  it('should update NetworkController to Linea Sepolia if chainId is on Linea Goerli', async () => {
    const expectedNetworkControllerState = {
      networkConfigurations: {},
      networksMetadata: {
        'linea-sepolia': {
          EIPS: {
            '1559': true,
          },
          status: 'available',
        },
        'linea-goerli': {
          EIPS: {
            '1559': true,
          },
          status: 'available',
        },
      },
      providerConfig: {
        type: NetworkType['linea-sepolia'],
        rpcPrefs: {},
        chainId: CHAIN_IDS.LINEA_SEPOLIA,
        nickname: LINEA_SEPOLIA_DISPLAY_NAME,
        rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.LINEA_SEPOLIA],
        providerType: NETWORK_TYPES.LINEA_SEPOLIA,
        ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
        id: NETWORK_TYPES.LINEA_SEPOLIA,
      },
      selectedNetworkClientId: 'linea-sepolia',
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: lineaGoerliState,
    });

    expect(transformedState.data).toEqual({
      NetworkController: expectedNetworkControllerState,
    });
  });
});
