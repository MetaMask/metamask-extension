import { getGaslessMetricsProperties } from './gasless';
import { createBuilderRequest } from './test-utils';

describe('gasless builder', () => {
  it('returns metrics shape', async () => {
    const result = await getGaslessMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
