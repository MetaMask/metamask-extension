import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TransactionStatus as TransactionMetaStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';

import type { MoneyAccountActivityItem } from '../../../../shared/lib/activity/types';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
import { useMoneyAccountDeposit } from '../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../hooks/money/useMoneyAccountInfo';
import { MoneyAccountDetails } from './money-account-details';

jest.mock('../../../hooks/activity/useLocalTransactionMeta');
jest.mock('../../../hooks/money/useMoneyAccountDeposit');
jest.mock('../../../hooks/money/useMoneyAccountInfo');

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: (timestamp: number) => `date-${timestamp}`,
    formatCurrencyWithMinThreshold: (value: number, currency: string) =>
      `${currency}:${value}`,
  }),
}));

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: ({ tokens }: { tokens?: (string | undefined)[] }) => (
    <div data-testid="activity-avatar" data-tokens={String(tokens?.[0])} />
  ),
}));

jest.mock('../../../components/app/transaction/transaction-status', () => ({
  TransactionStatus: ({ status }: { status: string }) => (
    <div data-testid="transaction-status">{status}</div>
  ),
}));

jest.mock(
  '../../confirmations/components/activity/transaction-details-context',
  () => ({
    TransactionDetailsProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div data-testid="details-provider">{children}</div>,
  }),
);

jest.mock(
  '../../confirmations/components/activity/transaction-details-summary',
  () => ({
    TransactionDetailsSummary: () => <div data-testid="details-summary" />,
  }),
);

jest.mock('../components/block-explorer-button', () => ({
  BlockExplorerButton: ({
    chainId,
    txHash,
  }: {
    chainId: string;
    txHash?: string;
  }) => (
    <div
      data-testid="block-explorer-button"
      data-chain-id={chainId}
      data-tx-hash={txHash}
    />
  ),
}));

jest.mock('../components/shared', () => ({
  Footer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="footer">{children}</div>
  ),
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
  Row: ({
    label,
    value,
    testId,
  }: {
    label: string;
    value: React.ReactNode;
    testId?: string;
  }) => (
    <div data-testid={testId ?? `row-${label}`}>
      <span data-testid="row-label">{label}</span>
      <span data-testid="row-value">{value}</span>
    </div>
  ),
}));

const MUSD_ASSET_ID = 'eip155:1/erc20:0xmusd';

const mockUseLocalTransactionMeta = jest.mocked(useLocalTransactionMeta);
const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockInitiateDeposit = jest.fn();

function buildItem(
  overrides: Partial<MoneyAccountActivityItem> = {},
): MoneyAccountActivityItem {
  return {
    type: 'moneyAccountDeposit',
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1700000000000,
    hash: '0xhash',
    data: {
      from: '0xfrom',
      fiat: { amount: '25.5' },
      token: { direction: 'in', symbol: 'mUSD', assetId: MUSD_ASSET_ID },
    },
    ...overrides,
  } as MoneyAccountActivityItem;
}

function buildTransactionMeta(
  metamaskPay?: Record<string, string>,
  status: TransactionMetaStatus = TransactionMetaStatus.confirmed,
): TransactionMeta {
  return { id: 'tx-1', status, metamaskPay } as unknown as TransactionMeta;
}

describe('MoneyAccountDetails', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseLocalTransactionMeta.mockReturnValue(undefined);
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: false,
    });
    mockUseMoneyAccountInfo.mockReturnValue({
      hasMoneyAccount: true,
    } as ReturnType<typeof useMoneyAccountInfo>);
  });

  describe('hero amount', () => {
    it('renders a deposit amount with a plus sign', () => {
      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByText('+usd:25.5')).toBeInTheDocument();
    });

    it('renders a withdrawal amount with a minus sign', () => {
      render(
        <MoneyAccountDetails
          item={buildItem({ type: 'moneyAccountWithdraw' })}
        />,
      );

      expect(screen.getByText('-usd:25.5')).toBeInTheDocument();
    });

    it('renders no amount when the item has no fiat value', () => {
      render(<MoneyAccountDetails item={buildItem({ data: {} } as never)} />);

      expect(screen.queryByText(/usd:/u)).not.toBeInTheDocument();
    });

    it('passes the token asset id to the avatar', () => {
      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('activity-avatar')).toHaveAttribute(
        'data-tokens',
        MUSD_ASSET_ID,
      );
    });
  });

  describe('status and date', () => {
    it('renders the status and formatted timestamp', () => {
      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('transaction-status')).toHaveTextContent(
        'success',
      );
      expect(screen.getByTestId('row-date')).toHaveTextContent(
        'date-1700000000000',
      );
    });
  });

  describe('fee breakdown', () => {
    it('is hidden when the transaction has no MM Pay fees', () => {
      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.queryByTestId('transaction-base-fee')).toBeNull();
      expect(
        screen.queryByTestId('transaction-breakdown-value-amount'),
      ).toBeNull();
    });

    it('renders network fee and total when present', () => {
      mockUseLocalTransactionMeta.mockReturnValue(
        buildTransactionMeta({ networkFeeFiat: '0.10', totalFiat: '25.60' }),
      );

      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('transaction-base-fee')).toHaveTextContent(
        'usd:0.1',
      );
      expect(
        screen.getByTestId('transaction-breakdown-value-amount'),
      ).toHaveTextContent('usd:25.6');
    });

    it('renders the provider fee row only when a bridge fee is present', () => {
      mockUseLocalTransactionMeta.mockReturnValue(
        buildTransactionMeta({ networkFeeFiat: '0.10' }),
      );

      const { rerender } = render(<MoneyAccountDetails item={buildItem()} />);
      expect(screen.queryByTestId('transaction-bridge-fee')).toBeNull();

      mockUseLocalTransactionMeta.mockReturnValue(
        buildTransactionMeta({ networkFeeFiat: '0.10', bridgeFeeFiat: '0.05' }),
      );
      rerender(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('transaction-bridge-fee')).toHaveTextContent(
        'usd:0.05',
      );
    });
  });

  describe('transaction summary', () => {
    it('is omitted when there is no local transaction', () => {
      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.queryByTestId('details-summary')).toBeNull();
    });

    it('is rendered when a local transaction is found', () => {
      mockUseLocalTransactionMeta.mockReturnValue(buildTransactionMeta());

      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('details-summary')).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('renders the add funds button for a confirmed deposit', () => {
      mockUseLocalTransactionMeta.mockReturnValue(buildTransactionMeta());

      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByText('addFunds')).toBeInTheDocument();
      expect(screen.queryByTestId('block-explorer-button')).toBeNull();
    });

    it('initiates a deposit when the button is clicked', async () => {
      mockUseLocalTransactionMeta.mockReturnValue(buildTransactionMeta());

      render(<MoneyAccountDetails item={buildItem()} />);
      await userEvent.click(screen.getByText('addFunds'));

      expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    });

    it('falls back to the block explorer for a withdrawal', () => {
      mockUseLocalTransactionMeta.mockReturnValue(buildTransactionMeta());

      render(
        <MoneyAccountDetails
          item={buildItem({ type: 'moneyAccountWithdraw' })}
        />,
      );

      const button = screen.getByTestId('block-explorer-button');
      expect(button).toHaveAttribute('data-chain-id', 'eip155:1');
      expect(button).toHaveAttribute('data-tx-hash', '0xhash');
      expect(screen.queryByText('addFunds')).toBeNull();
    });

    it('falls back to the block explorer when the user has no money account', () => {
      mockUseLocalTransactionMeta.mockReturnValue(buildTransactionMeta());
      mockUseMoneyAccountInfo.mockReturnValue({
        hasMoneyAccount: false,
      } as ReturnType<typeof useMoneyAccountInfo>);

      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('block-explorer-button')).toBeInTheDocument();
      expect(screen.queryByText('addFunds')).toBeNull();
    });

    it('falls back to the block explorer while the deposit is unconfirmed', () => {
      mockUseLocalTransactionMeta.mockReturnValue(
        buildTransactionMeta(undefined, TransactionMetaStatus.submitted),
      );

      render(<MoneyAccountDetails item={buildItem()} />);

      expect(screen.getByTestId('block-explorer-button')).toBeInTheDocument();
      expect(screen.queryByText('addFunds')).toBeNull();
    });
  });
});
