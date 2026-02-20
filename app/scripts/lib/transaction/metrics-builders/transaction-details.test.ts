/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getTransactionDetailsMetricsProperties } from './transaction-details';
import { createBuilderRequest } from './test-utils';

describe('transaction-details builder', () => {
  it('builds finalized sensitive details and completion metrics', async () => {
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
          blockTimestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
          txReceipt: {
            gasUsed: '0x5208',
            blockNumber: '0x10',
            status: '0x1',
          },
        } as never,
        context: {
          ...createBuilderRequest().context,
          isContractInteraction: true,
          contractMethod4Byte: '0xa9059cbb',
        } as never,
      }),
    );

    expect(
      result.sensitiveProperties.transaction_contract_address,
    ).toStrictEqual(['0x2222222222222222222222222222222222222222']);
    expect(result.sensitiveProperties.transaction_contract_method_4byte).toBe(
      '0xa9059cbb',
    );
    expect(result.sensitiveProperties.gas_used).toBe('0.000021');
    expect(result.sensitiveProperties.block_number).toBe('16');
    expect(result.sensitiveProperties.completion_time).toEqual(
      expect.any(String),
    );
  });
});
