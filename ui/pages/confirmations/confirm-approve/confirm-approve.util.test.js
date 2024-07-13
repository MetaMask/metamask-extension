import { getCustomTxParamsData } from './confirm-approve.util';

describe('getCustomTxParamsData', () => {
  it('should handle approvals with calldata tags', async () => {
    const approvalCalldata =
      '0x095ea7b3000000000000000000000000fffbf65b0c8045edf8ca269a3b47a6c0b29e0ebf00000000000000000000000000000000000000000000002a1f0a87470e840000fc000023c0';
    expect(
      getCustomTxParamsData(approvalCalldata, {
        customPermissionAmount: '0.1',
        decimals: 18,
      }),
    ).toBe(
      '0x095ea7b3000000000000000000000000fffbf65b0c8045edf8ca269a3b47a6c0b29e0ebf000000000000000000000000000000000000000000000000016345785d8a0000fc000023c0',
    );
  });

  it('should handle approvals without calldata tags', async () => {
    const approvalCalldata =
      '0x095ea7b3000000000000000000000000fffbf65b0c8045edf8ca269a3b47a6c0b29e0ebf00000000000000000000000000000000000000000000002a1f0a87470e840000';
    expect(
      getCustomTxParamsData(approvalCalldata, {
        customPermissionAmount: '0.1',
        decimals: 18,
      }),
    ).toBe(
      '0x095ea7b3000000000000000000000000fffbf65b0c8045edf8ca269a3b47a6c0b29e0ebf000000000000000000000000000000000000000000000000016345785d8a0000',
    );
  });

  it('should throw when approval value has invalid length', async () => {
    const approvalCalldata =
      '0x095ea7b3000000000000000000000000fffbf65b0c8045edf8ca269a3b47a6c0b29e0ebf00000000000000000000000000000000000000000000002a1f0a87470e8400';
    expect(() =>
      getCustomTxParamsData(approvalCalldata, {
        customPermissionAmount: '0.1',
        decimals: 18,
      }),
    ).toThrow('Invalid data');
  });
});
