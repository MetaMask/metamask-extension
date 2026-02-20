/* eslint-disable @typescript-eslint/naming-convention */
import { getSecurityMetricsProperties } from './security';
import { createBuilderRequest } from './test-utils';

jest.mock('../../../../../ui/helpers/utils/metrics', () => ({
  getBlockaidMetricsProps: jest.fn().mockReturnValue({
    security_alert_response: 'Error',
    ui_customizations: ['security_alert_error'],
  }),
}));

describe('security builder', () => {
  it('builds security and ui customization metrics', async () => {
    const result = await getSecurityMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          simulationFails: true,
          securityProviderResponse: { flagAsDangerous: 1 },
          txParams: {
            ...createBuilderRequest().transactionMeta.txParams,
            to: '0x2222222222222222222222222222222222222222',
          },
          chainId: '0x1',
        } as never,
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getAddressSecurityAlertResponse: jest
            .fn()
            .mockReturnValue({ result_type: 'Malicious' }),
        } as never,
      }),
    );

    expect(result.properties.gas_estimation_failed).toBe(true);
    expect(result.properties.address_alert_response).toBe('Malicious');
    expect(result.properties.ui_customizations).toEqual(
      expect.arrayContaining([
        'flagged_as_malicious',
        'security_alert_error',
        'gas_estimation_failed',
      ]),
    );
    expect(result.sensitiveProperties).toStrictEqual({});
  });
});
