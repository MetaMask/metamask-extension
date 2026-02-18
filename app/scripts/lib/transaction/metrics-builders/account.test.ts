import { getAccountMetricsProperties } from './account';
import { createBuilderRequest } from './test-utils';

jest.mock('../../snap-keyring/metrics', () => ({
  getSnapAndHardwareInfoForMetrics: jest.fn().mockResolvedValue({}),
}));

describe('account builder', () => {
  it('returns metrics shape', async () => {
    const result = await getAccountMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
