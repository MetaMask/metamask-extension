/* eslint-disable @typescript-eslint/naming-convention */
import { getSecurityMetricsProperties } from './security';
import { createBuilderRequest } from './test-utils';

jest.mock('../../../../../ui/helpers/utils/metrics', () => ({
  getBlockaidMetricsProps: jest.fn().mockReturnValue({
    security_alert_response: 'Error',
    ui_customizations: ['security_alert_error'],
  }),
}));

/**
 * Builds a request whose transaction targets a fixed recipient on the given
 * chain, with the given address security alert cache lookup mock.
 *
 * @param options - Options bag.
 * @param options.chainId - The transaction's chainId.
 * @param options.getAddressSecurityAlertResponse - Cache lookup mock.
 */
function buildAddressAlertRequest({
  chainId,
  getAddressSecurityAlertResponse,
}: {
  chainId: string | undefined;
  getAddressSecurityAlertResponse: jest.Mock;
}) {
  return createBuilderRequest({
    transactionMeta: {
      ...createBuilderRequest().transactionMeta,
      txParams: {
        ...createBuilderRequest().transactionMeta.txParams,
        to: '0x2222222222222222222222222222222222222222',
      },
      chainId,
    } as never,
    transactionMetricsRequest: {
      ...createBuilderRequest().transactionMetricsRequest,
      getAddressSecurityAlertResponse,
    } as never,
  });
}

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
    expect(result.properties.transaction_contract_verified).toBe(false);
    expect(result.properties.ui_customizations).toEqual(
      expect.arrayContaining([
        'flagged_as_malicious',
        'security_alert_error',
        'gas_estimation_failed',
      ]),
    );
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  it('reports verified contracts using the original recipient address', async () => {
    const getAddressSecurityAlertResponse = jest
      .fn()
      .mockReturnValue({ result_type: 'Trusted' });
    const result = await getSecurityMetricsProperties(
      createBuilderRequest({
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          txParamsOriginal: {
            ...createBuilderRequest().transactionMeta.txParams,
            to: '0x3333333333333333333333333333333333333333',
          },
          txParams: {
            ...createBuilderRequest().transactionMeta.txParams,
            to: '0x4444444444444444444444444444444444444444',
          },
          chainId: '0x1',
        } as never,
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getAddressSecurityAlertResponse,
        } as never,
      }),
    );

    expect(getAddressSecurityAlertResponse).toHaveBeenCalledWith(
      expect.stringContaining('0x3333333333333333333333333333333333333333'),
    );
    expect(result.properties.address_alert_response).toBe('Trusted');
    expect(result.properties.transaction_contract_verified).toBe(true);
  });

  it('returns the cached address alert response for a chain ID absent from the legacy mapping', async () => {
    const getAddressSecurityAlertResponseMock = jest
      .fn()
      .mockReturnValue({ result_type: 'Malicious' });

    const result = await getSecurityMetricsProperties(
      buildAddressAlertRequest({
        chainId: '0x123456789',
        getAddressSecurityAlertResponse: getAddressSecurityAlertResponseMock,
      }),
    );

    expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
      '0x123456789:0x2222222222222222222222222222222222222222',
    );
    expect(result.properties.address_alert_response).toBe('Malicious');
  });

  it('returns Loading when no cached response exists for the chain and address', async () => {
    const result = await getSecurityMetricsProperties(
      buildAddressAlertRequest({
        chainId: '0x123456789',
        getAddressSecurityAlertResponse: jest.fn().mockReturnValue(undefined),
      }),
    );

    expect(result.properties.address_alert_response).toBe('Loading');
  });

  it('returns not_applicable when the transaction has no chainId', async () => {
    const getAddressSecurityAlertResponseMock = jest
      .fn()
      .mockReturnValue({ result_type: 'Malicious' });

    const result = await getSecurityMetricsProperties(
      buildAddressAlertRequest({
        chainId: undefined,
        getAddressSecurityAlertResponse: getAddressSecurityAlertResponseMock,
      }),
    );

    expect(getAddressSecurityAlertResponseMock).not.toHaveBeenCalled();
    expect(result.properties.address_alert_response).toBe('not_applicable');
  });
});
