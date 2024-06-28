import {
  SOURCIFY_RESPONSE,
  TRANSACTION_DATA_SOURCIFY,
} from '../../../../../test/data/confirmations/transaction-decode';
import { decodeTransactionDataWithSourcify } from './sourcify';

const CONTRACT_ADDRESS_MOCK = '0x456';
const CHAIN_ID_MOCK = '0x123';

describe('Sourcify', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
  });

  describe('decodeTransactionDataWithSourcify', () => {
    it('returns expected data', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => SOURCIFY_RESPONSE,
      });

      const result = await decodeTransactionDataWithSourcify(
        TRANSACTION_DATA_SOURCIFY,
        CONTRACT_ADDRESS_MOCK,
        CHAIN_ID_MOCK,
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "description": "Transfer tokens",
          "name": "transfer",
          "params": [
            {
              "description": "The address to transfer to",
              "name": "to",
              "type": "address",
              "value": "0xec8507EcF7e946992294F06423A79835a3226846",
            },
            {
              "description": "The amount to transfer",
              "name": "value",
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
