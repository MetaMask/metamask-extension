/* eslint-disable @typescript-eslint/naming-convention */
import { getGaslessMetricsProperties } from './gasless';
import { createBuilderRequest } from './test-utils';

describe('gasless builder', () => {
  it('builds gasless token and insufficient native balance metrics', async () => {
    const result = await getGaslessMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          txParams: {
            ...createBuilderRequest().transactionMeta.txParams,
            value: '0xffffffffffffffff',
          },
          gasFeeTokens: [
            {
              tokenAddress: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
            },
            {
              tokenAddress: '0x1111111111111111111111111111111111111111',
              symbol: 'USDC',
            },
          ],
          selectedGasFeeToken: '0x0000000000000000000000000000000000000000',
        } as never,
      }),
    );
    expect(result.properties.gas_payment_tokens_available).toStrictEqual([
      'ETH',
      'USDC',
    ]);
    expect(result.properties.gas_paid_with).toBe('pre-funded_ETH');
    expect(result.properties.gas_insufficient_native_asset).toBe(true);
    expect(result.sensitiveProperties).toStrictEqual({});
  });
});
