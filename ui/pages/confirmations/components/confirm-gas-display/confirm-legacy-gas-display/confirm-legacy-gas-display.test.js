import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';

import { getSelectedInternalAccountFromMockState } from '../../../../../../test/jest/mocks';
import ConfirmLegacyGasDisplay from './confirm-legacy-gas-display';

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

const mmState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    accounts: {
      [mockSelectedInternalAccount.address]: {
        address: mockSelectedInternalAccount.address,
        balance: '0x1F4',
      },
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
};

mmState.metamask.transactions[0].txParams = {
  from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
  value: '0x0',
  gas: '0x5208',
  gasPrice: '0x3b9aca00',
  type: '0x0',
};

const render = (state = mmState) => {
  const store = configureStore(state);

  return renderWithProvider(<ConfirmLegacyGasDisplay />, store);
};

describe('ConfirmLegacyGasDisplay', () => {
  it('should match snapshot', async () => {
    const { container } = render();
    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

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
      ...mmState,
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
            transactionType: '0x0',
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

  it('displays the Estimated Fee', () => {
    const { container } = render({
      ...mmState,
      confirmTransaction: {
        ...mmState.confirmTransaction,
        txData: {
          ...mmState.confirmTransaction.txData,
        },
      },
    });

    expect(
      container.querySelector('.currency-display-component__text'),
    ).toHaveTextContent('0.000021');
  });

  it('displays the Estimated Fee on L2 Networks', () => {
    const { container } = render({
      ...mmState,
      confirmTransaction: {
        ...mmState.confirmTransaction,
        txData: {
          ...mmState.confirmTransaction.txData,
          layer1GasFee: '0x0653b2c7980981',
        },
      },
    });

    expect(screen.queryByText('Estimated gas fee')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    expect(
      container.querySelector('.currency-display-component__text'),
    ).toHaveTextContent('0.00180188');
  });
});
