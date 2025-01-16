import nock from 'nock';

import {
  FOUR_BYTE_RESPONSE,
  TRANSACTION_DATA_FOUR_BYTE,
} from '../../test/data/confirmations/transaction-decode';
import { getMethodDataAsync, getMethodFrom4Byte } from './four-byte';

const FOUR_BYTE_MOCK = TRANSACTION_DATA_FOUR_BYTE.slice(0, 10);

describe('Four Byte', () => {
  describe('getMethodFrom4Byte', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
    });

    it('returns signature with earliest creation date', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE,
      });

      const result = await getMethodFrom4Byte(FOUR_BYTE_MOCK);

      expect(result).toStrictEqual('someOtherFunction(address,uint256)');
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([undefined, null, '', '0x', '0X'])(
      'returns undefined if four byte prefix is %s',
      async (prefix: string) => {
        expect(await getMethodFrom4Byte(prefix)).toBeUndefined();
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['with hex prefix', '0x1234567'],
      ['without hex prefix', '1234567'],
    ])(
      'returns undefined if length of four byte prefix %s is less than 8',
      async (_: string, prefix: string) => {
        expect(await getMethodFrom4Byte(prefix)).toBeUndefined();
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['undefined', { results: undefined }],
      ['object', { results: {} }],
      ['empty', { results: [] }],
    ])(
      'returns `undefined` if fourByteResponse.results is %s',
      async (_: string, mockResponse: { results: unknown }) => {
        fetchMock.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await getMethodFrom4Byte('0x913aa952');

        expect(result).toBeUndefined();
      },
    );
  });

  describe('getMethodDataAsync', () => {
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
        name: 'setApprovalForAll',
        params: [{ type: 'address' }, { type: 'bool' }],
      });
    });
  });
});
