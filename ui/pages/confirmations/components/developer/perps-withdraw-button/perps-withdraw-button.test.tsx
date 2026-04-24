import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../selectors';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { ARBITRUM_USDC } from '../../../constants/perps';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { PerpsWithdrawButton } from './perps-withdraw-button';

jest.mock('../../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../../../../selectors', () => {
  const actual = jest.requireActual('../../../../../selectors');
  return {
    ...actual,
    getSelectedInternalAccount: jest.fn(),
  };
});

jest.mock('../../../hooks/useConfirmationNavigation', () => {
  const actual = jest.requireActual('../../../hooks/useConfirmationNavigation');
  return {
    ...actual,
    useConfirmationNavigation: jest.fn(),
  };
});

const addTransactionMock = jest.mocked(addTransaction);
const findNetworkClientIdByChainIdMock = jest.mocked(
  findNetworkClientIdByChainId,
);
const getSelectedInternalAccountMock = jest.mocked(getSelectedInternalAccount);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_NETWORK_CLIENT_ID = 'arbitrum-mainnet';
const MOCK_TX_ID = 'withdraw-tx-id';

function renderButton() {
  return renderWithProvider(<PerpsWithdrawButton />, configureStore(mockState));
}

describe('PerpsWithdrawButton', () => {
  const navigateToTransactionMock = jest.fn();
  const navigateToTransactionsMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    getSelectedInternalAccountMock.mockReturnValue({
      address: MOCK_ACCOUNT_ADDRESS,
    } as never);
    findNetworkClientIdByChainIdMock.mockResolvedValue(
      MOCK_NETWORK_CLIENT_ID as never,
    );
    addTransactionMock.mockResolvedValue({ id: MOCK_TX_ID } as never);
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
      expect(addTransactionMock).toHaveBeenCalledTimes(1);
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
      CHAIN_IDS.ARBITRUM,
    );

    expect(addTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: MOCK_ACCOUNT_ADDRESS,
        to: ARBITRUM_USDC.address,
        value: '0x0',
      }),
      {
        networkClientId: MOCK_NETWORK_CLIENT_ID,
        type: TransactionType.perpsWithdraw,
      },
    );

    expect(navigateToTransactionMock).toHaveBeenCalledWith(MOCK_TX_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('does not call addTransaction when there is no selected account', () => {
    getSelectedInternalAccountMock.mockReturnValue(undefined as never);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    expect(addTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
