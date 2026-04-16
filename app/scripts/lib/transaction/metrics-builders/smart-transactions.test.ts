/* eslint-disable @typescript-eslint/naming-convention */
import { getSmartTransactionProperties } from './smart-transactions';
import { createBuilderRequest } from './test-utils';

jest.mock('../../../../../shared/lib/metametrics', () => ({
  getSmartTransactionMetricsProperties: jest.fn().mockReturnValue({
    is_smart_transactions_user_opt_in: true,
    is_smart_transactions_available: true,
    is_smart_transaction: true,
  }),
}));

describe('smart-transactions builder', () => {
  it('maps smart transaction properties to event properties', async () => {
    const result = await getSmartTransactionProperties(createBuilderRequest());
    expect(result.properties).toMatchObject({
      is_smart_transactions_user_opt_in: true,
      is_smart_transactions_available: true,
      is_smart_transaction: true,
    });
    expect(result.sensitiveProperties).toStrictEqual({});
  });
});
