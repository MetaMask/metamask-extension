import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { TransactionDetailsContractProvider } from './transaction-details-contract-context';
import { MetadataSection } from './sections';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));
jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({ formatDateTime: () => 'formatted date' }),
}));
jest.mock('../../../components/app/transaction/account-name', () => ({
  AccountName: ({ address }: { address?: string }) => <span>{address}</span>,
}));
jest.mock('../../../components/app/transaction/network-name', () => ({
  NetworkName: ({ chainId }: { chainId: string }) => <span>{chainId}</span>,
}));
jest.mock('../../../components/app/transaction/transaction-id', () => ({
  TransactionId: ({ value }: { value: string }) => <span>{value}</span>,
}));
jest.mock('../../../components/app/transaction/transaction-status', () => ({
  TransactionStatus: ({ status }: { status: string }) => <span>{status}</span>,
}));
jest.mock('./contract-name', () => ({
  ContractName: ({ address }: { address: string }) => (
    <span data-testid="contract-name">{address}</span>
  ),
}));

const contractAddress = '0x1234567890123456789012345678901234567890';
const transactionHash =
  '0x8586e162e456a23c1969573a4b79e77912705b474bc5aa0c2a63d56556623ab2';

function renderMetadata(item: ActivityListItem, address?: string) {
  return render(
    <TransactionDetailsContractProvider contractAddress={address}>
      <MetadataSection item={item} />
    </TransactionDetailsContractProvider>,
  );
}

function createItem(type: string): ActivityListItem {
  return {
    type,
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1,
    hash: transactionHash,
    data: {
      from: '0xabc',
      to: '0xdef',
      token: { direction: 'out' },
    },
  } as ActivityListItem;
}

describe('MetadataSection', () => {
  it('renders With immediately above Network for a contract activity', () => {
    const { getAllByTestId, getByTestId } = renderMetadata(
      createItem('contractInteraction'),
      contractAddress,
    );

    const labels = getAllByTestId('transaction-breakdown-row-title').map(
      ({ textContent }) => textContent,
    );

    expect(labels).toEqual([
      'status',
      'date',
      'account',
      'with',
      'network',
      'transactionIdLabel',
    ]);
    expect(getByTestId('contract-name')).toHaveTextContent(contractAddress);
  });

  it('hides With for send and receive activities', () => {
    for (const type of ['send', 'receive']) {
      const { queryByText, unmount } = renderMetadata(
        createItem(type),
        contractAddress,
      );

      expect(queryByText('with')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('hides With when there is no contract', () => {
    const { queryByText } = renderMetadata(createItem('contractInteraction'));

    expect(queryByText('with')).not.toBeInTheDocument();
  });
});
