import React from 'react';
import { render } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  TransactionDetailsProvider,
  useTransactionDetails,
} from './transaction-details-context';

const mockTransactionMeta = {
  id: 'test-id',
  chainId: '0x1',
  status: TransactionStatus.confirmed,
  time: Date.now(),
  txParams: {
    from: '0x123',
    to: '0x456',
  },
};

// eslint-disable-next-line @typescript-eslint/naming-convention
function TestConsumer() {
  const { transactionMeta } = useTransactionDetails();
  return <div data-testid="consumer">{transactionMeta.id}</div>;
}

describe('TransactionDetailsContext', () => {
  describe('TransactionDetailsProvider', () => {
    it('provides transactionMeta to children', () => {
      const { getByTestId } = render(
        <TransactionDetailsProvider
          transactionMeta={mockTransactionMeta as never}
        >
          <TestConsumer />
        </TransactionDetailsProvider>,
      );

      expect(getByTestId('consumer')).toHaveTextContent('test-id');
    });
  });

  describe('useTransactionDetails', () => {
    it('throws error when used outside provider', () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      expect(() => render(<TestConsumer />)).toThrow(
        'useTransactionDetails must be used within a TransactionDetailsProvider',
      );

      consoleError.mockRestore();
    });
  });
});
