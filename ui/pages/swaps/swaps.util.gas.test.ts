import { submitRequestToBackground } from '../../store/background-connection';
import { estimateGasFee } from './swaps.util.gas';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

describe('estimateGasFee', () => {
  beforeEach(() => {
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  it('returns gas fee estimates from the messenger', async () => {
    const response = { estimates: { gas: '0x5208' } };
    submitRequestToBackgroundMock.mockResolvedValue(response);
    const request = {
      transactionParams: { from: '0x123', to: '0x456', value: '0x1' },
      chainId: '0x1',
      networkClientId: 'mainnet',
    } as const;

    const result = await estimateGasFee(request);

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'TransactionController:estimateGasFee',
      [request],
    );
    expect(result).toBe(response);
  });
});
