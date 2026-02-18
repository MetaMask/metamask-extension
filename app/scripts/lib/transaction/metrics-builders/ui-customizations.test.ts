import { getUICustomizationsMetricsProperties } from './ui-customizations';
import { createBuilderRequest } from './test-utils';

describe('ui-customizations builder', () => {
  it('returns metrics shape', async () => {
    const result = await getUICustomizationsMetricsProperties(
      createBuilderRequest(),
    );
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
