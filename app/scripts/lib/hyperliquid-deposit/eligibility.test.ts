import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
  HYPERLIQUID_DEPOSIT_USDC_THRESHOLD,
} from './constants';

import {
  hasAvailableMetaMaskPayBalance,
  hasLowArbitrumUsdcBalance,
  hasZeroHyperliquidPerpsBalance,
  isHyperliquidDepositPromptEligible,
} from './eligibility';

const SIGNER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;

/**
 * Helper to build tokenBalances with proper Hex typing.
 * @param address
 * @param chainId
 * @param tokenAddress
 * @param balance
 */
function buildTokenBalances(
  address: Hex,
  chainId: Hex,
  tokenAddress: Hex,
  balance: Hex,
): Record<Hex, Record<Hex, Record<Hex, Hex>>> {
  return { [address]: { [chainId]: { [tokenAddress]: balance } } };
}

describe('hyperliquid-deposit eligibility', () => {
  describe('hasZeroHyperliquidPerpsBalance', () => {
    it('returns true when fetched Hyperliquid account state has zero balance', () => {
      expect(
        hasZeroHyperliquidPerpsBalance({
          accountState: {
            marginUsed: '0',
            returnOnEquity: '0',
            spendableBalance: '0',
            totalBalance: '0',
            unrealizedPnl: '0',
            withdrawableBalance: '0',
          },
        }),
      ).toBe(true);
    });

    it('returns false when fetched Hyperliquid account state has a positive balance', () => {
      expect(
        hasZeroHyperliquidPerpsBalance({
          accountState: {
            marginUsed: '0',
            returnOnEquity: '0',
            spendableBalance: '12.34',
            totalBalance: '12.34',
            unrealizedPnl: '0',
            withdrawableBalance: '12.34',
          },
        }),
      ).toBe(false);
    });

    it('returns false when no Hyperliquid balance data is available', () => {
      expect(hasZeroHyperliquidPerpsBalance({})).toBe(false);
    });
  });

  describe('hasLowArbitrumUsdcBalance', () => {
    it('returns true when Arbitrum USDC balance is missing', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: {},
        }),
      ).toBe(true);
    });

    it('returns true when Arbitrum USDC balance is zero', () => {
      expect(
        hasLowArbitrumUsdcBalance({
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

    it('returns true when Arbitrum USDC balance is below $10 threshold', () => {
      // $9.99 USDC = 9,990,000 raw units = 0x989670
      const belowThreshold =
        `0x${(HYPERLIQUID_DEPOSIT_USDC_THRESHOLD - 1n).toString(16)}` as Hex;
      expect(
        hasLowArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: buildTokenBalances(
            SIGNER_ADDRESS,
            HYPERLIQUID_DEPOSIT_CHAIN_ID,
            HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
            belowThreshold,
          ),
        }),
      ).toBe(true);
    });

    it('returns false when Arbitrum USDC balance is at $10 threshold', () => {
      // Exactly $10 USDC = 10,000,000 raw units
      const atThreshold =
        `0x${HYPERLIQUID_DEPOSIT_USDC_THRESHOLD.toString(16)}` as Hex;
      expect(
        hasLowArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: buildTokenBalances(
            SIGNER_ADDRESS,
            HYPERLIQUID_DEPOSIT_CHAIN_ID,
            HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
            atThreshold,
          ),
        }),
      ).toBe(false);
    });

    it('returns false when Arbitrum USDC balance is above $10 threshold', () => {
      // $100 USDC = 100,000,000 raw units = 0x5F5E100
      const aboveThreshold =
        `0x${(HYPERLIQUID_DEPOSIT_USDC_THRESHOLD * 10n).toString(16)}` as Hex;
      expect(
        hasLowArbitrumUsdcBalance({
          address: SIGNER_ADDRESS,
          tokenBalances: buildTokenBalances(
            SIGNER_ADDRESS,
            HYPERLIQUID_DEPOSIT_CHAIN_ID,
            HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
            aboveThreshold,
          ),
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
    const enabledRemoteFeatureFlagController = {
      state: {
        remoteFeatureFlags: {
          perpsEnabledVersion: true,
          extensionUxHyperliquidDepositPrompt: true,
        },
      },
    };

    let originalPerpsEnabled: string | undefined;

    beforeEach(() => {
      originalPerpsEnabled = process.env.PERPS_ENABLED;
      process.env.PERPS_ENABLED = 'true';
    });

    afterEach(() => {
      process.env.PERPS_ENABLED = originalPerpsEnabled;
    });

    it('returns false when perps is not included in the build', async () => {
      process.env.PERPS_ENABLED = 'false';
      const getAccountState = jest.fn();

      await expect(
        isHyperliquidDepositPromptEligible({
          perpsController: { getAccountState },
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);

      expect(getAccountState).not.toHaveBeenCalled();
    });

    it('returns false when the perps remote rollout flag is not satisfied', async () => {
      const getAccountState = jest.fn();

      await expect(
        isHyperliquidDepositPromptEligible({
          perpsController: { getAccountState },
          remoteFeatureFlagController: {
            state: {
              remoteFeatureFlags: {
                perpsEnabledVersion: {
                  enabled: false,
                  minimumVersion: '0.0.0',
                },
              },
            },
          },
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);

      expect(getAccountState).not.toHaveBeenCalled();
    });

    it('returns false when the remote feature flag controller is unavailable', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);
    });

    it('returns false when extensionUxHyperliquidDepositPrompt flag is disabled', async () => {
      const getAccountState = jest.fn();

      await expect(
        isHyperliquidDepositPromptEligible({
          perpsController: { getAccountState },
          remoteFeatureFlagController: {
            state: {
              remoteFeatureFlags: {
                perpsEnabledVersion: true,
                extensionUxHyperliquidDepositPrompt: false,
              },
            },
          },
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);

      expect(getAccountState).not.toHaveBeenCalled();
    });

    it('returns false when extensionUxHyperliquidDepositPrompt flag version is not met', async () => {
      const getAccountState = jest.fn();

      await expect(
        isHyperliquidDepositPromptEligible({
          perpsController: { getAccountState },
          remoteFeatureFlagController: {
            state: {
              remoteFeatureFlags: {
                perpsEnabledVersion: true,
                extensionUxHyperliquidDepositPrompt: {
                  enabled: true,
                  minimumVersion: '999.0.0',
                },
              },
            },
          },
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);

      expect(getAccountState).not.toHaveBeenCalled();
    });

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
              marginUsed: '0',
              returnOnEquity: '0',
              spendableBalance: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
              withdrawableBalance: '0',
            }),
          },
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
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

    it('returns false when the signer has ≥$10 Arbitrum USDC', async () => {
      // $10 USDC = 10,000,000 raw units (at threshold)
      const atThreshold =
        `0x${HYPERLIQUID_DEPOSIT_USDC_THRESHOLD.toString(16)}` as Hex;

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
              marginUsed: '0',
              returnOnEquity: '0',
              spendableBalance: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
              withdrawableBalance: '0',
            }),
          },
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: buildTokenBalances(
                SIGNER_ADDRESS,
                HYPERLIQUID_DEPOSIT_CHAIN_ID,
                HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
                atThreshold,
              ),
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
              marginUsed: '0',
              returnOnEquity: '0',
              spendableBalance: '0',
              totalBalance: '0',
              unrealizedPnl: '0',
              withdrawableBalance: '0',
            }),
          },
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
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
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
          signerAddress: SIGNER_ADDRESS,
          tokenBalancesController: {
            state: {
              tokenBalances: {},
            },
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
