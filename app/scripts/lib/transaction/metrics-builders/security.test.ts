import { getSecurityMetricsProperties } from './security';
import { createBuilderRequest } from './test-utils';

describe('security builder', () => {
  it('returns metrics shape', async () => {
    const result = await getSecurityMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
