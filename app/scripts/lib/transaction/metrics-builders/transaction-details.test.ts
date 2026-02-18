import { getTransactionDetailsMetricsProperties } from './transaction-details';
import { createBuilderRequest } from './test-utils';

describe('transaction-details builder', () => {
  it('returns metrics shape', async () => {
    const result = await getTransactionDetailsMetricsProperties(
      createBuilderRequest(),
    );
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
