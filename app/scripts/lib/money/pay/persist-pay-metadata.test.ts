import type { TransactionPayControllerMessenger } from '@metamask/transaction-pay-controller';
import { subscribePersistPayMetadata } from './persist-pay-metadata';

describe('subscribePersistPayMetadata', () => {
  it('persists the sending USD value on the transaction', () => {
    const transaction = {
      id: 'tx-1',
      assetsFiatValues: { sending: '50' },
      metamaskPay: {
        chainId: '0x1',
        tokenAddress: '0xabc',
        strategy: 'relay',
      },
    };
    const subscribe = jest.fn();
    const call = jest.fn((action: string) =>
      action === 'TransactionController:getState'
        ? { transactions: [transaction] }
        : undefined,
    );
    const messenger = {
      call,
      subscribe,
    } as unknown as TransactionPayControllerMessenger;

    subscribePersistPayMetadata(messenger);

    const handleStateChange = subscribe.mock.calls[0][1];
    handleStateChange({
      transactionData: {
        'tx-1': {
          tokens: [
            { skipIfBalance: false, amountUsd: '100' },
            { skipIfBalance: true, amountUsd: '25' },
          ],
        },
      },
    });

    expect(call).toHaveBeenCalledWith(
      'TransactionController:updateTransaction',
      {
        ...transaction,
        assetsFiatValues: {
          sending: '100',
        },
      },
      'Persist MM Pay sending fiat value',
    );
  });

  it('does not update a transaction when the values are already persisted', () => {
    const transaction = {
      id: 'tx-1',
      assetsFiatValues: {
        sending: '100',
      },
      metamaskPay: {
        chainId: '0x1',
        tokenAddress: '0xabc',
      },
    };
    const subscribe = jest.fn();
    const call = jest.fn((action: string) =>
      action === 'TransactionController:getState'
        ? { transactions: [transaction] }
        : undefined,
    );
    const messenger = {
      call,
      subscribe,
    } as unknown as TransactionPayControllerMessenger;

    subscribePersistPayMetadata(messenger);

    const handleStateChange = subscribe.mock.calls[0][1];
    handleStateChange({
      transactionData: {
        'tx-1': {
          tokens: [{ skipIfBalance: false, amountUsd: '100' }],
        },
      },
    });

    expect(call).not.toHaveBeenCalledWith(
      'TransactionController:updateTransaction',
      expect.anything(),
      expect.anything(),
    );
  });
});
