import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type {
  TransactionPayRequiredToken,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { Asset, AssetStandard } from '../types/send';
import {
  hasTransactionType,
  getTokenTransferData,
  getTokenAddress,
  getAvailableTokens,
} from './transaction-pay';

const CHAIN_ID_MOCK = '0x1' as Hex;
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const TOKEN_ADDRESS_2_MOCK =
  '0xabcdef1234567890abcdef1234567890abcdef12' as Hex;
const NATIVE_ADDRESS_MOCK = '0x0000000000000000000000000000000000000000' as Hex;
const TOKEN_TRANSFER_DATA_MOCK =
  '0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef123456780000000000000000000000000000000000000000000000000de0b6b3a7640000' as Hex;

function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    address: TOKEN_ADDRESS_MOCK,
    balance: '1000000000000000000',
    chainId: CHAIN_ID_MOCK,
    standard: AssetStandard.ERC20,
    accountType: 'eip155:eoa' as Asset['accountType'],
    symbol: 'TST',
    decimals: 18,
    ...overrides,
  };
}

function createMockPaymentToken(
  overrides: Partial<TransactionPaymentToken> = {},
): TransactionPaymentToken {
  return {
    address: TOKEN_ADDRESS_MOCK,
    balanceFiat: '100.00',
    balanceHuman: '50',
    balanceRaw: '50000000000000000000',
    balanceUsd: '100.00',
    chainId: CHAIN_ID_MOCK,
    decimals: 18,
    symbol: 'TST',
    ...overrides,
  };
}

function createMockRequiredToken(
  overrides: Partial<TransactionPayRequiredToken> = {},
): TransactionPayRequiredToken {
  return {
    address: TOKEN_ADDRESS_MOCK,
    allowUnderMinimum: false,
    amountFiat: '10.00',
    amountHuman: '5',
    amountRaw: '5000000000000000000',
    amountUsd: '10.00',
    balanceFiat: '100.00',
    balanceHuman: '50',
    balanceRaw: '50000000000000000000',
    balanceUsd: '100.00',
    chainId: CHAIN_ID_MOCK,
    decimals: 18,
    skipIfBalance: false,
    symbol: 'TST',
    ...overrides,
  };
}

describe('transaction-pay utils', () => {
  describe('hasTransactionType', () => {
    it('returns true when transaction type matches', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [TransactionType.simpleSend]),
      ).toBe(true);
    });

    it('returns true when transaction type is in the list', () => {
      const transactionMeta = {
        type: TransactionType.tokenMethodTransfer,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [
          TransactionType.simpleSend,
          TransactionType.tokenMethodTransfer,
        ]),
      ).toBe(true);
    });

    it('returns false when transaction type does not match', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [
          TransactionType.tokenMethodTransfer,
        ]),
      ).toBe(false);
    });

    it('returns false when transactionMeta is undefined', () => {
      expect(hasTransactionType(undefined, [TransactionType.simpleSend])).toBe(
        false,
      );
    });
  });

  describe('getTokenTransferData', () => {
    it('returns token transfer data from txParams when data starts with transfer selector', () => {
      const transactionMeta = {
        txParams: {
          data: TOKEN_TRANSFER_DATA_MOCK,
          to: TOKEN_ADDRESS_MOCK,
        },
      } as TransactionMeta;

      const result = getTokenTransferData(transactionMeta);

      expect(result).toStrictEqual({
        data: TOKEN_TRANSFER_DATA_MOCK,
        to: TOKEN_ADDRESS_MOCK,
        index: undefined,
      });
    });

    it('returns undefined when data does not start with transfer selector', () => {
      const transactionMeta = {
        txParams: {
          data: '0x12345678',
          to: TOKEN_ADDRESS_MOCK,
        },
      } as TransactionMeta;

      expect(getTokenTransferData(transactionMeta)).toBeUndefined();
    });

    it('returns undefined when to address is missing', () => {
      const transactionMeta = {
        txParams: {
          data: TOKEN_TRANSFER_DATA_MOCK,
        },
      } as TransactionMeta;

      expect(getTokenTransferData(transactionMeta)).toBeUndefined();
    });

    it('returns token transfer data from nested transactions', () => {
      const transactionMeta = {
        txParams: {
          data: '0x12345678',
          to: TOKEN_ADDRESS_MOCK,
        },
        nestedTransactions: [
          { data: '0xother', to: TOKEN_ADDRESS_2_MOCK },
          { data: TOKEN_TRANSFER_DATA_MOCK, to: TOKEN_ADDRESS_MOCK },
        ],
      } as unknown as TransactionMeta;

      const result = getTokenTransferData(transactionMeta);

      expect(result).toStrictEqual({
        data: TOKEN_TRANSFER_DATA_MOCK,
        to: TOKEN_ADDRESS_MOCK,
        index: 1,
      });
    });

    it('returns undefined when transactionMeta is undefined', () => {
      expect(getTokenTransferData(undefined)).toBeUndefined();
    });
  });

  describe('getTokenAddress', () => {
    it('returns to address from nested transaction when token transfer data exists', () => {
      const transactionMeta = {
        txParams: {
          data: '0x12345678',
          to: TOKEN_ADDRESS_2_MOCK,
        },
        nestedTransactions: [
          { data: TOKEN_TRANSFER_DATA_MOCK, to: TOKEN_ADDRESS_MOCK },
        ],
      } as unknown as TransactionMeta;

      expect(getTokenAddress(transactionMeta)).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('returns to address from txParams when no token transfer data', () => {
      const transactionMeta = {
        txParams: {
          data: '0x12345678',
          to: TOKEN_ADDRESS_MOCK,
        },
      } as TransactionMeta;

      expect(getTokenAddress(transactionMeta)).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('returns undefined when transactionMeta is undefined', () => {
      expect(getTokenAddress(undefined)).toBeUndefined();
    });
  });

  describe('getAvailableTokens', () => {
    it('filters out non-ERC20 tokens', () => {
      const tokens = [
        createMockAsset({ standard: AssetStandard.Native }),
        createMockAsset({ standard: AssetStandard.ERC721 }),
        createMockAsset({
          standard: AssetStandard.ERC20,
          address: TOKEN_ADDRESS_MOCK,
        }),
      ];

      const result = getAvailableTokens({ tokens });

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('filters out tokens without eip155 account type', () => {
      const tokens = [
        createMockAsset({
          accountType: 'bip122:p2wpkh' as Asset['accountType'],
        }),
        createMockAsset({
          accountType: 'eip155:eoa' as Asset['accountType'],
          address: TOKEN_ADDRESS_MOCK,
        }),
      ];

      const result = getAvailableTokens({ tokens });

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('includes selected pay token even with zero balance', () => {
      const payToken = createMockPaymentToken({ address: TOKEN_ADDRESS_MOCK });
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK, balance: '0' }),
      ];

      const result = getAvailableTokens({ payToken, tokens });

      expect(result).toHaveLength(1);
      expect(result[0].isSelected).toBe(true);
    });

    it('includes required tokens even with zero balance', () => {
      const requiredTokens = [
        createMockRequiredToken({
          address: TOKEN_ADDRESS_MOCK,
          skipIfBalance: false,
        }),
      ];
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK, balance: '0' }),
      ];

      const result = getAvailableTokens({ requiredTokens, tokens });

      expect(result).toHaveLength(1);
    });

    it('excludes required tokens with skipIfBalance set to true', () => {
      const requiredTokens = [
        createMockRequiredToken({
          address: TOKEN_ADDRESS_MOCK,
          skipIfBalance: true,
        }),
      ];
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK, balance: '0' }),
      ];

      const result = getAvailableTokens({ requiredTokens, tokens });

      expect(result).toHaveLength(0);
    });

    it('excludes tokens with zero balance when not selected or required', () => {
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK, balance: '0' }),
        createMockAsset({ address: TOKEN_ADDRESS_2_MOCK, balance: '1000' }),
      ];

      const result = getAvailableTokens({ tokens });

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(TOKEN_ADDRESS_2_MOCK);
    });

    it('marks token as disabled when no native balance', () => {
      const tokens = [createMockAsset({ address: TOKEN_ADDRESS_MOCK })];

      const result = getAvailableTokens({ tokens });

      expect(result[0].disabled).toBe(true);
    });

    it('marks token as enabled when native token has balance', () => {
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK }),
        createMockAsset({
          address: NATIVE_ADDRESS_MOCK,
          balance: '1000000000000000000',
        }),
      ];

      const result = getAvailableTokens({ tokens });

      const erc20Token = result.find((t) => t.address === TOKEN_ADDRESS_MOCK);
      expect(erc20Token?.disabled).toBe(false);
    });

    it('marks selected token with isSelected true', () => {
      const payToken = createMockPaymentToken({ address: TOKEN_ADDRESS_MOCK });
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK }),
        createMockAsset({ address: TOKEN_ADDRESS_2_MOCK }),
      ];

      const result = getAvailableTokens({ payToken, tokens });

      const selectedToken = result.find(
        (t) => t.address === TOKEN_ADDRESS_MOCK,
      );
      const otherToken = result.find((t) => t.address === TOKEN_ADDRESS_2_MOCK);

      expect(selectedToken?.isSelected).toBe(true);
      expect(otherToken?.isSelected).toBe(false);
    });

    it('returns empty array when tokens is empty', () => {
      const result = getAvailableTokens({ tokens: [] });

      expect(result).toHaveLength(0);
    });
  });
});
