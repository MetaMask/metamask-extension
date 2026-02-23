/* eslint-disable @typescript-eslint/naming-convention */
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';
import { getGasMetricsProperties } from './gas';
import { createBuilderRequest } from './test-utils';

describe('gas builder', () => {
  it('builds gas selection and converts hex gas values', async () => {
    const result = await getGasMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          userFeeLevel: 'dappSuggested',
          txParams: {
            ...createBuilderRequest().transactionMeta.txParams,
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x59682f00',
          },
          defaultGasEstimates: {
            estimateType: 'medium',
            gas: '0x5208',
            gasPrice: '0x3b9aca00',
          },
        } as never,
      }),
    );
    expect(result.properties.gas_fee_selected).toBe('dapp_proposed');
    expect(result.sensitiveProperties.max_fee_per_gas).toBe(
      hexWEIToDecGWEI('0x3b9aca00'),
    );
    expect(result.sensitiveProperties.max_priority_fee_per_gas).toBe(
      hexWEIToDecGWEI('0x59682f00'),
    );
  });
});
