/* eslint-disable @typescript-eslint/naming-convention */
import { getUICustomizationsMetricsProperties } from './ui-customizations';
import { createBuilderRequest } from './test-utils';

describe('ui-customizations builder', () => {
  it('applies defaults and merges fragment ui metrics', async () => {
    const result = await getUICustomizationsMetricsProperties(
      createBuilderRequest({
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getIsConfirmationAdvancedDetailsOpen: jest.fn().mockReturnValue(true),
          getTransactionUIMetricsFragment: jest.fn().mockReturnValue({
            properties: { gas_edit_attempted: 'advanced' },
            sensitiveProperties: { custom_sensitive: 'x' },
          }),
        } as never,
      }),
    );
    expect(result.properties).toMatchObject({
      gas_edit_type: 'none',
      gas_edit_attempted: 'advanced',
      transaction_advanced_view: true,
    });
    expect(result.sensitiveProperties).toMatchObject({
      custom_sensitive: 'x',
    });
  });
});
