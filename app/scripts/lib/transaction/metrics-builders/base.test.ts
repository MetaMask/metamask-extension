import { getBaseMetricsProperties } from './base';
import { createBuilderRequest } from './test-utils';

describe('base builder', () => {
  it('returns metrics shape', async () => {
    const result = await getBaseMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
