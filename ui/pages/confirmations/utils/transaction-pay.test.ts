import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  PaymentOverride,
  type EvmPaymentToken,
  type NonEvmPaymentToken,
  type TransactionPayRequiredToken,
} from '@metamask/transaction-pay-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { updateAtomicBatchData } from '../../../store/controller-actions/transaction-controller';
import { Asset, AssetStandard } from '../types/send';
import {
  getTokenTransferData,
  getTokenAddress,
  getAvailableTokens,
  getEvmPaymentToken,
  getPaymentTokenKey,
  isMoneyAccountFunding,
  isPaymentTokenSelected,
  isSolanaPaySource,
  isTokenBlocked,
  replaceAccountInNestedTransactions,
} from './transaction-pay';

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  updateAtomicBatchData: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x1' as Hex;
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const TOKEN_ADDRESS_2_MOCK =
  '0xabcdef1234567890abcdef1234567890abcdef12' as Hex;
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
  overrides: Partial<EvmPaymentToken> = {},
): EvmPaymentToken {
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

const SOLANA_CHAIN_ID_MOCK = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_ACCOUNT_ID_MOCK = 'solana-account-id';
const SOL_ASSET_ID_MOCK = `${SOLANA_CHAIN_ID_MOCK}/slip44:501`;
const USDC_SPL_ASSET_ID_MOCK = `${SOLANA_CHAIN_ID_MOCK}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;

function createMockSolanaAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    accountId: SOLANA_ACCOUNT_ID_MOCK,
    accountType: 'solana:data-account' as Asset['accountType'],
    assetId: SOL_ASSET_ID_MOCK,
    balance: '1.5',
    chainId: SOLANA_CHAIN_ID_MOCK,
    decimals: 9,
    isNative: true,
    standard: AssetStandard.Native,
    symbol: 'SOL',
    ...overrides,
  };
}

function createMockSolanaPaymentToken(
  overrides: Partial<NonEvmPaymentToken> = {},
): NonEvmPaymentToken {
  return {
    accountId: `${SOLANA_CHAIN_ID_MOCK}:SoLAddress111111111111111111111111111111111`,
    assetId: SOL_ASSET_ID_MOCK,
    balanceFiat: '150.00',
    balanceHuman: '1.5',
    balanceRaw: '1500000000',
    balanceUsd: '150.00',
    chainId: SOLANA_CHAIN_ID_MOCK,
    decimals: 9,
    symbol: 'SOL',
    walletAccountId: SOLANA_ACCOUNT_ID_MOCK,
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

    it('returns the required asset for a deposit batch targeting the vault', () => {
      const transactionMeta = {
        txParams: {
          to: TOKEN_ADDRESS_2_MOCK,
        },
        nestedTransactions: [
          { to: TOKEN_ADDRESS_MOCK },
          { to: TOKEN_ADDRESS_2_MOCK },
        ],
        requiredAssets: [{ address: TOKEN_ADDRESS_MOCK }],
      } as unknown as TransactionMeta;

      expect(getTokenAddress(transactionMeta)).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('prefers token transfer data over the required asset', () => {
      const transactionMeta = {
        txParams: {
          data: '0x12345678',
          to: TOKEN_ADDRESS_2_MOCK,
        },
        nestedTransactions: [
          { data: TOKEN_TRANSFER_DATA_MOCK, to: TOKEN_ADDRESS_MOCK },
        ],
        requiredAssets: [{ address: TOKEN_ADDRESS_2_MOCK }],
      } as unknown as TransactionMeta;

      expect(getTokenAddress(transactionMeta)).toBe(TOKEN_ADDRESS_MOCK);
    });

    it('returns undefined when transactionMeta is undefined', () => {
      expect(getTokenAddress(undefined)).toBeUndefined();
    });
  });

  describe('getAvailableTokens', () => {
    it('filters out NFT tokens but keeps native and ERC20', () => {
      const tokens = [
        createMockAsset({
          standard: AssetStandard.Native,
          address: '0xnative',
        }),
        createMockAsset({ standard: AssetStandard.ERC721 }),
        createMockAsset({ standard: AssetStandard.ERC1155 }),
        createMockAsset({
          standard: AssetStandard.ERC20,
          address: TOKEN_ADDRESS_MOCK,
        }),
      ];

      const result = getAvailableTokens({ tokens });

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.address)).toStrictEqual([
        '0xnative',
        TOKEN_ADDRESS_MOCK,
      ]);
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

    it('marks blocked tokens as disabled and sorts them last', () => {
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK }),
        createMockAsset({ address: TOKEN_ADDRESS_2_MOCK }),
      ];

      const result = getAvailableTokens({
        tokens,
        blockedTokens: {
          chainIds: [],
          tokens: [{ address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK }],
        },
      });

      expect(result[0].address).toBe(TOKEN_ADDRESS_2_MOCK);
      expect(result[0].disabled).toBe(false);
      expect(result[1].address).toBe(TOKEN_ADDRESS_MOCK);
      expect(result[1].disabled).toBe(true);
    });

    it('marks all tokens on a blocked chain as disabled', () => {
      const tokens = [
        createMockAsset({ address: TOKEN_ADDRESS_MOCK, chainId: '0xa4b1' }),
      ];

      const result = getAvailableTokens({
        tokens,
        blockedTokens: {
          chainIds: ['0xa4b1'],
          tokens: [],
        },
      });

      expect(result[0].disabled).toBe(true);
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

    it('excludes tokens on testnet chains, keeping mainnet tokens', () => {
      const tokens = [
        createMockAsset({
          address: TOKEN_ADDRESS_MOCK,
          chainId: CHAIN_IDS.SEPOLIA,
        }),
        createMockAsset({
          address: TOKEN_ADDRESS_MOCK,
          chainId: CHAIN_IDS.LINEA_SEPOLIA,
        }),
        createMockAsset({
          address: TOKEN_ADDRESS_2_MOCK,
          chainId: CHAIN_IDS.MAINNET,
        }),
      ];

      const result = getAvailableTokens({ tokens });

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(TOKEN_ADDRESS_2_MOCK);
      expect(result[0].chainId).toBe(CHAIN_IDS.MAINNET);
    });

    it('excludes testnet tokens even when selected as the pay token', () => {
      const payToken = createMockPaymentToken({
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_IDS.SEPOLIA,
      });
      const tokens = [
        createMockAsset({
          address: TOKEN_ADDRESS_MOCK,
          chainId: CHAIN_IDS.SEPOLIA,
          balance: '1000000000000000000',
        }),
      ];

      const result = getAvailableTokens({ payToken, tokens });

      expect(result).toHaveLength(0);
    });

    describe('Solana sources', () => {
      it('lists Solana SOL and SPL balances when Solana Pay is enabled', () => {
        const tokens = [
          createMockSolanaAsset(),
          createMockSolanaAsset({
            assetId: USDC_SPL_ASSET_ID_MOCK,
            isNative: false,
            standard: AssetStandard.ERC20,
            symbol: 'USDC',
          }),
          createMockAsset(),
        ];

        const result = getAvailableTokens({ tokens, isSolanaPayEnabled: true });

        expect(result.map((token) => token.symbol)).toStrictEqual([
          'SOL',
          'USDC',
          'TST',
        ]);
      });

      it('hides Solana balances when Solana Pay is disabled', () => {
        const tokens = [createMockSolanaAsset(), createMockAsset()];

        const result = getAvailableTokens({ tokens });

        expect(result.map((token) => token.symbol)).toStrictEqual(['TST']);
      });

      it('keeps the selected Solana source visible after Solana Pay is disabled', () => {
        const tokens = [
          createMockSolanaAsset(),
          createMockSolanaAsset({
            assetId: USDC_SPL_ASSET_ID_MOCK,
            symbol: 'USDC',
          }),
        ];

        const result = getAvailableTokens({
          payToken: createMockSolanaPaymentToken(),
          tokens,
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ symbol: 'SOL', isSelected: true });
      });

      it('hides zero-balance Solana assets that are not selected', () => {
        const result = getAvailableTokens({
          tokens: [createMockSolanaAsset({ balance: '0' })],
          isSolanaPayEnabled: true,
        });

        expect(result).toHaveLength(0);
      });

      it('hides Solana devnet assets', () => {
        const result = getAvailableTokens({
          tokens: [
            createMockSolanaAsset({
              chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
            }),
          ],
          isSolanaPayEnabled: true,
        });

        expect(result).toHaveLength(0);
      });

      it('does not change the EVM output when Solana Pay is enabled', () => {
        const tokens = [
          createMockAsset({ address: TOKEN_ADDRESS_MOCK }),
          createMockAsset({ address: TOKEN_ADDRESS_2_MOCK, balance: '0' }),
          createMockAsset({
            accountType: 'bip122:p2wpkh' as Asset['accountType'],
          }),
        ];
        const payToken = createMockPaymentToken();

        expect(
          getAvailableTokens({ payToken, tokens, isSolanaPayEnabled: true }),
        ).toStrictEqual(getAvailableTokens({ payToken, tokens }));
      });
    });
  });

  describe('isSolanaPaySource', () => {
    it('returns true for a Solana mainnet asset held by a Solana account', () => {
      expect(isSolanaPaySource(createMockSolanaAsset())).toBe(true);
    });

    it('returns false for EVM assets and assets without an account', () => {
      expect(isSolanaPaySource(createMockAsset())).toBe(false);
      expect(
        isSolanaPaySource(createMockSolanaAsset({ accountId: undefined })),
      ).toBe(false);
    });
  });

  describe('isPaymentTokenSelected', () => {
    it('matches a non-EVM payment token by asset and account', () => {
      const payToken = createMockSolanaPaymentToken();

      expect(isPaymentTokenSelected(createMockSolanaAsset(), payToken)).toBe(
        true,
      );
      expect(
        isPaymentTokenSelected(
          createMockSolanaAsset({ accountId: 'other-account' }),
          payToken,
        ),
      ).toBe(false);
      expect(
        isPaymentTokenSelected(
          createMockSolanaAsset({ assetId: USDC_SPL_ASSET_ID_MOCK }),
          payToken,
        ),
      ).toBe(false);
    });

    it('matches an EVM payment token by address and chain', () => {
      expect(
        isPaymentTokenSelected(createMockAsset(), createMockPaymentToken()),
      ).toBe(true);
      expect(isPaymentTokenSelected(createMockAsset(), undefined)).toBe(false);
    });
  });

  describe('getEvmPaymentToken', () => {
    it('returns EVM payment tokens and drops non-EVM ones', () => {
      const evmPaymentToken = createMockPaymentToken();

      expect(getEvmPaymentToken(evmPaymentToken)).toBe(evmPaymentToken);
      expect(
        getEvmPaymentToken(createMockSolanaPaymentToken()),
      ).toBeUndefined();
      expect(getEvmPaymentToken(undefined)).toBeUndefined();
    });
  });

  describe('getPaymentTokenKey', () => {
    it('keys non-EVM tokens by account and asset and EVM tokens by address and chain', () => {
      expect(getPaymentTokenKey(createMockSolanaPaymentToken())).toBe(
        `${SOLANA_ACCOUNT_ID_MOCK}:${SOL_ASSET_ID_MOCK}`,
      );
      expect(getPaymentTokenKey(createMockPaymentToken())).toBe(
        `${TOKEN_ADDRESS_MOCK}:${CHAIN_ID_MOCK}`,
      );
      expect(getPaymentTokenKey(undefined)).toBe(':');
    });
  });

  describe('isMoneyAccountFunding', () => {
    const depositTransaction = {
      type: TransactionType.moneyAccountDeposit,
    } as TransactionMeta;

    it('returns true for the Money Account override', () => {
      expect(
        isMoneyAccountFunding({
          paymentOverride: PaymentOverride.MoneyAccount,
          payToken: createMockPaymentToken(),
          transactionMeta: depositTransaction,
        }),
      ).toBe(true);
    });

    it('returns false for a Money Account deposit funded from Solana', () => {
      expect(
        isMoneyAccountFunding({
          paymentOverride: PaymentOverride.MoneyAccount,
          payToken: createMockSolanaPaymentToken(),
          transactionMeta: depositTransaction,
        }),
      ).toBe(false);
    });

    it('returns false without the Money Account override', () => {
      expect(
        isMoneyAccountFunding({
          payToken: createMockPaymentToken(),
          transactionMeta: depositTransaction,
        }),
      ).toBe(false);
    });
  });

  describe('isTokenBlocked', () => {
    it('returns false when no blocklist is provided', () => {
      expect(
        isTokenBlocked({ address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK }),
      ).toBe(false);
    });

    it('returns true when the token chain is blocked', () => {
      expect(
        isTokenBlocked(
          { address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK },
          { chainIds: [CHAIN_ID_MOCK], tokens: [] },
        ),
      ).toBe(true);
    });

    it('returns true when the token address and chain are blocked', () => {
      expect(
        isTokenBlocked(
          { address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK },
          {
            chainIds: [],
            tokens: [{ address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK }],
          },
        ),
      ).toBe(true);
    });

    it('returns false when the token is not in the blocklist', () => {
      expect(
        isTokenBlocked(
          { address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK },
          {
            chainIds: ['0xa4b1'],
            tokens: [{ address: TOKEN_ADDRESS_2_MOCK, chainId: CHAIN_ID_MOCK }],
          },
        ),
      ).toBe(false);
    });

    it('returns false when the token is missing an address or chain id', () => {
      expect(
        isTokenBlocked(
          { address: TOKEN_ADDRESS_MOCK },
          {
            chainIds: [],
            tokens: [{ address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK }],
          },
        ),
      ).toBe(false);

      expect(
        isTokenBlocked(
          { chainId: CHAIN_ID_MOCK },
          {
            chainIds: [],
            tokens: [{ address: TOKEN_ADDRESS_MOCK, chainId: CHAIN_ID_MOCK }],
          },
        ),
      ).toBe(false);
    });
  });

  describe('replaceAccountInNestedTransactions', () => {
    const TRANSACTION_ID = 'tx-1';
    const OLD_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const NEW_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const OLD_WORD =
      '000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const NEW_WORD =
      '000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const SELECTOR = '0x23b872dd';

    const updateAtomicBatchDataMock = jest.mocked(updateAtomicBatchData);

    beforeEach(() => {
      updateAtomicBatchDataMock.mockReset();
      updateAtomicBatchDataMock.mockResolvedValue(undefined);
    });

    it('replaces the old address word in nested transaction data', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [{ data: `${SELECTOR}${OLD_WORD}` as Hex }],
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).toHaveBeenCalledTimes(1);
      expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        transactionIndex: 0,
        transactionData: `${SELECTOR}${NEW_WORD}`,
      });
    });

    it('replaces every occurrence within the same nested transaction data', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [
          { data: `${SELECTOR}${OLD_WORD}${OLD_WORD}` as Hex },
        ],
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        transactionIndex: 0,
        transactionData: `${SELECTOR}${NEW_WORD}${NEW_WORD}`,
      });
    });

    it('matches address case-insensitively and writes lowercase output', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [
          { data: `${SELECTOR}${OLD_WORD.toUpperCase()}` as Hex },
        ],
        oldAddress: OLD_ADDRESS.toUpperCase(),
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        transactionIndex: 0,
        transactionData: `${SELECTOR}${NEW_WORD}`,
      });
    });

    it('preserves the original index when only some nested transactions match', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [
          { data: '0xdeadbeef' as Hex },
          { data: `${SELECTOR}${OLD_WORD}` as Hex },
          { data: undefined },
        ],
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).toHaveBeenCalledTimes(1);
      expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
        transactionId: TRANSACTION_ID,
        transactionIndex: 1,
        transactionData: `${SELECTOR}${NEW_WORD}`,
      });
    });

    it('does nothing when oldAddress is undefined', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [{ data: `${SELECTOR}${OLD_WORD}` as Hex }],
        oldAddress: undefined,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('does nothing when nestedTransactions is undefined or empty', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: undefined,
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [],
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('does nothing when old and new addresses are the same', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [{ data: `${SELECTOR}${OLD_WORD}` as Hex }],
        oldAddress: OLD_ADDRESS,
        newAddress: OLD_ADDRESS.toUpperCase(),
      });

      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('skips nested transactions whose data does not contain the old word', async () => {
      await replaceAccountInNestedTransactions({
        transactionId: TRANSACTION_ID,
        nestedTransactions: [{ data: '0xdeadbeef' as Hex }],
        oldAddress: OLD_ADDRESS,
        newAddress: NEW_ADDRESS,
      });

      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('propagates when updateAtomicBatchData rejects', async () => {
      const error = new Error('boom');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      updateAtomicBatchDataMock.mockRejectedValueOnce(error);

      await expect(
        replaceAccountInNestedTransactions({
          transactionId: TRANSACTION_ID,
          nestedTransactions: [{ data: `${SELECTOR}${OLD_WORD}` as Hex }],
          oldAddress: OLD_ADDRESS,
          newAddress: NEW_ADDRESS,
        }),
      ).rejects.toThrow('boom');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update account in nested transaction',
        error,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
