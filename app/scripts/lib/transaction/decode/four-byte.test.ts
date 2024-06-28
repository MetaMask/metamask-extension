import {
  FOUR_BYTE_RESPONSE,
  TRANSACTION_DATA_FOUR_BYTE,
} from '../../../../../test/data/confirmations/transaction-decode';
import { decodeTransactionDataWithFourByte } from './four-byte';

describe('Four Byte', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
  });

  describe('decodeTransactionDataWithFourByte', () => {
    it('returns expected data', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE,
      });

      const result = await decodeTransactionDataWithFourByte(
        TRANSACTION_DATA_FOUR_BYTE,
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "name": "someOtherFunction",
          "params": [
            {
              "type": "address",
              "value": "0xec8507EcF7e946992294F06423A79835a3226846",
            },
            {
              "type": "uint256",
              "value": {
                "hex": "0x64",
                "type": "BigNumber",
              },
            },
          ],
        }
      `);
    });
  });
});
