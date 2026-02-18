import { getBatchMetricsProperties } from './batch';
import { createBuilderRequest } from './test-utils';

describe('batch builder', () => {
  it('returns metrics shape', async () => {
    const result = await getBatchMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
