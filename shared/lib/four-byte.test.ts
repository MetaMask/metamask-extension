import {
  FOUR_BYTE_RESPONSE,
  TRANSACTION_DATA_FOUR_BYTE,
} from '../../test/data/confirmations/transaction-decode';
import { getMethodFrom4Byte } from './four-byte';

const FOUR_BYTE_MOCK = TRANSACTION_DATA_FOUR_BYTE.slice(0, 10);

describe('Four Byte', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
  });

  describe('getMethodFrom4Byte', () => {
    it('returns signature with earliest creation date', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE,
      });

      const result = await getMethodFrom4Byte(FOUR_BYTE_MOCK);

      expect(result).toStrictEqual('someOtherFunction(address,uint256)');
    });
  });
});
