/* eslint-disable @typescript-eslint/naming-convention */
import { getBaseMetricsProperties } from './base';
import { createBuilderRequest } from './test-utils';

describe('base builder', () => {
  it('builds core transaction properties', async () => {
    const result = await getBaseMetricsProperties(
      createBuilderRequest({
        context: {
          ...createBuilderRequest().context,
          isContractInteraction: true,
          contractMethodName: 'transfer',
          transactionTypeForMetrics: 'contractInteraction',
          assetType: 'NATIVE',
          tokenStandard: 'NONE',
        },
      }),
    );
    expect(result.properties).toMatchObject({
      chain_id: '0x1',
      source: 'user',
      transaction_type: 'contractInteraction',
      transaction_contract_method: ['transfer'],
    });
  });

  it('omits contract method for non-contract interactions', async () => {
    const result = await getBaseMetricsProperties(createBuilderRequest());
    expect(result.properties.transaction_contract_method).toStrictEqual([]);
  });
});
