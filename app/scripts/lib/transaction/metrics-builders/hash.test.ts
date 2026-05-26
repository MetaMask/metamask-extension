/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getHashMetricsProperties } from './hash';
import { createBuilderRequest } from './test-utils';

describe('hash builder', () => {
  it('includes transaction hash when all conditions are met', async () => {
    const result = await getHashMetricsProperties(
      createBuilderRequest({
        transactionMeta: { id: '1', hash: '0xabc', status: 'failed' } as any,
      }),
    );
    expect(result.properties.transaction_hash).toBe('0xabc');
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  it('omits hash when pna25 is not acknowledged', async () => {
    const result = await getHashMetricsProperties(
      createBuilderRequest({
        transactionMeta: { id: '1', hash: '0xabc', status: 'failed' } as any,
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getPna25Acknowledged: jest.fn().mockReturnValue(false),
        } as never,
      }),
    );
    expect(result.properties.transaction_hash).toBeUndefined();
  });
});
