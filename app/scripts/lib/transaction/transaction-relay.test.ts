import {
  RelaySubmitRequest,
  submitRelayTransaction,
} from './transaction-relay';

const URL_MOCK = 'test.com/test';
const TRANSACTION_HASH_MOCK = '0x123';
const ERROR_STATUS_MOCK = 500;
const ERROR_BODY_MOCK = 'test error';

const SUBMIT_REQUEST_MOCK: RelaySubmitRequest = {
  data: '0x1',
  maxFeePerGas: '0x2',
  maxPriorityFeePerGas: '0x3',
  to: '0x4',
};

describe('Transaction Relay Utils', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.TRANSACTION_RELAY_API_URL = URL_MOCK;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    fetchMock = jest.spyOn(global, 'fetch').mockReturnValue({
      json: async () => Promise.resolve({ transactionHash: TRANSACTION_HASH_MOCK }),
      ok: true,
    });
  });

  describe('submitRelayTransaction', () => {
    it('submits request to API', async () => {
      await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(fetchMock).toHaveBeenCalledWith(
        URL_MOCK,
        expect.objectContaining({
          body: JSON.stringify(SUBMIT_REQUEST_MOCK),
        }),
      );
    });

    it('returns transaction hash from response if successful', async () => {
      const result = await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(result).toStrictEqual({
        transactionHash: TRANSACTION_HASH_MOCK,
      });
    });

    it('throws if response status it not successful', async () => {
      fetchMock.mockReturnValueOnce({
        ok: false,
        status: ERROR_STATUS_MOCK,
        text: async () => Promise.resolve(ERROR_BODY_MOCK),
      });

      await expect(submitRelayTransaction(SUBMIT_REQUEST_MOCK)).rejects.toThrow(
        `Transaction relay submit failed with status: ${ERROR_STATUS_MOCK} - ${ERROR_BODY_MOCK}`,
      );
    });
  });
});
