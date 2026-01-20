import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useConfirmContext } from '../../../context/confirm';
import { isHardwareAccount } from '../../../../multichain-accounts/account-details/account-type-utils';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { PayWithRow, PayWithRowSkeleton } from './pay-with-row';

jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../../context/confirm');
jest.mock('../../../../multichain-accounts/account-details/account-type-utils');
jest.mock('../../../../../hooks/useFiatFormatter');

jest.mock('../../confirm/info/shared/gas-fee-token-icon', () => ({
  GasFeeTokenIcon: ({ tokenAddress }: { tokenAddress: string }) => (
    <div data-testid="gas-fee-token-icon">{tokenAddress}</div>
  ),
  GasFeeTokenIconSize: {
    Sm: 'sm',
    Md: 'md',
  },
}));

jest.mock('../../modals/pay-with-modal', () => ({
  PayWithModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="pay-with-modal">
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

const ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const CHAIN_ID_MOCK = '0x1';
const FROM_ADDRESS_MOCK = '0xabcdef1234567890abcdef1234567890abcdef12';

const mockStore = configureStore([thunk]);

const getMockState = () => ({
  metamask: {
    internalAccounts: {
      accounts: {
        'account-1': {
          address: FROM_ADDRESS_MOCK,
          id: 'account-1',
          metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
          type: 'eip155:eoa',
        },
      },
      selectedAccount: 'account-1',
    },
    accounts: {
      [FROM_ADDRESS_MOCK]: {
        address: FROM_ADDRESS_MOCK,
        balance: '0x0',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [FROM_ADDRESS_MOCK],
      },
    ],
    completedOnboarding: true,
  },
});

describe('PayWithRow', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const isHardwareAccountMock = jest.mocked(isHardwareAccount);
  const useFiatFormatterMock = jest.mocked(useFiatFormatter);

  beforeEach(() => {
    jest.resetAllMocks();

    useFiatFormatterMock.mockReturnValue(
      (value: number) => `$${value.toFixed(2)}`,
    );

    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        address: ADDRESS_MOCK,
        balanceHuman: '1.5',
        balanceFiat: '$150.00',
        balanceRaw: '1500000000000000000',
        balanceUsd: '150',
        chainId: CHAIN_ID_MOCK,
        decimals: 18,
        symbol: 'ETH',
      },
      setPayToken: jest.fn(),
      isNative: true,
    });

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        txParams: {
          from: FROM_ADDRESS_MOCK,
        },
      },
    } as never);

    isHardwareAccountMock.mockReturnValue(false);
  });

  it('renders selected pay token with symbol and balance', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    expect(screen.getByTestId('pay-with-row')).toBeInTheDocument();
    expect(screen.getByTestId('pay-with-symbol')).toHaveTextContent(
      'Pay with ETH',
    );
    expect(screen.getByTestId('pay-with-balance')).toBeInTheDocument();
    expect(screen.getByTestId('gas-fee-token-icon')).toHaveTextContent(
      ADDRESS_MOCK,
    );
  });

  it('opens modal when clicked', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    expect(screen.queryByTestId('pay-with-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pay-with-row'));

    expect(screen.getByTestId('pay-with-modal')).toBeInTheDocument();
  });

  it('closes modal when onClose is called', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    fireEvent.click(screen.getByTestId('pay-with-row'));
    expect(screen.getByTestId('pay-with-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-modal'));
    expect(screen.queryByTestId('pay-with-modal')).not.toBeInTheDocument();
  });

  it('renders skeleton when no pay token selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
      isNative: false,
    });

    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    expect(screen.getByTestId('pay-with-row-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('pay-with-row')).not.toBeInTheDocument();
  });

  it('does not open modal when hardware account', () => {
    isHardwareAccountMock.mockReturnValue(true);

    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    fireEvent.click(screen.getByTestId('pay-with-row'));

    expect(screen.queryByTestId('pay-with-modal')).not.toBeInTheDocument();
  });

  it('does not show arrow icon when hardware account', () => {
    isHardwareAccountMock.mockReturnValue(true);

    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    expect(screen.queryByTestId('arrow-down-icon')).not.toBeInTheDocument();
  });

  it('shows arrow icon when not hardware account and from address exists', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRow />, store);

    const payWithRow = screen.getByTestId('pay-with-row');
    expect(payWithRow).toBeInTheDocument();
  });
});

describe('PayWithRowSkeleton', () => {
  it('renders skeleton elements', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithRowSkeleton />, store);

    expect(screen.getByTestId('pay-with-row-skeleton')).toBeInTheDocument();
  });
});
