/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { EIP5792ErrorCode } from '../../../../../shared/constants/transaction';
import { getBatchMetricsProperties } from './batch';
import { createBuilderRequest } from './test-utils';

describe('batch builder', () => {
  it('adds batch and eip7702 metrics for batched txs', async () => {
    const result = await getBatchMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          origin: 'https://example.org',
          txParams: { authorizationList: [{}] },
          nestedTransactions: [
            {
              type: TransactionType.tokenMethodTransfer,
              to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              data: '0xa9059cbb',
            },
          ],
          delegationAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        } as never,
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getMethodData: jest.fn().mockResolvedValue({ name: 'transfer' }),
        } as never,
      }),
    );

    expect(result.properties).toMatchObject({
      api_method: 'wallet_sendCalls',
      batch_transaction_count: 1,
      batch_transaction_method: 'eip7702',
      eip7702_upgrade_transaction: true,
      transaction_contract_method: ['transfer'],
    });
    expect(result.sensitiveProperties).toMatchObject({
      transaction_contract_address: [
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ],
      account_eip7702_upgraded: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
  });

  it('marks rejected upgrade when error code matches', async () => {
    const result = await getBatchMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          status: TransactionStatus.rejected,
          txParams: { authorizationList: [{}] },
          error: { code: EIP5792ErrorCode.RejectedUpgrade },
        } as never,
      }),
    );
    expect(result.properties.eip7702_upgrade_rejection).toBe(true);
  });
});
