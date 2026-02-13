import { getPerpsController } from '../../../../providers/perps/getPerpsController';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';

jest.mock('../../../../providers/perps/getPerpsController', () => ({
  getPerpsController: jest.fn(),
}));

const mockGetPerpsController = getPerpsController as jest.MockedFunction<
  typeof getPerpsController
>;

describe('createPerpsDepositTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a deposit transaction via the controller and returns the id', async () => {
    const depositWithConfirmation = jest.fn().mockResolvedValue(undefined);
    mockGetPerpsController.mockResolvedValue({
      depositWithConfirmation,
      state: { lastDepositTransactionId: 'tx-123' },
    } as unknown as Awaited<ReturnType<typeof getPerpsController>>);

    const result = await createPerpsDepositTransaction({
      fromAddress: '0xabc123',
      amount: '0.5',
    });

    expect(mockGetPerpsController).toHaveBeenCalledWith('0xabc123');
    expect(depositWithConfirmation).toHaveBeenCalledWith('0.5');
    expect(result).toStrictEqual({ transactionId: 'tx-123' });
  });

  it('throws if the controller does not provide a transaction id', async () => {
    const depositWithConfirmation = jest.fn().mockResolvedValue(undefined);
    mockGetPerpsController.mockResolvedValue({
      depositWithConfirmation,
      state: { lastDepositTransactionId: null },
    } as unknown as Awaited<ReturnType<typeof getPerpsController>>);

    await expect(
      createPerpsDepositTransaction({
        fromAddress: '0xabc123',
      }),
    ).rejects.toThrow(
      'Perps deposit transaction was not created by controller deposit flow',
    );
  });
});
