import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { MAINNET_MUSD } from '../../../constants/musd';
import { generateERC20TransferData } from '../utils';
import { MoneyAccountDepositButton } from './money-account-deposit-button';

jest.mock('../../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  ConfirmationLoader: {
    CustomAmount: 'customAmount',
  },
  useConfirmationNavigation: jest.fn(),
}));

jest.mock('../utils', () => ({
  generateERC20TransferData: jest.fn(),
}));

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);
const getSelectedInternalAccountMock = jest.mocked(getSelectedInternalAccount);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);
const generateERC20TransferDataMock = jest.mocked(generateERC20TransferData);

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_NETWORK_CLIENT_ID = 'mainnet';
const MOCK_TRANSFER_DATA = '0xdeadbeef';
const MOCK_TX_ID = 'deposit-tx-id';

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
      <MoneyAccountDepositButton />
    </Provider>,
  );
}

describe('MoneyAccountDepositButton', () => {
  const navigateToTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    getSelectedInternalAccountMock.mockReturnValue({
      address: MOCK_ACCOUNT_ADDRESS,
    } as never);
    findNetworkClientIdByChainIdMock.mockResolvedValue(MOCK_NETWORK_CLIENT_ID);
    generateERC20TransferDataMock.mockReturnValue(MOCK_TRANSFER_DATA as never);
    addTransactionMock.mockResolvedValue({ id: MOCK_TX_ID } as never);
    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
    } as never);
  });

  it('renders the Money Account Deposit developer button', () => {
    renderButton();

    expect(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    ).toBeInTheDocument();
  });

  it('creates a moneyAccountDeposit transaction and navigates to it', async () => {
    renderButton();

    fireEvent.click(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    );

    await waitFor(() => {
      expect(addTransactionMock).toHaveBeenCalledTimes(1);
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
      MAINNET_MUSD.chainId,
    );
    expect(generateERC20TransferDataMock).toHaveBeenCalledWith(
      MOCK_ACCOUNT_ADDRESS,
      '0',
      MAINNET_MUSD.decimals,
    );
    expect(addTransactionMock).toHaveBeenCalledWith(
      {
        from: MOCK_ACCOUNT_ADDRESS,
        to: MAINNET_MUSD.address,
        data: MOCK_TRANSFER_DATA,
        value: '0x0',
      },
      {
        networkClientId: MOCK_NETWORK_CLIENT_ID,
        type: TransactionType.moneyAccountDeposit,
      },
    );
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

    fireEvent.click(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    );

    expect(addTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('logs an error and does not navigate when transaction creation fails', async () => {
    const error = new Error('boom');
    addTransactionMock.mockRejectedValue(error);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderButton();

    fireEvent.click(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create money account deposit transaction',
        error,
      );
    });

    expect(navigateToTransactionMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
