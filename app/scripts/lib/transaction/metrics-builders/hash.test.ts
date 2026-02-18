/* eslint-disable @typescript-eslint/no-explicit-any */
import { getHashMetricsProperties } from './hash';
import { createBuilderRequest } from './test-utils';

describe('hash builder', () => {
  it('returns metrics shape', async () => {
    const result = await getHashMetricsProperties(
      createBuilderRequest({
        transactionMeta: { id: '1', hash: '0xabc', status: 'failed' } as any,
      }),
    );
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
