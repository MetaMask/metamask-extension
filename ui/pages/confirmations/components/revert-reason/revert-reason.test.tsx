import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { useTransactionMetadataRequest } from '../../hooks/transactions/useTransactionMetadataRequest';
import { RevertReason } from './revert-reason';

jest.mock('../../hooks/transactions/useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequest: jest.fn(),
}));

const useTransactionMetadataRequestMock = jest.mocked(
  useTransactionMetadataRequest,
);

function createTransactionMeta(
  revert: TransactionMeta['revert'],
): TransactionMeta {
  return {
    chainId: '0x1',
    id: 'transaction-id',
    networkClientId: 'mainnet',
    revert,
    status: TransactionStatus.unapproved,
    time: 0,
    txParams: {
      from: '0x0000000000000000000000000000000000000000',
    },
    type: TransactionType.simpleSend,
  };
}

describe('RevertReason', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the revert message', () => {
    useTransactionMetadataRequestMock.mockReturnValue(
      createTransactionMeta({
        gas: {
          message: 'ERC20: transfer amount exceeds balance',
        },
      }),
    );

    render(
      <RevertReason source="gas" data-testid="transaction-revert-reason" />,
    );

    expect(screen.getByTestId('transaction-revert-reason')).toBeInTheDocument();
    expect(
      screen.getByTestId('transaction-revert-reason-message'),
    ).toHaveTextContent('ERC20: transfer amount exceeds balance');
  });

  it('renders no content when the revert message is missing', () => {
    useTransactionMetadataRequestMock.mockReturnValue(
      createTransactionMeta({
        gas: {
          data: '0x1234',
        },
      }),
    );

    const { container } = render(<RevertReason source="gas" />);

    expect(container).toBeEmptyDOMElement();
  });
});
