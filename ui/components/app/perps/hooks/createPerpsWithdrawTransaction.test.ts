import { submitRequestToBackground } from '../../../../store/background-connection';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

describe('createPerpsWithdrawTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits withdraw request and returns result', async () => {
    mockSubmitRequestToBackground.mockResolvedValue({
      success: true,
      txHash: '0x123',
      withdrawalId: 'withdraw-1',
    });

    const result = await createPerpsWithdrawTransaction({
      amount: '12.5',
      assetId:
        'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831/default',
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsWithdraw',
      [
        {
          amount: '12.5',
          assetId:
            'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831/default',
        },
      ],
    );
    expect(result).toStrictEqual({
      success: true,
      txHash: '0x123',
      withdrawalId: 'withdraw-1',
    });
  });

  it('propagates background errors', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      new Error('withdraw failed'),
    );

    await expect(
      createPerpsWithdrawTransaction({
        amount: '1',
        assetId:
          'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831/default',
      }),
    ).rejects.toThrow('withdraw failed');
  });
});
