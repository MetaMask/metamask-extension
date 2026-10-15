import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { RampMetadataSection } from './ramp-metadata-section';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: () => 'formatted-date',
  }),
}));

jest.mock('../../../../components/app/transaction/account-name', () => ({
  AccountName: ({ address }: { address?: string }) => (
    <span data-testid="account-name">{address}</span>
  ),
}));

jest.mock('../../../../components/app/transaction/network-name', () => ({
  NetworkName: ({ chainId }: { chainId: string }) => (
    <span data-testid="network-name">{chainId}</span>
  ),
}));

jest.mock('../../../../components/app/transaction/transaction-id', () => ({
  TransactionId: ({ value }: { value: string }) => (
    <span data-testid="transaction-id">{value}</span>
  ),
}));

jest.mock('../../../../components/app/transaction/transaction-status', () => ({
  TransactionStatus: ({ status }: { status: string }) => (
    <span data-testid="transaction-status">{status}</span>
  ),
}));

jest.mock('../../components/shared', () => ({
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
  Row: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div data-testid="row" data-label={label}>
      {value}
    </div>
  ),
}));

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

describe('RampMetadataSection', () => {
  it('renders a status description and omits network when chainId is missing', () => {
    const item = {
      type: 'rampBuy',
      status: 'pending',
      timestamp: 1,
      data: { from: '0xabc' },
    } as RampOrderItem;

    const { getByTestId, getByText, queryByTestId } = render(
      <RampMetadataSection
        item={item}
        statusDescription="Waiting for payment"
      />,
    );

    expect(getByTestId('transaction-status')).toHaveTextContent('pending');
    expect(getByText('Waiting for payment')).toBeInTheDocument();
    expect(getByTestId('account-name')).toHaveTextContent('0xabc');
    expect(getByText('formatted-date')).toBeInTheDocument();
    expect(queryByTestId('network-name')).not.toBeInTheDocument();
    expect(queryByTestId('transaction-id')).not.toBeInTheDocument();
  });
});
