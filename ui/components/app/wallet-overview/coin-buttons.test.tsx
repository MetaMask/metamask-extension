import React from 'react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ARC_ERC20_USDC_BRIDGE_ASSET } from '../assets/enablement/arc';
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

jest.mock('../perps/perps-trade-buttons', () => ({
  PerpsTradeButtons: ({
    marketSymbol,
    classPrefix,
  }: {
    marketSymbol: string;
    classPrefix: string;
  }) => (
    <div
      data-testid="perps-trade-buttons"
      data-market={marketSymbol}
      data-prefix={classPrefix}
    />
  ),
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

  const renderAssetPageCoinButtons = (
    chainId: string,
    props: Partial<React.ComponentProps<typeof CoinButtons>> = {},
  ) =>
    renderWithProvider(
      <CoinButtons
        account={mockAccount as Parameters<typeof CoinButtons>[0]['account']}
        chainId={chainId as Parameters<typeof CoinButtons>[0]['chainId']}
        trackingLocation="asset-page"
        isSwapsChain
        isSigningEnabled
        {...props}
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

  it('uses the Arc ERC20 USDC wrapper for the asset page native swap button', () => {
    renderAssetPageCoinButtons('0x13b2');

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: {
        symbol: ARC_ERC20_USDC_BRIDGE_ASSET.symbol,
        address: ARC_ERC20_USDC_BRIDGE_ASSET.address,
        chainId: 'eip155:5042',
        decimals: ARC_ERC20_USDC_BRIDGE_ASSET.decimals,
        name: ARC_ERC20_USDC_BRIDGE_ASSET.name,
      },
    });
  });

  it('passes no token when the chain cannot open a swap', () => {
    renderAssetPageCoinButtons('0x539');

    expect(useBalanceAwareSwapDefaults).toHaveBeenCalledWith({
      currentToken: null,
    });
  });

  it('renders the Perps row for a matching native market', () => {
    renderAssetPageCoinButtons('0x1', {
      perpsMarketSymbol: 'ETH',
      hasBalance: true,
    });

    expect(screen.getByTestId('perps-trade-buttons')).toHaveAttribute(
      'data-market',
      'ETH',
    );
    expect(screen.getByTestId('coin-overview-send')).toBeInTheDocument();
    expect(screen.getByTestId('coin-overview-more')).toBeInTheDocument();
    expect(screen.queryByTestId('coin-overview-buy')).not.toBeInTheDocument();
    expect(screen.queryByTestId('coin-overview-swap')).not.toBeInTheDocument();
  });

  it('renders Receive instead of Send for a zero-balance native Perps asset', () => {
    renderAssetPageCoinButtons('0x1', {
      perpsMarketSymbol: 'ETH',
      hasBalance: false,
    });

    expect(screen.getByTestId('coin-overview-receive')).toBeInTheDocument();
    expect(screen.queryByTestId('coin-overview-send')).not.toBeInTheDocument();
  });

  it('keeps Receive out of More when it already occupies the Perps action row', () => {
    renderAssetPageCoinButtons('0x1', {
      perpsMarketSymbol: 'ETH',
      hasBalance: false,
    });

    fireEvent.click(screen.getByTestId('coin-overview-more'));

    expect(screen.getAllByTestId('coin-overview-receive')).toHaveLength(1);
    expect(
      screen.queryByTestId('coin-overview-more-receive'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('coin-overview-more-buy')).toBeInTheDocument();
  });

  it('keeps Receive in More when Send occupies the Perps action row', () => {
    renderAssetPageCoinButtons('0x1', {
      perpsMarketSymbol: 'ETH',
      hasBalance: true,
    });

    fireEvent.click(screen.getByTestId('coin-overview-more'));

    expect(
      screen.getByTestId('coin-overview-more-receive'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('coin-overview-receive'),
    ).not.toBeInTheDocument();
  });

  it('keeps Send for zero balance when the standard row is rendered', () => {
    renderAssetPageCoinButtons('0x1', { hasBalance: false });

    expect(screen.getByTestId('coin-overview-send')).toBeInTheDocument();
    expect(
      screen.queryByTestId('coin-overview-receive'),
    ).not.toBeInTheDocument();
  });
});
