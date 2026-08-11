import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getTransactionDetailsMetricsProperties } from './transaction-details';
import { createBuilderRequest } from './test-utils';

describe('transaction-details builder', () => {
  it('exposes migrated contract details and completion_time on properties on finalized', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          status: 'confirmed',
          txParams: {
            ...createBuilderRequest().transactionMeta.txParams,
            to: '0x2222222222222222222222222222222222222222',
          },
          submittedTime: Date.now() - 3000,
        } as never,
        context: {
          ...createBuilderRequest().context,
          isContractInteraction: true,
          contractMethod4Byte: '0xa9059cbb',
        } as never,
      }),
    );

    expect(result.properties.transaction_contract_address).toStrictEqual([
      '0x2222222222222222222222222222222222222222',
    ]);
    expect(result.properties.transaction_contract_method_4byte).toBe(
      '0xa9059cbb',
    );
    expect(result.properties.completion_time).toEqual(expect.any(String));
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  it('forwards transactionEventPayload.error to properties on finalized', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionEventPayload: {
          transactionMeta: createBuilderRequest().transactionMeta,
          error: 'user rejected the request',
        } as never,
      }),
    );

    expect(result.properties.error).toBe('user rejected the request');
  });

  it('reports the receipt revert message for an on-chain failure', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          revert: {
            receipt: {
              message: 'NativeBalanceChangeEnforcer:hasnt-decreased-enough',
            },
          },
        } as never,
      }),
    );

    expect(result.properties.error).toBe(
      'NativeBalanceChangeEnforcer:hasnt-decreased-enough',
    );
  });

  it('prefers the lifecycle error over the receipt revert message', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionEventPayload: {
          transactionMeta: createBuilderRequest().transactionMeta,
          error: 'lifecycle error',
        } as never,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          txReceipt: { status: '0x0' },
          revert: { receipt: { message: 'receipt error' } },
        } as never,
      }),
    );

    expect(result.properties.error).toBe('lifecycle error');
  });

  it('omits transaction_contract_address for batch transactions so batch.ts can supply it', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          nestedTransactions: [
            { to: '0x2222222222222222222222222222222222222222' },
          ],
        } as never,
        context: {
          ...createBuilderRequest().context,
          isContractInteraction: true,
        } as never,
      }),
    );

    expect(result.properties.transaction_contract_address).toBeUndefined();
  });
});
