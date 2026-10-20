import { submitRequestToBackground } from '../background-connection';
import { updateTransactionGasFees } from './update-transaction-gas-fees';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('updateTransactionGasFees', () => {
  it('updates gas fees through the transaction controller messenger action', async () => {
    const transaction = { id: 'transaction-id' };
    mockSubmitRequestToBackground.mockResolvedValue(transaction);
    const dispatch = jest.fn();
    const getState = jest.fn();

    const result = await updateTransactionGasFees('transaction-id', {
      gasLimit: '0x5208',
    })(dispatch, getState, undefined);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'TransactionController:updateTransactionGasFees',
      ['transaction-id', { gasLimit: '0x5208' }],
    );
    expect(result).toBe(transaction);
  });
});
