import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';

import { renderWithProvider } from '../../../../test/jest/rendering';

import { KeyringType } from '../../../../shared/constants/keyring';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SelectActionModal } from '.';

// Mock BUYABLE_CHAINS_MAP
jest.mock('../../../../shared/constants/network', () => ({
  ...jest.requireActual('../../../../shared/constants/network'),
  BUYABLE_CHAINS_MAP: {
    // MAINNET
    '0x1': {
      nativeCurrency: 'ETH',
      network: 'ethereum',
    },
    // POLYGON
    '0x89': {
      nativeCurrency: 'MATIC',
      network: 'polygon',
    },
  },
}));
let openTabSpy;

describe('Select Action Modal', () => {
  beforeAll(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
    openTabSpy = jest.spyOn(global.platform, 'openTab');
  });

  beforeEach(() => {
    openTabSpy.mockClear();
  });

  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: CHAIN_IDS.MAINNET,
      },
      cachedBalances: {
        '0x1': {
          '0x1': '0x1F4',
        },
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      useCurrencyRateCheck: true,
      conversionRate: 2,
      identities: {
        '0x1': {
          address: '0x1',
        },
      },
      accounts: {
        '0x1': {
          address: '0x1',
          balance: '0x1F4',
        },
      },
      selectedAddress: '0x1',
      keyrings: [
        {
          type: KeyringType.imported,
          accounts: ['0x1', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
      contractExchangeRates: {},
    },
  };
  const store = configureMockStore([thunk])(mockState);

  it('should render correctly', () => {
    const { getByTestId } = renderWithProvider(<SelectActionModal />, store);

    expect(getByTestId('select-action-modal')).toBeDefined();
  });

  it('should have the Buy native token enabled if chain id is part of supported buyable chains', () => {
    const mockedStoreWithBuyableChainId = {
      metamask: {
        ...mockStore.metamask,
        providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
      },
    };
    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithBuyableChainId,
    );

    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    expect(queryByText('Buy')).toBeInTheDocument();
  });

  it('should open the Buy native token URI when clicking on Buy button for a buyable chain ID', async () => {
    const mockedStoreWithBuyableChainId = {
      metamask: {
        ...mockStore.metamask,
        providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
      },
    };
    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithBuyableChainId,
    );
    const onClose = jest.fn();

    const { queryByText } = renderWithProvider(
      <SelectActionModal onClose={onClose} />,
      mockedStore,
    );
    const buyButton = queryByText('Buy');
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).not.toBeDisabled();

    fireEvent.click(buyButton);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining(`/buy?metamaskEntry=ext_buy_button`),
      }),
    );
  });

  it('should not have the Buy native token button if chain id is not part of supported buyable chains', () => {
    const mockedStoreWithUnbuyableChainId = {
      metamask: {
        ...mockStore.metamask,
        providerConfig: { type: 'test', chainId: CHAIN_IDS.FANTOM },
      },
    };
    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithUnbuyableChainId,
    );

    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    const buyButton = queryByText('Buy');
    expect(buyButton).not.toBeInTheDocument();
  });
  it('should have the Bridge button if chain id is a part of supported chains', () => {
    const mockedAvalancheStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        providerConfig: {
          ...mockStore.metamask.providerConfig,
          chainId: '0xa86a',
        },
      },
    };
    const mockedStore = configureMockStore([thunk])(mockedAvalancheStore);
    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    const bridgeButton = queryByText('Bridge');
    expect(bridgeButton).toBeInTheDocument();
  });
  it('should open the Bridge URI when clicking on Bridge button on supported network', async () => {
    const onClose = jest.fn();
    const mockedAvalancheStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        providerConfig: {
          ...mockStore.metamask.providerConfig,
          chainId: '0xa86a',
        },
      },
    };
    const mockedStore = configureMockStore([thunk])(mockedAvalancheStore);
    const { queryByText } = renderWithProvider(
      <SelectActionModal onClose={onClose} />,
      mockedStore,
    );

    const bridgeButton = queryByText('Bridge');
    expect(bridgeButton).toBeInTheDocument();

    fireEvent.click(bridgeButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining('/bridge?metamaskEntry=ext_bridge_button'),
      }),
    );
  });
  it('should not have the Bridge button if chain id is not part of supported chains', () => {
    const mockedFantomStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        providerConfig: {
          ...mockStore.metamask.providerConfig,
          chainId: '0xfa',
        },
      },
    };
    const mockedStore = configureMockStore([thunk])(mockedFantomStore);

    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    const buyButton = queryByText('Bridge');
    expect(buyButton).not.toBeInTheDocument();
  });
  it('should have the Swap button if chain id is part of supported buyable chains', () => {
    const mockedStoreWithSwapableChainId = {
      metamask: {
        ...mockStore.metamask,
        providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
      },
    };
    const mockedStore = configureMockStore([thunk])(
      mockedStoreWithSwapableChainId,
    );

    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    expect(queryByText('Swap')).toBeInTheDocument();
  });
  it('should have the Send button if chain id is part of supported buyable chains', () => {
    const mockedStoreWithSendChainId = {
      metamask: {
        ...mockStore.metamask,
        providerConfig: { type: 'test', chainId: CHAIN_IDS.POLYGON },
      },
    };
    const mockedStore = configureMockStore([thunk])(mockedStoreWithSendChainId);

    const { queryByText } = renderWithProvider(
      <SelectActionModal />,
      mockedStore,
    );
    expect(queryByText('Send')).toBeInTheDocument();
  });
});
