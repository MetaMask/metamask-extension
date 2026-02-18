/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransactionStatus } from '@metamask/transaction-controller';
import { getRPCMetricsProperties } from './rpc';
import { createBuilderRequest } from './test-utils';

describe('rpc builder', () => {
  it('returns metrics shape', async () => {
    const result = await getRPCMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          status: TransactionStatus.submitted,
        } as any,
      }),
    );
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
