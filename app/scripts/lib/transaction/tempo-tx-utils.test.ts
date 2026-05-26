import { Hex } from '@metamask/utils';
import { TransactionParams } from '@metamask/transaction-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { NetworkController } from '@metamask/network-controller';
import { accountSupports7702 } from '../account-supports-7702';
import {
  buildBatchTransactionsFromTempoTransactionCalls,
  checkIsValidTempoTransaction,
  getAddTransactionSendCallExtraOptions,
  isTempoChain,
  isTempoTransactionType,
} from './tempo-tx-utils';

const MOCK_FEE_TOKEN = '0x20c000000000000000000000b9537d11c60e8b50' as Hex;
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

jest.mock('../account-supports-7702', () => ({
  accountSupports7702: jest.fn().mockResolvedValue(false),
}));

const mockAccountSupports7702 = accountSupports7702 as jest.MockedFunction<
  typeof accountSupports7702
>;

describe('tempo-tx-utils', () => {
  describe('isTempoTransactionType', () => {
    it('returns true in case of tempo transaction type', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
          type: '0x76',
        } as unknown as TransactionParams),
      ).toBe(true);
    });

    it('returns false in case of legacy transaction type', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
          type: '0x02',
        } as unknown as TransactionParams),
      ).toBe(false);
    });

    it('returns false when no `type` field', () => {
      expect(
        isTempoTransactionType({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
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
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).not.toThrow();
    });

    it('throws when `type` not 0x76', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x02',
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Transaction doesn't have type 0x76`);
    });

    it('throws when `type` has invalid format', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: 118,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Transaction doesn't have type 0x76`);
    });

    it('throws when `type` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Transaction doesn't have type 0x76`);
    });

    it('throws when `from` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          type: '0x76',
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'from'`);
    });

    it('throws when `from` is invalid', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: 1,
          type: '0x76',
          calls: MOCK_TEMPO_CALLS,
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'from'`);
    });

    it('throws when `calls` is missing', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });

    it('throws when `calls` is an invalid type', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          calls: { foo: 'bar' },
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });

    it('throws when `calls` is empty', () => {
      expect(() =>
        checkIsValidTempoTransaction({
          from: MOCK_FROM,
          type: '0x76',
          calls: [],
        } as unknown as TransactionParams),
      ).toThrow(`Tempo Transaction: Missing or invalid field 'calls'`);
    });
  });

  describe('buildBatchTransactionsFromTempoTransactionCalls', () => {
    it('extract batch-style params from Tempo transaction `calls` field', () => {
      const tempoTxParams = {
        calls: MOCK_TEMPO_CALLS,
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

  describe('isTempoChain', () => {
    it('return true for Tempo Mainnet', () => {
      expect(isTempoChain('0x1079')).toBe(true);
    });
    it('return true for Tempo Moderato Testnet', () => {
      expect(isTempoChain('0xa5bf')).toBe(true);
    });
    it('return false for Polygon Mainnet', () => {
      expect(isTempoChain('0x89')).toBe(false);
    });
  });

  describe('addTransactionSendCallExtraOptions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockAccountSupports7702.mockResolvedValue(false);
    });
    it('non-reg: returns {} if controllers are uninitalized', async () => {
      expect(
        await getAddTransactionSendCallExtraOptions({
          keyringController: {} as KeyringController,
          networkController: {} as NetworkController,
          req: {
            networkClientId: '123',
            params: [{ from: '0x123' }],
          },
        }),
      ).toEqual({});
      expect(mockAccountSupports7702).not.toHaveBeenCalled();
    });

    it('non-reg: returns {} params if NOT Tempo chain', async () => {
      expect(
        await getAddTransactionSendCallExtraOptions({
          keyringController: {} as KeyringController,
          networkController: {
            getNetworkConfigurationByNetworkClientId: () => ({
              chainId: '0x1', // not Tempo
            }),
          } as unknown as NetworkController,
          req: {
            networkClientId: '123',
            params: [{ from: '0x123' }],
          },
        }),
      ).toEqual({});
      expect(mockAccountSupports7702).not.toHaveBeenCalled();
    });

    it('tempo: returns {} params if Tempo chain but account doesnt support 7702', async () => {
      mockAccountSupports7702.mockResolvedValueOnce(false);
      expect(
        await getAddTransactionSendCallExtraOptions({
          keyringController: {} as KeyringController,
          networkController: {
            getNetworkConfigurationByNetworkClientId: () => ({
              chainId: '0x1079',
            }),
          } as unknown as NetworkController,
          req: {
            networkClientId: '123',
            params: [{ from: '0x123' }],
          },
        }),
      ).toEqual({});
      expect(mockAccountSupports7702).toHaveBeenCalledTimes(1);
    });

    it('tempo: returns Tempo params if Tempo chain', async () => {
      mockAccountSupports7702.mockResolvedValueOnce(true);
      expect(
        await getAddTransactionSendCallExtraOptions({
          keyringController: {} as KeyringController,
          networkController: {
            getNetworkConfigurationByNetworkClientId: () => ({
              chainId: '0x1079',
            }),
          } as unknown as NetworkController,
          req: {
            networkClientId: '123',
            params: [{ from: '0x123' }],
          },
        }),
      ).toEqual({
        excludeNativeTokenForFee: true,
        gasFeeToken: '0x20c0000000000000000000000000000000000000',
      });
      expect(mockAccountSupports7702).toHaveBeenCalledTimes(1);
    });
  });
});
