/* eslint-disable @typescript-eslint/naming-convention */
import { getAccountMetricsProperties } from './account';
import { createBuilderRequest } from './test-utils';

jest.mock('../../snap-keyring/metrics', () => ({
  getSnapAndHardwareInfoForMetrics: jest
    .fn()
    .mockResolvedValue({ snap_hardware: 'ledger' }),
}));

describe('account builder', () => {
  it('builds account and device related metrics', async () => {
    const result = await getAccountMetricsProperties(
      createBuilderRequest({
        transactionMetricsRequest: {
          ...createBuilderRequest().transactionMetricsRequest,
          getAccountType: jest.fn().mockResolvedValue('MetaMask'),
          getDeviceModel: jest.fn().mockResolvedValue('N/A'),
          getHDEntropyIndex: jest.fn().mockReturnValue(3),
        } as never,
      }),
    );

    expect(result.properties).toMatchObject({
      account_type: 'MetaMask',
      device_model: 'N/A',
      hd_entropy_index: 3,
      snap_hardware: 'ledger',
    });
    expect(result.sensitiveProperties).toStrictEqual({});
  });
});
