import { Hex } from '@metamask/utils';
import {
  buildBatchTransactionsFromTempoTransactionCalls,
  isTempoTransactionType,
} from './tempo-tx-utils';

const MOCK_FEE_TOKEN = '0x20c000000000000000000000b9537d11c60e8b50' as Hex;
const MOCK_CHAIN_ID = '0xa5bf' as Hex;
const MOCK_FROM = '0x13b7e6ebcd40777099e4c45d407745ab2de1d1f8' as Hex;
const MOCK_DEST_CONTRACT_ADDRESS =
  '0x86fa047df5b69df0cbd6df566f1468756dcf339d' as Hex;
const MOCK_CALLDATA_1 =
  '0xa9059cbb0000000000000000000000002367e6eca6e1fcc2d112133c896e3bddad375aff000000000000000000000000000000000000000000000000002386f26fc10000' as Hex;
const MOCK_CALLDATA_2 =
  '0xa9059cbb0000000000000000000000001e3abc74428056924ceee2f45f060879c3f063ed000000000000000000000000000000000000000000000000002386f26fc10000' as Hex;

describe('foo', () => {
  describe('isTempoTransactionType', () => {
    it('returns true in case of tempo transaction type', () => {
      expect(
        isTempoTransactionType({
          from: '0x13b7e6EBcd40777099E4c45d407745aB2de1D1F8',
          type: '0x76',
        }),
      ).toBe(true);
    });

    it('returns true in case of legacy transaction type', () => {
      expect(
        isTempoTransactionType({
          from: '0x13b7e6EBcd40777099E4c45d407745aB2de1D1F8',
          type: '0x02',
        }),
      ).toBe(false);
    });

    it('returns false when no `type` field', () => {
      expect(
        isTempoTransactionType({
          from: '0x13b7e6EBcd40777099E4c45d407745aB2de1D1F8',
        }),
      ).toBe(false);
    });
  });

  describe('buildBatchTransactionsFromTempoTransactionCalls', () => {
    it('extract batch-style params from Tempo transaction `calls` field', () => {
      const tempoTxParams = {
        calls: [
          {
            data: MOCK_CALLDATA_1,
            to: MOCK_DEST_CONTRACT_ADDRESS,
            value: '0x' as const,
          },
          {
            data: MOCK_CALLDATA_2,
            to: MOCK_DEST_CONTRACT_ADDRESS,
            value: '0x' as const,
          },
        ],
        chainId: MOCK_CHAIN_ID,
        feeToken: MOCK_FEE_TOKEN,
        from: MOCK_FROM,
        type: '0x76' as const, // Tempo in-house tx type.
      };

      const batchTxParams =
        buildBatchTransactionsFromTempoTransactionCalls(tempoTxParams);
      expect(batchTxParams).toEqual([
        {
          params: {
            data: MOCK_CALLDATA_1,
            to: MOCK_DEST_CONTRACT_ADDRESS,
            value: '0x0',
          },
        },
        {
          params: {
            data: MOCK_CALLDATA_2,
            to: MOCK_DEST_CONTRACT_ADDRESS,
            value: '0x0',
          },
        },
      ]);
    });
  });
});
