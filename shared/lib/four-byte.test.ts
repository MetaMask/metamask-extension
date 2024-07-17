import { HttpProvider } from '@metamask/ethjs';
import nock from 'nock';

import {
  FOUR_BYTE_RESPONSE,
  TRANSACTION_DATA_FOUR_BYTE,
} from '../../test/data/confirmations/transaction-decode';
import { getMethodDataAsync, getMethodFrom4Byte } from './four-byte';

const FOUR_BYTE_MOCK = TRANSACTION_DATA_FOUR_BYTE.slice(0, 10);

describe('Four Byte', () => {
  const fetchMock = jest.fn();

  describe('getMethodFrom4Byte', () => {
    it('returns signature with earliest creation date', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE,
      });

      const result = await getMethodFrom4Byte(FOUR_BYTE_MOCK);

      expect(result).toStrictEqual('someOtherFunction(address,uint256)');
    });
  });

  describe('getMethodDataAsync', () => {
    global.ethereumProvider = new HttpProvider(
      'https://mainnet.infura.io/v3/341eacb578dd44a1a049cbc5f6fd4035',
    );
    it('returns a valid signature for setApprovalForAll when use4ByteResolution privacy setting is ON', async () => {
      nock('https://www.4byte.directory:443', { encodedQueryParams: true })
        .get('/api/v1/signatures/')
        .query({ hex_signature: '0xa22cb465' })
        .reply(200, {
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 841519,
              created_at: '2022-06-12T00:50:19.305588Z',
              text_signature: 'niceFunctionHerePlzClick943230089(address,bool)',
              hex_signature: '0xa22cb465',
              bytes_signature: '¢,´e',
            },
            {
              id: 29659,
              created_at: '2018-04-11T21:47:39.980645Z',
              text_signature: 'setApprovalForAll(address,bool)',
              hex_signature: '0xa22cb465',
              bytes_signature: '¢,´e',
            },
          ],
        });
      expect(await getMethodDataAsync('0xa22cb465', true)).toStrictEqual({
        name: 'Set Approval For All',
        params: [{ type: 'address' }, { type: 'bool' }],
      });
    });
  });
});
