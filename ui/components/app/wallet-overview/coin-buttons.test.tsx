import React from 'react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ARC_USDC_TOKEN_ADDRESS,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import CoinButtons from './coin-buttons';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    goToBuy: jest.fn(),
    isRampsEnabled: false,
  })),
}));

jest.mock('../../../hooks/bridge/useBridging', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    openBridgeExperience: jest.fn(),
  })),
}));

jest.mock('../../../pages/asset/hooks/useBalanceAwareSwapDefaults', () => ({
  useBalanceAwareSwapDefaults: jest.fn(() => ({
    sourceToken: {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      chainId: '0x1',
      decimals: 18,
      name: 'Ether',
    },
  })),
}));

jest.mock('../../../hooks/batch-sell/useBatchSell', () => ({
  useBatchSell: jest.fn(() => ({
    openBatchSellExperience: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn((selector) => {
    if (selector.name === 'getMultichainNetwork') {
      // CHAIN_IDS.MAINNET = '0x1'
      return { isEvmNetwork: true, chainId: '0x1' };
    }
    return 'ETH';
  }),
}));

jest.mock('../../../selectors/multichain', () => ({
  getMultichainNativeCurrency: jest.fn(),
  getMultichainNetwork: jest.fn(),
}));

jest.mock('../../../selectors/batch-sell/feature-flags', () => ({
  getIsBatchSellEnabled: jest.fn(() => true),
}));

jest.mock(
  '../../../../shared/lib/multichain-accounts/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../shared/lib/multichain-accounts/remote-feature-flag',
    ),
    isMultichainAccountsFeatureEnabled: () => false,
  }),
);

jest.mock('../../../store/actions', () => ({
  setActiveNetworkWithError: jest.fn(),
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

const mockAccount = {
  address: '0x0000000000000000000000000000000000000001',
  id: 'mock-account-id',
  metadata: { name: 'Test Account', keyring: { type: 'HD Key Tree' } },
  options: {},
  methods: Object.values(EthMethod),
  type: EthAccountType.Eoa,
};

describe('CoinButtons – asset page swap token', () => {
  const { useBalanceAwareSwapDefaults } = jest.requireMock(
    '../../../pages/asset/hooks/useBalanceAwareSwapDefaults',
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAssetPageCoinButtons = (chainId: string) =>
    renderWithProvider(
      <CoinButtons
        account={mockAccount as Parameters<typeof CoinButtons>[0]['account']}
        chainId={chainId as Parameters<typeof CoinButtons>[0]['chainId']}
        trackingLocation="asset-page"
        isSwapsChain
        isSigningEnabled
      />,
      configureStore(mockState),
      '/',
    );

  it('describes the native token with a CAIP-2 chain id on a non-EVM chain', () => {
    renderAssetPageCoinButtons('bip122:000000000019d6689c085ae165831e93');

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: expect.objectContaining({
        symbol: 'BTC',
        decimals: 8,
        // The decimal chain id from `getNativeAssetForChainId` is not a chain
        // the bridge entry point accepts.
        chainId: 'bip122:000000000019d6689c085ae165831e93',
      }),
    });
  });

  it('describes the native token with a CAIP-2 chain id on an EVM chain', () => {
    renderAssetPageCoinButtons('0x1');

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: expect.objectContaining({
        symbol: 'ETH',
        chainId: 'eip155:1',
      }),
    });
  });

  it('uses ERC20 USDC as the Arc swap source token', () => {
    renderAssetPageCoinButtons(CHAIN_IDS.ARC);

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: expect.objectContaining({
        symbol: 'USDC',
        address: ARC_USDC_TOKEN_ADDRESS,
        chainId: 'eip155:5042',
        decimals: 6,
      }),
    });
  });

  it('passes no token when the chain cannot open a swap', () => {
    renderAssetPageCoinButtons('0x539');

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: null,
    });
  });
});
