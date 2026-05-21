import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import {
  hasAvailableMetaMaskPayBalance,
  hasZeroArbitrumUsdcBalance,
  hasZeroHyperliquidPerpsBalance,
  isHyperliquidDepositPromptEligible,
} from './hyperliquid-deposit-eligibility';

const SIGNER_ADDRESS = '0x1111111111111111111111111111111111111111';
const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222';

describe('hyperliquid-deposit-eligibility', () => {
  describe('hasZeroHyperliquidPerpsBalance', () => {
    it('returns true when fetched Hyperliquid account state has zero balance', () => {
      expect(
        hasZeroHyperliquidPerpsBalance({
          accountState: {
            availableBalance: '0',
            marginUsed: '0',
            returnOnEquity: '0',
            totalBalance: '0',
            unrealizedPnl: '0',
          },
        }),
      ).toBe(true);
    });

    it('returns false when fetched Hyperliquid account state has a positive balance', () => {
      expect(
        hasZeroHyperliquidPerpsBalance({
          accountState: {
            availableBalance: '12.34',
            marginUsed: '0',
            returnOnEquity: '0',
            totalBalance: '12.34',
            unrealizedPnl: '0',
          },
        }),
      ).toBe(false);
    });

    it('returns false when no Hyperliquid balance data is available', () => {
      expect(hasZeroHyperliquidPerpsBalance({})).toBe(false);
    });
  });

  describe('hasZeroArbitrumUsdcBalance', () => {
    it('returns true when Arbitrum USDC balance is missing', () => {
      expect(
        hasZeroArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: {},
        }),
      ).toBe(true);
    });

    it('returns true when Arbitrum USDC balance is zero', () => {
      expect(
        hasZeroArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: {
            [SIGNER_ADDRESS]: {
              [HYPERLIQUID_DEPOSIT_CHAIN_ID]: {
                [HYPERLIQUID_DEPOSIT_USDC_ADDRESS]: '0x0',
              },
            },
          },
        }),
      ).toBe(true);
    });

    it('returns false when Arbitrum USDC balance is positive', () => {
      expect(
        hasZeroArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: {
            [SIGNER_ADDRESS]: {
              [HYPERLIQUID_DEPOSIT_CHAIN_ID]: {
                [HYPERLIQUID_DEPOSIT_USDC_ADDRESS]: '0x1',
              },
            },
          },
        }),
      ).toBe(false);
    });
  });

  describe('hasAvailableMetaMaskPayBalance', () => {
    it('returns false when the signer has no native or token balances', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountTrackerState: {
            accountsByChainId: {},
          },
          address: SIGNER_ADDRESS,
          tokenBalances: {},
          tokensControllerState: {
            allTokens: {},
          },
        }),
      ).toBe(false);
    });

    it('returns true when the signer has a non-testnet native balance', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountTrackerState: {
            accountsByChainId: {
              [CHAIN_IDS.MAINNET]: {
                [SIGNER_ADDRESS]: {
                  balance: '0x1',
                },
              },
            },
          },
          address: SIGNER_ADDRESS,
          tokenBalances: {},
          tokensControllerState: {
            allTokens: {},
          },
        }),
      ).toBe(true);
    });

    it('returns true when the signer has a non-testnet ERC20 balance', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountTrackerState: {
            accountsByChainId: {},
          },
          address: SIGNER_ADDRESS,
          tokenBalances: {
            [SIGNER_ADDRESS]: {
              [CHAIN_IDS.MAINNET]: {
                [TOKEN_ADDRESS]: '0x1',
              },
            },
          },
          tokensControllerState: {
            allTokens: {
              [CHAIN_IDS.MAINNET]: {
                [SIGNER_ADDRESS]: [
                  {
                    address: TOKEN_ADDRESS,
                    decimals: 18,
                    symbol: 'TST',
                  },
                ],
              },
            },
          },
        }),
      ).toBe(true);
    });

    it('returns false when the only positive balance is on a testnet', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountTrackerState: {
            accountsByChainId: {
              [CHAIN_IDS.SEPOLIA]: {
                [SIGNER_ADDRESS]: {
                  balance: '0x1',
                },
              },
            },
          },
          address: SIGNER_ADDRESS,
          tokenBalances: {
            [SIGNER_ADDRESS]: {
              [CHAIN_IDS.SEPOLIA]: {
                [TOKEN_ADDRESS]: '0x1',
              },
            },
          },
          tokensControllerState: {
            allTokens: {
              [CHAIN_IDS.SEPOLIA]: {
                [SIGNER_ADDRESS]: [
                  {
                    address: TOKEN_ADDRESS,
                    decimals: 18,
                    symbol: 'TST',
                  },
                ],
              },
            },
          },
        }),
      ).toBe(false);
    });
  });

  describe('isHyperliquidDepositPromptEligible', () => {
    it('returns true after refreshing balances when Hyperliquid and Arbitrum USDC balances are zero and MM Pay has a source balance', async () => {
      const updateBalances = jest.fn().mockResolvedValue(undefined);

      await expect(
        isHyperliquidDepositPromptEligible({
          accountTrackerController: {
            state: {
              accountsByChainId: {
                [CHAIN_IDS.MAINNET]: {
                  [SIGNER_ADDRESS]: {
                    balance: '0x1',
                  },
                },
              },
            },
          },
          perpsController: {
            getAccountState: jest.fn().mockResolvedValue({
              availableBalance: '0',
              marginUsed: '0',
              returnOnEquity: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
            }),
          },
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: {},
            },
            updateBalances,
          },
          tokensController: {
            state: {
              allTokens: {},
            },
          },
        }),
      ).resolves.toBe(true);

      expect(updateBalances).toHaveBeenCalledWith({
        chainIds: [HYPERLIQUID_DEPOSIT_CHAIN_ID],
        queryAllAccounts: true,
        tokenAddresses: [HYPERLIQUID_DEPOSIT_USDC_ADDRESS],
      });
    });

    it('returns false when the signer has Arbitrum USDC', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountTrackerController: {
            state: {
              accountsByChainId: {
                [CHAIN_IDS.MAINNET]: {
                  [SIGNER_ADDRESS]: {
                    balance: '0x1',
                  },
                },
              },
            },
          },
          perpsController: {
            getAccountState: jest.fn().mockResolvedValue({
              availableBalance: '0',
              marginUsed: '0',
              returnOnEquity: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
            }),
          },
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: {
                [SIGNER_ADDRESS]: {
                  [HYPERLIQUID_DEPOSIT_CHAIN_ID]: {
                    [HYPERLIQUID_DEPOSIT_USDC_ADDRESS]: '0x1',
                  },
                },
              },
            },
            updateBalances: jest.fn().mockResolvedValue(undefined),
          },
          tokensController: {
            state: {
              allTokens: {},
            },
          },
        }),
      ).resolves.toBe(false);
    });

    it('returns false when MM Pay has no source balance', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountTrackerController: {
            state: {
              accountsByChainId: {},
            },
          },
          perpsController: {
            getAccountState: jest.fn().mockResolvedValue({
              availableBalance: '0',
              marginUsed: '0',
              returnOnEquity: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
            }),
          },
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: {},
            },
            updateBalances: jest.fn().mockResolvedValue(undefined),
          },
          tokensController: {
            state: {
              allTokens: {},
            },
          },
        }),
      ).resolves.toBe(false);
    });

    it('returns false when Hyperliquid balance cannot be fetched', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountTrackerController: {
            state: {
              accountsByChainId: {
                [CHAIN_IDS.MAINNET]: {
                  [SIGNER_ADDRESS]: {
                    balance: '0x1',
                  },
                },
              },
            },
          },
          perpsController: {
            getAccountState: jest.fn().mockRejectedValue(new Error('failed')),
          },
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: {},
            },
            updateBalances: jest.fn().mockResolvedValue(undefined),
          },
          tokensController: {
            state: {
              allTokens: {},
            },
          },
        }),
      ).resolves.toBe(false);
    });
  });
});
