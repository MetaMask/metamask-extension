import { submitRequestToBackground } from '../background-connection';
import {
  isAtomicBatchSupported,
  updateAtomicBatchData,
  updateBatchTransactions,
  updateSelectedGasFeeToken,
} from './transaction-controller';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('transaction controller actions', () => {
  it('checks atomic batch support through the transaction controller messenger action', async () => {
    const request = { chainId: '0x1' };
    mockSubmitRequestToBackground.mockResolvedValue({ supported: true });

    // @ts-expect-error Only the forwarded chain ID matters in this action test.
    const result = await isAtomicBatchSupported(request);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'TransactionController:isAtomicBatchSupported',
      [request],
    );
    expect(result).toStrictEqual({ supported: true });
  });

  it('updates atomic batch data through the transaction controller messenger action', async () => {
    const request = { transactionId: 'transaction-id' };

    // @ts-expect-error Only the forwarded transaction ID matters in this action test.
    await updateAtomicBatchData(request);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'TransactionController:updateAtomicBatchData',
      [request],
    );
  });

  it('updates batched transactions through the transaction controller messenger action', async () => {
    const args = {
      transactionId: 'transaction-id',
      batchTransactions: [],
    };

    await updateBatchTransactions(args);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'updateBatchTransactions',
      [args],
    );
  });

  it('updates the selected gas fee token through the transaction controller messenger action', async () => {
    await updateSelectedGasFeeToken(
      'transaction-id',
      '0x0000000000000000000000000000000000000001',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'TransactionController:updateSelectedGasFeeToken',
      ['transaction-id', '0x0000000000000000000000000000000000000001'],
    );
  });
});
