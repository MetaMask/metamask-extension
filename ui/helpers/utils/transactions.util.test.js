import { HttpProvider } from 'ethjs';
import nock from 'nock';
import {
  TransactionEnvelopeType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';
import * as utils from './transactions.util';

describe('Transactions utils', () => {
  describe('getStatusKey', () => {
    it('should return the correct status', () => {
      const tests = [
        {
          transaction: {
            status: TransactionStatus.confirmed,
            txReceipt: {
              status: '0x0',
            },
          },
          expected: TransactionStatus.failed,
        },
        {
          transaction: {
            status: TransactionStatus.confirmed,
            txReceipt: {
              status: '0x1',
            },
          },
          expected: TransactionStatus.confirmed,
        },
        {
          transaction: {
            status: TransactionGroupStatus.pending,
          },
          expected: TransactionGroupStatus.pending,
        },
      ];

      tests.forEach(({ transaction, expected }) => {
        expect(utils.getStatusKey(transaction)).toStrictEqual(expected);
      });
    });
  });

  describe('isLegacyTransaction', () => {
    it('should return true if transaction is type-0', () => {
      expect(
        utils.isLegacyTransaction({ type: TransactionEnvelopeType.legacy }),
      ).toStrictEqual(true);
    });
    it('should return false if transaction is not type-0', () => {
      expect(
        utils.isLegacyTransaction({
          type: TransactionEnvelopeType.feeMarket,
        }),
      ).toStrictEqual(false);
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
      expect(await utils.getMethodDataAsync('0xa22cb465', true)).toStrictEqual({
        name: 'Set Approval For All',
        params: [{ type: 'address' }, { type: 'bool' }],
      });
    });
  });
});
