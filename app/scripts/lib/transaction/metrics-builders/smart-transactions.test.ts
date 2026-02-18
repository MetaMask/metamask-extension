import { getSmartTransactionProperties } from './smart-transactions';
import { createBuilderRequest } from './test-utils';

describe('smart-transactions builder', () => {
  it('returns metrics shape', async () => {
    const result = await getSmartTransactionProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });
});
