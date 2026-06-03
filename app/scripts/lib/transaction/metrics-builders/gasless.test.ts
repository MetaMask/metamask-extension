/* eslint-disable @typescript-eslint/naming-convention */
import { getGaslessMetricsProperties } from './gasless';
import { createBuilderRequest } from './test-utils';

const ACCOUNT_BALANCE_MOCK = '0xffffffffffffffff';

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

  it('includes nested transaction values in insufficient native balance metrics', async () => {
    const request = createBuilderRequest();
    request.transactionMetricsRequest.getAccountBalance = jest
      .fn()
      .mockReturnValue('0x20');
    request.transactionMeta = {
      ...request.transactionMeta,
      nestedTransactions: [{ value: '0x20' }],
      txParams: {
        ...request.transactionMeta.txParams,
        gas: '0x0',
        gasPrice: '0x1',
        value: '0x10',
      },
    } as never;

    const result = await getGaslessMetricsProperties(request);

    expect(result.properties.gas_insufficient_native_asset).toBe(true);
  });

  it('includes layer 1 gas fee in insufficient native balance metrics', async () => {
    const request = createBuilderRequest();
    request.transactionMetricsRequest.getAccountBalance = jest
      .fn()
      .mockReturnValue('0x20');
    request.transactionMeta = {
      ...request.transactionMeta,
      layer1GasFee: '0x20',
      txParams: {
        ...request.transactionMeta.txParams,
        gas: '0x0',
        gasPrice: '0x1',
        value: '0x10',
      },
    } as never;

    const result = await getGaslessMetricsProperties(request);

    expect(result.properties.gas_insufficient_native_asset).toBe(true);
  });

  it('returns sufficient native balance metrics when balance covers gas and value', async () => {
    const request = createBuilderRequest();
    request.transactionMetricsRequest.getAccountBalance = jest
      .fn()
      .mockReturnValue(ACCOUNT_BALANCE_MOCK);

    const result = await getGaslessMetricsProperties(request);

    expect(result.properties.gas_insufficient_native_asset).toBe(false);
  });
});
