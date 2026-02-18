import { getSwapBridgeMetricsProperties } from './swap-bridge';
import { createBuilderRequest } from './test-utils';

describe('swap-bridge builder', () => {
  it('returns metrics shape', async () => {
    const result = await getSwapBridgeMetricsProperties(createBuilderRequest());
    expect(result.properties).toBeDefined();
    expect(result.sensitiveProperties).toBeDefined();
  });

  it('includes simulation values for approve method name even when not ERC20 approve', async () => {
    const result = await getSwapBridgeMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          assetsFiatValues: {
            receiving: 10,
            sending: 20,
          },
        } as never,
        context: {
          contractMethodName: 'Approve',
          isApproveMethod: false,
          transactionTypeForMetrics: 'contractInteraction',
        } as never,
      }),
    );

    expect(result.properties.simulation_receiving_assets_total_value).toBe(10);
    expect(result.properties.simulation_sending_assets_total_value).toBe(20);
  });
});
