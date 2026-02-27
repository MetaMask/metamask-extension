import { submitRequestToBackground } from '../../../../store/background-connection';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

describe('createPerpsDepositTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a deposit transaction via the background and returns the id', async () => {
    mockSubmitRequestToBackground.mockResolvedValue('tx-123');

    const result = await createPerpsDepositTransaction({
      fromAddress: '0xabc123',
      amount: '0.5',
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDepositWithConfirmation',
      [{ amount: '0.5' }],
    );
    expect(result).toStrictEqual({ transactionId: 'tx-123' });
  });

  it('throws if the background does not return a transaction id', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(null);

    await expect(
      createPerpsDepositTransaction({
        fromAddress: '0xabc123',
      }),
    ).rejects.toThrow(
      'Perps deposit transaction was not created by controller deposit flow',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDepositWithConfirmation',
      [{ amount: undefined }],
    );
  });

  it('uses controller.depositWithConfirmation when controller is provided', async () => {
    const mockDepositWithConfirmation = jest
      .fn()
      .mockResolvedValue('tx-from-controller');
    const controller = {
      depositWithConfirmation: mockDepositWithConfirmation,
    };

    const result = await createPerpsDepositTransaction({
      fromAddress: '0xabc123',
      amount: '2',
      controller: controller as never,
    });

    expect(mockDepositWithConfirmation).toHaveBeenCalledWith({ amount: '2' });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ transactionId: 'tx-from-controller' });
  });

  it('throws when controller.depositWithConfirmation returns null', async () => {
    const mockDepositWithConfirmation = jest.fn().mockResolvedValue(null);
    const controller = {
      depositWithConfirmation: mockDepositWithConfirmation,
    };

    await expect(
      createPerpsDepositTransaction({
        fromAddress: '0xabc123',
        controller: controller as never,
      }),
    ).rejects.toThrow(
      'Perps deposit transaction was not created by controller deposit flow',
    );
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });
});
