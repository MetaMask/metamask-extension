import { getGasMetricsProperties } from './gas';
import { createBuilderRequest } from './test-utils';

describe('gas builder', () => {
  it('returns metrics shape', async () => {
    const result = await getGasMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
