import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import mockState from '../../../../../../test/data/mock-state.json';
import { createPerpsWithdrawTransaction } from '../../../../../components/app/perps/hooks/createPerpsWithdrawTransaction';
import { getSelectedInternalAccount } from '../../../../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { PerpsWithdrawButton } from './perps-withdraw-button';

jest.mock(
  '../../../../../components/app/perps/hooks/createPerpsWithdrawTransaction',
  () => ({
    createPerpsWithdrawTransaction: jest.fn(),
  }),
);

jest.mock('../../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  ConfirmationLoader: {
    CustomAmount: 'customAmount',
  },
  useConfirmationNavigation: jest.fn(),
}));

const createPerpsWithdrawTransactionMock = jest.mocked(
  createPerpsWithdrawTransaction,
);
const getSelectedInternalAccountMock = jest.mocked(getSelectedInternalAccount);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TX_ID = 'withdraw-tx-id';

function createMockStore() {
  return {
    getState: () => mockState,
    subscribe: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  };
}

function renderButton() {
  return render(
    <Provider store={createMockStore() as never}>
      <PerpsWithdrawButton />
    </Provider>,
  );
}

describe('PerpsWithdrawButton', () => {
  const navigateToTransactionMock = jest.fn();
  const navigateToTransactionsMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    getSelectedInternalAccountMock.mockReturnValue({
      address: MOCK_ACCOUNT_ADDRESS,
    } as never);
    createPerpsWithdrawTransactionMock.mockResolvedValue({
      transactionId: MOCK_TX_ID,
    });
    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
      navigateToTransactions: navigateToTransactionsMock,
    } as never);
  });

  it('renders the Perps Withdraw developer button', () => {
    renderButton();

    expect(screen.getByText('Perps Withdraw')).toBeInTheDocument();
    expect(
      screen.getByText('Triggers a Perps withdraw confirmation.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('creates a perpsWithdraw transaction on Arbitrum and navigates to it', async () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(createPerpsWithdrawTransactionMock).toHaveBeenCalledTimes(1);
    });

    expect(createPerpsWithdrawTransactionMock).toHaveBeenCalledWith({
      accountAddress: MOCK_ACCOUNT_ADDRESS,
    });

    expect(navigateToTransactionMock).toHaveBeenCalledWith(MOCK_TX_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('does not create a transaction when there is no selected account', () => {
    getSelectedInternalAccountMock.mockReturnValue(undefined as never);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    expect(createPerpsWithdrawTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
