import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../test/stub/networks';
import AddFundsModal from './add-funds-modal';

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock(
  '../../../../hooks/ramps/useRampsNavigation/useRampsNavigation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({ goToBuy: mockGoToBuy }),
  }),
);

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

describe('Add funds modal Component', () => {
  const defaultState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      selectedAccountGroup: null,
      accountTree: {
        wallets: {},
      },
      enabledNetworkMap: {
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
        },
      },
      internalAccounts: mockState.metamask.internalAccounts,
    },
  };

  const mockStore = configureMockStore()(defaultState);

  beforeEach(() => jest.clearAllMocks());

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <AddFundsModal
        onClose={jest.fn()}
        token={{
          address: '0x0',
          decimals: 18,
          symbol: 'USDC',
          conversionRate: {
            usd: '1',
          },
        }}
        chainId="0x1"
        payerAddress="0x0"
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('routes the Buy row through useRampsNavigation.goToBuy', () => {
    const { getByTestId } = renderWithProvider(
      <AddFundsModal
        onClose={jest.fn()}
        token={{
          address: '0x0',
          decimals: 18,
          symbol: 'USDC',
          conversionRate: { usd: '1' },
        }}
        chainId="0x1"
        payerAddress="0x0"
      />,
      mockStore,
    );

    fireEvent.click(getByTestId('add-funds-modal-buy-crypto-button'));
    expect(mockGoToBuy).toHaveBeenCalledWith();
  });

  it('does not track or close when the ramps gate blocks the buy', async () => {
    mockGoToBuy.mockResolvedValueOnce(false);
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <AddFundsModal
        onClose={onClose}
        token={{
          address: '0x0',
          decimals: 18,
          symbol: 'USDC',
          conversionRate: { usd: '1' },
        }}
        chainId="0x1"
        payerAddress="0x0"
      />,
      mockStore,
    );

    fireEvent.click(getByTestId('add-funds-modal-buy-crypto-button'));
    await waitFor(() => expect(mockGoToBuy).toHaveBeenCalled());
    expect(mockTrackEvent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
