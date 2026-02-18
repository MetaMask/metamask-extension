import { getSwapBridgeMetricsProperties } from './swap-bridge';
import { createBuilderRequest } from './test-utils';

describe('swap-bridge builder', () => {
  it('returns metrics shape', async () => {
    const result = await getSwapBridgeMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
