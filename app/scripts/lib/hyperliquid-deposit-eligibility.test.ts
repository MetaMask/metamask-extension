import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import {
  hasZeroArbitrumUsdcBalance,
  hasZeroHyperliquidPerpsBalance,
  isHyperliquidDepositPromptEligible,
} from './hyperliquid-deposit-eligibility';

const SIGNER_ADDRESS = '0x1111111111111111111111111111111111111111';

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

  describe('isHyperliquidDepositPromptEligible', () => {
    it('returns true after refreshing balances when Hyperliquid and Arbitrum USDC balances are zero', async () => {
      const updateBalances = jest.fn().mockResolvedValue(undefined);

      await expect(
        isHyperliquidDepositPromptEligible({
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
        }),
      ).resolves.toBe(false);
    });

    it('returns false when Hyperliquid balance cannot be fetched', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
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
        }),
      ).resolves.toBe(false);
    });
  });
});
