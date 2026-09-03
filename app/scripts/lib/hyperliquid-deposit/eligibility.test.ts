import type { CaipAssetType, Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { HYPERLIQUID_DEPOSIT_USDC_CAIP_ID } from './constants';

import {
  type AccountsControllerLike,
  type AssetsControllerLike,
  hasAvailableMetaMaskPayBalance,
  hasLowArbitrumUsdcBalance,
  hasZeroHyperliquidPerpsBalance,
  isHyperliquidDepositPromptEligible,
} from './eligibility';

const SIGNER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const ACCOUNT_ID = 'test-account-id-1234';

// CAIP asset IDs for testing
const ETH_MAINNET_CAIP = 'eip155:1/slip44:60' as CaipAssetType;
const USDC_ARBITRUM_CAIP = HYPERLIQUID_DEPOSIT_USDC_CAIP_ID;
const ETH_SEPOLIA_CAIP = 'eip155:11155111/slip44:60' as CaipAssetType;

function createAssetsController(
  accountId: string,
  balances: Record<CaipAssetType, { amount: string }>,
): AssetsControllerLike {
  return {
    state: {
      assetsBalance: {
        [accountId]: balances,
      },
      assetsInfo: Object.fromEntries(
        Object.keys(balances).map((assetId) => [
          assetId,
          {
            type: assetId.includes('slip44') ? 'native' : 'erc20',
            decimals: 6,
          },
        ]),
      ),
    },
  } as AssetsControllerLike;
}

function createAccountsController(
  accountId: string,
  address: string,
): AccountsControllerLike {
  return {
    state: {
      internalAccounts: {
        accounts: {
          [accountId]: { address },
        },
      },
    },
  } as AccountsControllerLike;
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
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {}),
        }),
      ).toBe(true);
    });

    it('returns true when Arbitrum USDC balance is zero', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '0' },
          }),
        }),
      ).toBe(true);
    });

    it('returns true when Arbitrum USDC balance is below $10 threshold', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '9.99' },
          }),
        }),
      ).toBe(true);
    });

    it('returns true for sub-threshold balances without floating-point rounding errors', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '9.999999' },
          }),
        }),
      ).toBe(true);
    });

    it('returns false when Arbitrum USDC balance is at $10 threshold', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '10' },
          }),
        }),
      ).toBe(false);
    });

    it('returns false when Arbitrum USDC balance is above $10 threshold', () => {
      expect(
        hasLowArbitrumUsdcBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '100.5' },
          }),
        }),
      ).toBe(false);
    });
  });

  describe('hasAvailableMetaMaskPayBalance', () => {
    it('returns false when the signer has no balances', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {}),
        }),
      ).toBe(false);
    });

    it('returns true when the signer has a non-testnet native balance', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_MAINNET_CAIP]: { amount: '0.1' },
          }),
        }),
      ).toBe(true);
    });

    it('returns true when the signer has a non-testnet ERC20 balance', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [USDC_ARBITRUM_CAIP]: { amount: '5' },
          }),
        }),
      ).toBe(true);
    });

    it('returns false when the only positive balance is on a testnet', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_SEPOLIA_CAIP]: { amount: '1' },
          }),
        }),
      ).toBe(false);
    });

    it('returns false when balances are zero', () => {
      expect(
        hasAvailableMetaMaskPayBalance({
          accountId: ACCOUNT_ID,
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_MAINNET_CAIP]: { amount: '0' },
          }),
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

    it('returns true when Hyperliquid and Arbitrum USDC balances are zero and MM Pay has a source balance', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountsController: createAccountsController(
            ACCOUNT_ID,
            SIGNER_ADDRESS,
          ),
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_MAINNET_CAIP]: { amount: '0.1' },
          }),
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
        }),
      ).resolves.toBe(true);
    });

    it('returns false when the signer has ≥$10 Arbitrum USDC', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountsController: createAccountsController(
            ACCOUNT_ID,
            SIGNER_ADDRESS,
          ),
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_MAINNET_CAIP]: { amount: '0.1' },
            [USDC_ARBITRUM_CAIP]: { amount: '10' },
          }),
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
        }),
      ).resolves.toBe(false);
    });

    it('returns false when MM Pay has no source balance', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountsController: createAccountsController(
            ACCOUNT_ID,
            SIGNER_ADDRESS,
          ),
          assetsController: createAssetsController(ACCOUNT_ID, {}),
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
        }),
      ).resolves.toBe(false);
    });

    it('returns false when account ID cannot be found for signer address', async () => {
      await expect(
        isHyperliquidDepositPromptEligible({
          accountsController: createAccountsController(
            ACCOUNT_ID,
            '0xDifferentAddress',
          ),
          assetsController: createAssetsController(ACCOUNT_ID, {
            [ETH_MAINNET_CAIP]: { amount: '0.1' },
          }),
          perpsController: {
            getAccountState: jest.fn().mockResolvedValue({
              totalBalance: '0',
            }),
          },
          remoteFeatureFlagController: enabledRemoteFeatureFlagController,
          signerAddress: SIGNER_ADDRESS,
        }),
      ).resolves.toBe(false);
    });
  });
});
