import { NetworkType } from '@metamask/controller-utils';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_RPC_URL_MAP,
  NETWORK_TYPES,
  SEPOLIA_DISPLAY_NAME,
  TEST_NETWORK_TICKER_MAP,
} from '../../../shared/constants/network';
import { migrate, version } from './110';

const oldVersion = 109;

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

const goerliState = {
  NetworkController: {
    networkConfigurations: {},
    networksMetadata: {
      goerli: {
        EIPS: {
          '1559': true,
        },
        status: 'available',
      },
    },
    providerConfig: {
      chainId: '0x5',
      rpcPrefs: {},
      ticker: 'goerliETH',
      type: 'goerli',
    },
    selectedNetworkClientId: 'goerli',
  },
};

describe('migration #110', () => {
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

  it('Should return state if chainId is not goerli', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: ethereumOldState,
    });

    expect(transformedState.data).toEqual(ethereumOldState);
  });

  it('Should return state if there is no NetworkController in state', async () => {
    const { NetworkController, ...state } = ethereumOldState;
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: state,
    });

    expect(transformedState.data).toEqual(state);
  });

  it('Should return state if there is no provider in NetworkController', async () => {
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

  it('Should return state if there is no chainId in provider in NetworkController', async () => {
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

  it('Should return state if chainId is not goerli', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: ethereumOldState,
    });

    expect(transformedState.data).toEqual(ethereumOldState);
  });

  it('Should update NetworkController to Sepolia if chainId is on goerli', async () => {
    const expectedNetworkControllerState = {
      networkConfigurations: {},
      networksMetadata: {
        goerli: {
          EIPS: {
            '1559': true,
          },
          status: 'available',
        },
        sepolia: {
          EIPS: {
            '1559': true,
          },
          status: 'available',
        },
      },
      providerConfig: {
        type: NetworkType.sepolia,
        rpcPrefs: {},
        chainId: CHAIN_IDS.SEPOLIA,
        nickname: SEPOLIA_DISPLAY_NAME,
        rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.SEPOLIA],
        providerType: NETWORK_TYPES.SEPOLIA,
        ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
        id: NETWORK_TYPES.SEPOLIA,
        removable: false,
      },
      selectedNetworkClientId: 'sepolia',
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: goerliState,
    });

    expect(transformedState.data).toEqual({
      NetworkController: expectedNetworkControllerState,
    });
  });
});
