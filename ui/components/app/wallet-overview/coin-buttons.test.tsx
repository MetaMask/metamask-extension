import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import CoinButtons from './coin-buttons';

jest.mock('@metamask/design-system-react', () => ({
  ...jest.requireActual('@metamask/design-system-react'),
  usePureBlack: jest.fn(() => false),
}));

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

const renderCoinButtons = (batchSellEnabled = true) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      featureFlags: {
        ...((mockState.metamask as Record<string, unknown>).featureFlags ?? {}),
        batchSellEnabled,
      },
    },
  };
  const store = configureStore(state);

  return renderWithProvider(
    <CoinButtons
      account={mockAccount as Parameters<typeof CoinButtons>[0]['account']}
      chainId="0x1"
      trackingLocation="home"
      isSwapsChain={false}
      isSigningEnabled
    />,
    store,
    '/',
  );
};

describe('CoinButtons – MoreButtonsGroup pure black dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { usePureBlack } = jest.requireMock('@metamask/design-system-react');
    usePureBlack.mockReturnValue(false);
  });

  it('uses bg-background-default for the dropdown in normal mode', async () => {
    const { getByTestId, container } = renderCoinButtons();
    fireEvent.click(getByTestId('coin-overview-more'));

    await waitFor(() => {
      const dropdown = container.querySelector('.bg-background-default');
      expect(dropdown).toBeInTheDocument();
    });
  });

  it('uses bg-background-alternative for the dropdown in pure black mode', async () => {
    const { usePureBlack } = jest.requireMock('@metamask/design-system-react');
    usePureBlack.mockReturnValue(true);

    const { getByTestId, container } = renderCoinButtons();
    fireEvent.click(getByTestId('coin-overview-more'));

    await waitFor(() => {
      const dropdown = container.querySelector('.bg-background-alternative');
      expect(dropdown).toBeInTheDocument();
    });
  });
});
