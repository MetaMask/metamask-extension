/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getRPCMetricsProperties } from './rpc';
import { createBuilderRequest } from './test-utils';

describe('rpc builder', () => {
  it('adds rpc_domain for submitted transactions', async () => {
    const result = await getRPCMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          status: TransactionStatus.submitted,
        } as unknown as TransactionMeta,
      }),
    );
    expect(result.properties.rpc_domain).toBe('private');
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  it('returns empty metrics for non-submitted/non-confirmed statuses', async () => {
    const result = await getRPCMetricsProperties(createBuilderRequest());
    expect(result).toStrictEqual({ properties: {}, sensitiveProperties: {} });
  });
});
