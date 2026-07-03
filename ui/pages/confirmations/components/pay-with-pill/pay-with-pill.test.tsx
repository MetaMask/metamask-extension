import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTransactionPayToken } from '../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../hooks/pay/useTransactionPayData';
import { useSendTokens } from '../../hooks/send/useSendTokens';
import { useConfirmContext } from '../../context/confirm';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { isHardwareAccount } from '../../../multichain-accounts/account-details/account-type-utils';
import { PayWithPill, PayWithPillSkeleton } from './pay-with-pill';

jest.mock('../../hooks/pay/useTransactionPayToken');
jest.mock('../../hooks/pay/useTransactionPayData');
jest.mock('../../hooks/send/useSendTokens');
jest.mock('../../context/confirm');
jest.mock('../../../multichain-accounts/account-details/account-type-utils');

jest.mock(
  '../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: () => ({
      trackAlertMetrics: jest.fn(),
      trackInlineAlertClicked: jest.fn(),
    }),
  }),
);

jest.mock('../../../../hooks/useAlerts', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    getFieldAlerts: () => [],
  }),
}));

jest.mock('../modals/pay-with-modal', () => ({
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
    accountIdByAddress: {
      [FROM_ADDRESS_MOCK]: 'account-1',
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
    networkConfigurationsByChainId: {
      [CHAIN_ID_MOCK]: {
        chainId: CHAIN_ID_MOCK,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/',
            type: 'infura',
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
    },
    multichainNetworkConfigurationsByChainId: {},
  },
});

const MOCK_PAY_TOKEN = {
  address: ADDRESS_MOCK,
  balanceHuman: '1.5',
  balanceFiat: '$150.00',
  balanceRaw: '1500000000000000000',
  balanceUsd: '150',
  chainId: CHAIN_ID_MOCK,
  decimals: 18,
  symbol: 'ETH',
} as const;

describe('PayWithPill', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useSendTokensMock = jest.mocked(useSendTokens);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const isHardwareAccountMock = jest.mocked(isHardwareAccount);

  beforeEach(() => {
    jest.resetAllMocks();

    useSendTokensMock.mockReturnValue([]);
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: MOCK_PAY_TOKEN,
      setPayToken: jest.fn(),
      isNative: true,
    });
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'test-id',
        chainId: CHAIN_ID_MOCK,
        txParams: { from: FROM_ADDRESS_MOCK },
      },
    } as never);
    isHardwareAccountMock.mockReturnValue(false);
  });

  it('renders the "Pay with" label, symbol and the bullet balance', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithPill />, store);

    expect(screen.getByTestId('pay-with-symbol')).toHaveTextContent(
      'Pay with ETH',
    );
    expect(screen.getByTestId('pay-with-balance')).toHaveTextContent(
      '• $150.00',
    );
  });

  it('opens the modal when clicked', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithPill />, store);

    expect(screen.queryByTestId('pay-with-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pay-with-pill'));

    expect(screen.getByTestId('pay-with-modal')).toBeInTheDocument();
  });

  it('does not render the balance for a perps withdraw', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'test-id',
        type: TransactionType.perpsWithdraw,
        chainId: CHAIN_ID_MOCK,
        txParams: { from: FROM_ADDRESS_MOCK },
      },
    } as never);

    const store = mockStore(getMockState());
    renderWithProvider(<PayWithPill />, store);

    expect(screen.queryByTestId('pay-with-balance')).not.toBeInTheDocument();
  });

  it('returns null when no display token is available', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
      isNative: false,
    });
    useTransactionPayRequiredTokensMock.mockReturnValue([]);

    const store = mockStore(getMockState());
    const { container } = renderWithProvider(<PayWithPill />, store);

    expect(container.firstChild).toBeNull();
  });
});

describe('PayWithPillSkeleton', () => {
  it('renders skeleton elements', () => {
    const store = mockStore(getMockState());
    renderWithProvider(<PayWithPillSkeleton />, store);

    expect(screen.getByTestId('pay-with-pill-skeleton')).toBeInTheDocument();
  });
});
