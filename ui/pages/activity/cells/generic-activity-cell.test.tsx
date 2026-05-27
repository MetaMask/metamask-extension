import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { GenericActivityCell } from './generic-activity-cell';

const mockFormatTokenAmount = jest.fn();

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) =>
    key === 'activity_convert_success_title' ? `Converted ${values?.[0]}` : key,
}));

jest.mock('../useFormatTokenAmount', () => ({
  useFormatTokenAmount: () => mockFormatTokenAmount,
}));

const mockUseFormatFiatAmount = jest.fn();

jest.mock('../useFormatFiatAmount', () => ({
  useFormatFiatAmount: (...args: unknown[]) => mockUseFormatFiatAmount(...args),
}));

jest.mock('../../../components/ui/icon/status-icon', () => ({
  StatusIcon: () => <div data-testid="status-icon-rive-mock" />,
}));

describe('GenericActivityCell', () => {
  beforeEach(() => {
    mockFormatTokenAmount.mockReturnValue(undefined);
    mockUseFormatFiatAmount.mockReturnValue(undefined);
  });

  it('renders successful activity with the confirmed transaction status hook', () => {
    const { getByTestId } = render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
            token: {
              amount: '1000000000000000000',
              decimals: 18,
              direction: 'out',
              symbol: 'ETH',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(getByTestId('activity-list-item')).toHaveAttribute(
      'data-tx-status',
      'confirmed',
    );
  });

  it('renders pending spinner when status is pending', () => {
    render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'pending',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('activity-list-item-pending-spinner'),
    ).toContainElement(screen.getByTestId('status-icon-rive-mock'));
  });

  it('does not render pending spinner when status is success', () => {
    render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId('activity-list-item-pending-spinner'),
    ).not.toBeInTheDocument();
  });

  it('shows signing subtitle for approved local transactions', () => {
    const transactionGroup = {
      nonce: '0x1',
      initialTransaction: {
        id: 'tx-1',
        chainId: '0x1',
        status: TransactionStatus.approved,
      },
      primaryTransaction: {
        id: 'tx-1',
        chainId: '0x1',
        status: TransactionStatus.approved,
      },
    } as unknown as TransactionGroup;

    render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'pending',
          timestamp: 0,
          isEarliestNonce: true,
          raw: { type: 'localTransaction', data: transactionGroup },
          data: {
            from: '0x1',
            to: '0x2',
          },
        }}
      />,
    );

    expect(screen.getByText('signing')).toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
  });

  it('shows queued subtitle for non-earliest submitted transactions', () => {
    const transactionGroup = {
      nonce: '0x2',
      initialTransaction: {
        id: 'tx-2',
        chainId: '0x1',
        status: TransactionStatus.submitted,
      },
      primaryTransaction: {
        id: 'tx-2',
        chainId: '0x1',
        status: TransactionStatus.submitted,
      },
    } as unknown as TransactionGroup;

    render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'pending',
          timestamp: 0,
          isEarliestNonce: false,
          raw: { type: 'localTransaction', data: transactionGroup },
          data: {
            from: '0x1',
            to: '0x2',
          },
        }}
      />,
    );

    expect(screen.getByText('queued')).toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
  });

  it('renders fiat on the secondary line when available', () => {
    mockFormatTokenAmount.mockReturnValue('-1 ETH');
    mockUseFormatFiatAmount.mockReturnValue('$2,500.00');

    const { getByTestId } = render(
      <GenericActivityCell
        data={{
          type: 'send',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x1',
            to: '0x2',
            token: {
              amount: '1000000000000000000',
              decimals: 18,
              direction: 'out',
              symbol: 'ETH',
              assetId: 'eip155:1/slip44:60',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      getByTestId('transaction-list-item-secondary-currency'),
    ).toHaveTextContent('$2,500.00');
  });

  it('renders contract interaction token amounts', () => {
    mockFormatTokenAmount.mockReturnValue('-4 ETH');

    const { getByTestId } = render(
      <GenericActivityCell
        data={{
          type: 'contractInteraction',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
            token: {
              amount: '4000000000000000000',
              decimals: 18,
              direction: 'out',
              symbol: 'ETH',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      getByTestId('transaction-list-item-primary-currency'),
    ).toHaveTextContent('-4 ETH');
  });

  it('uses signed incoming amount from formatter hook', () => {
    mockFormatTokenAmount.mockReturnValue('+4 ETH');

    render(
      <GenericActivityCell
        data={{
          type: 'receive',
          chainId: 'eip155:1',
          status: 'success',
          timestamp: 0,
          data: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
            token: {
              amount: '4000000000000000000',
              decimals: 18,
              direction: 'in',
              symbol: 'ETH',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('transaction-list-item-primary-currency'),
    ).toHaveTextContent('+4 ETH');
  });

  it('renders convert title, token pair, and signed token amounts', () => {
    mockFormatTokenAmount.mockImplementation((token) =>
      token?.symbol === 'mUSD' ? '+0.100099 MUSD' : '-0.1 USDT',
    );

    render(
      <GenericActivityCell
        data={{
          type: 'convert',
          chainId: 'eip155:59144',
          status: 'success',
          timestamp: 0,
          data: {
            sourceToken: {
              amount: '100000',
              decimals: 6,
              direction: 'out',
              symbol: 'USDT',
            },
            destinationToken: {
              amount: '100099',
              decimals: 6,
              direction: 'in',
              symbol: 'mUSD',
            },
          },
        }}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId('activity-list-item-action')).toHaveTextContent(
      'Converted mUSD',
    );
    expect(screen.getByText('USDT → mUSD')).toBeInTheDocument();
    expect(
      screen.getByTestId('transaction-list-item-primary-currency'),
    ).toHaveTextContent('+0.100099 MUSD');
    expect(
      screen.getByTestId('transaction-list-item-secondary-currency'),
    ).toHaveTextContent('-0.1 USDT');
  });
});
