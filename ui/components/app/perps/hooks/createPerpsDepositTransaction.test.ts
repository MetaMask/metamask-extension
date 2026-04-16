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

    await expect(createPerpsDepositTransaction({})).rejects.toThrow(
      'Perps deposit transaction was not created by controller deposit flow',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDepositWithConfirmation',
      [{ amount: undefined }],
    );
  });
});
