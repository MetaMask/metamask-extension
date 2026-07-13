/* eslint-disable @typescript-eslint/naming-convention */
import { getGasMetricsProperties } from './gas';
import { createBuilderRequest } from './test-utils';

describe('gas builder', () => {
  it('maps userFeeLevel "dappSuggested" to gas_fee_selected "dapp_proposed"', async () => {
    const result = await getGasMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          userFeeLevel: 'dappSuggested',
        } as never,
      }),
    );

    expect(result.properties).toStrictEqual({
      gas_fee_selected: 'dapp_proposed',
    });
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  it('passes through other userFeeLevel values verbatim', async () => {
    const result = await getGasMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          userFeeLevel: 'high',
        } as never,
      }),
    );

    expect(result.properties.gas_fee_selected).toBe('high');
  });
});
