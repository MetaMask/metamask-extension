/* eslint-disable @typescript-eslint/naming-convention */
import { getSmartTransactionProperties } from './smart-transactions';
import { createBuilderRequest } from './test-utils';

jest.mock('../../../../../shared/modules/metametrics', () => ({
  getSmartTransactionMetricsProperties: jest.fn().mockReturnValue({
    is_smart_transaction: true,
    gas_included: true,
  }),
}));

describe('smart-transactions builder', () => {
  it('maps smart transaction properties to event properties', async () => {
    const result = await getSmartTransactionProperties(createBuilderRequest());
    expect(result.properties).toMatchObject({
      is_smart_transaction: true,
      gas_included: true,
    });
    expect(result.sensitiveProperties).toStrictEqual({});
  });
});
