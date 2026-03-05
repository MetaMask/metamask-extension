import { Hex } from '@metamask/utils';
import { TransactionParams } from '@metamask/transaction-controller';
import {
  buildBatchTransactionsFromTempoTransactionCalls,
  checkIsValidTempoTransaction,
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
const MOCK_TEMPO_CALLS = [
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
];

describe('tempo-tx-utils', () => {
  describe('isTempoTransactionType', () => {
    it('returns true in case of tempo transaction type', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
          chainId: MOCK_CHAIN_ID,
          type: '0x76',
        } as unknown as TransactionParams),
      ).toBe(true);
    });

    it('returns false in case of legacy transaction type', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
          chainId: MOCK_CHAIN_ID,
          type: '0x02',
        } as unknown as TransactionParams),
      ).toBe(false);
    });

    it('returns false when no `type` field', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
          chainId: MOCK_CHAIN_ID,
        } as unknown as TransactionParams),
      ).toBe(false);
    });
  });

  describe('checkIsValidTempoTransaction', () => {
    it('returns successfuly in case of well-formed tempo transaction type', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).not.toThrow();
    });

    it('throws when `type` not 0x76', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x02',
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(
        `Tempo Transaction: Transaction doesn't have Tempo transaction type (0x76)`,
      );
    });

    it('throws when `type` has invalid format', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: 118,
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(
        `Tempo Transaction: Transaction doesn't have Tempo transaction type (0x76)`,
      );
    });

    it('throws when `type` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(
        `Tempo Transaction: Transaction doesn't have Tempo transaction type (0x76)`,
      );
    });

    it('throws when `from` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'from'`);
    });

    it('throws when `from` is invalid', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: 1,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'from'`);
    });

    it('throws when `chainId` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'chainId'`);
    });

    it('throws when `chainId` is invalid', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: 42431,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'chainId'`);
    });

    it('throws when `calls` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });

    it('throws when `calls` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });

    it('throws when `calls` is an invalid type', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
          calls: {
            foo: 'bar',
          },
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });

    it('throws when `calls` is empty', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          chainId: MOCK_CHAIN_ID,
          calls: [],
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });
  });

  describe('buildBatchTransactionsFromTempoTransactionCalls', () => {
    it('extract batch-style params from Tempo transaction `calls` field', () => {
      const tempoTxParams = {
        calls: MOCK_TEMPO_CALLS,
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
