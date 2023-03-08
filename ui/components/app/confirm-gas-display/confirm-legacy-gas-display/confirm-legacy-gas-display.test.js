import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import ConfirmLegacyGasDisplay from './confirm-legacy-gas-display';

const render = ({ contextProps } = {}) => {
  const store = configureStore({
    ...mockState,
    ...contextProps,
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      unapprovedTxs: {
        8393540981007587: {
          ...mockState.metamask.unapprovedTxs[8393540981007587],
          txParams: {
            from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            value: '0x0',
            gas: '0x5208',
            gasPrice: '0x3b9aca00',
            type: '0x0',
          },
        },
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
    confirmTransaction: {
      txData: {
        id: 8393540981007587,
        status: 'unapproved',
        chainId: '0x5',
        txParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          value: '0x0',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          type: '0x0',
        },
      },
    },
  });

  return renderWithProvider(<ConfirmLegacyGasDisplay />, store);
};

describe('ConfirmLegacyGasDisplay', () => {
  it('should render label', async () => {
    render();
    await waitFor(() => {
      expect(screen.queryByText('Estimated gas fee')).toBeInTheDocument();
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details', async () => {
    render();
    await waitFor(() => {
      expect(screen.queryAllByTitle('0.000021 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });
  it('should render label and gas details with draftTransaction', async () => {
    render({
      send: {
        currentTransactionUUID: '1d40b578-6184-4607-8513-762c24d0a19b',
        draftTransactions: {
          '1d40b578-6184-4607-8513-762c24d0a19b': {
            gas: {
              error: null,
              gasLimit: '0x5208',
              gasPrice: '0x3b9aca00',
              gasTotal: '0x157c9fbb9a000',
              maxFeePerGas: '0x0',
              maxPriorityFeePerGas: '0x0',
              wasManuallyEdited: false,
            },
          },
        },
      },
    });
    await waitFor(() => {
      expect(screen.queryByText('Estimated gas fee')).toBeInTheDocument();
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByTitle('0.000021 ETH').length).toBeGreaterThan(0);
    });
  });
});
