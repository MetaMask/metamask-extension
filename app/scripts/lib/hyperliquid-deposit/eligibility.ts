import type { AssetsControllerState } from '@metamask/assets-controller';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type {
  AccountState,
  PerpsControllerState,
} from '@metamask/perps-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  type CaipAssetType,
  KnownCaipNamespace,
  parseCaipAssetType,
} from '@metamask/utils';
import log from 'loglevel';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { getIsPerpsIncludedInBuild } from '../../../../shared/lib/environment';
import { isPerpsRemoteConfigSatisfied } from '../../../../shared/lib/perps-feature-flags';
import { getBooleanFeatureFlag } from '../../../../shared/lib/remote-feature-flag-utils';
import {
  HYPERLIQUID_DEPOSIT_USDC_CAIP_ID,
  HYPERLIQUID_DEPOSIT_USDC_DECIMALS,
  HYPERLIQUID_DEPOSIT_USDC_THRESHOLD,
} from './constants';

const HYPERLIQUID_PROVIDER_ID = 'hyperliquid';
const ELIGIBILITY_ACCOUNT_STATE_SOURCE =
  'hyperliquid_deposit_prompt_eligibility';

type PerpsControllerLike = {
  getAccountState?: (params?: {
    source?: string;
    standalone?: boolean;
    userAddress?: string;
  }) => Promise<Partial<AccountState>>;
  state?: Partial<Pick<PerpsControllerState, 'perpsBalances'>>;
};

export type AssetsControllerLike = {
  state?: {
    assetsBalance?: AssetsControllerState['assetsBalance'];
    assetsInfo?: AssetsControllerState['assetsInfo'];
  };
};

export type AccountsControllerLike = {
  state?: Partial<Pick<AccountsControllerState, 'internalAccounts'>>;
};

type RemoteFeatureFlagControllerLike = {
  state?: Partial<Pick<RemoteFeatureFlagControllerState, 'remoteFeatureFlags'>>;
};

type IsHyperliquidDepositPromptEligibleOptions = {
  accountsController?: AccountsControllerLike;
  assetsController?: AssetsControllerLike;
  logger?: Pick<typeof log, 'warn'>;
  perpsController?: PerpsControllerLike;
  remoteFeatureFlagController?: RemoteFeatureFlagControllerLike;
  signerAddress?: string;
};

/**
 * Eligible when: no Hyperliquid balance, <$10 Arbitrum USDC, and has MM Pay funds.
 *
 * @param options - The eligibility check options.
 * @param options.accountsController - Provides account ID to address mapping.
 * @param options.assetsController - Provides token balances via AssetsController.
 * @param options.logger - Logger used for non-fatal failures.
 * @param options.perpsController - Provides Hyperliquid account state.
 * @param options.remoteFeatureFlagController - Provides the perps rollout flag.
 * @param options.signerAddress - The address that signed the ApproveAgent request.
 * @returns Whether the deposit prompt should be shown.
 */
export async function isHyperliquidDepositPromptEligible({
  accountsController,
  assetsController,
  logger = log,
  perpsController,
  remoteFeatureFlagController,
  signerAddress,
}: IsHyperliquidDepositPromptEligibleOptions): Promise<boolean> {
  if (!isPerpsExperienceAvailable(remoteFeatureFlagController)) {
    return false;
  }

  if (!isHyperliquidDepositPromptEnabled(remoteFeatureFlagController)) {
    return false;
  }

  if (
    !signerAddress ||
    !accountsController ||
    !assetsController ||
    !perpsController
  ) {
    return false;
  }

  const accountId = getAccountIdByAddress(accountsController, signerAddress);
  if (!accountId) {
    return false;
  }

  const accountState = await getHyperliquidAccountState({
    logger,
    perpsController,
    signerAddress,
  });

  if (!accountState) {
    return false;
  }

  const zeroHLBalance = hasZeroHyperliquidPerpsBalance({
    accountState,
    perpsBalances: perpsController.state?.perpsBalances,
  });

  const lowArbitrumUsdc = hasLowArbitrumUsdcBalance({
    accountId,
    assetsController,
  });

  const hasPayBalance = hasAvailableMetaMaskPayBalance({
    accountId,
    assetsController,
  });

  return zeroHLBalance && lowArbitrumUsdc && hasPayBalance;
}

export function hasZeroHyperliquidPerpsBalance({
  accountState,
  perpsBalances,
}: {
  accountState?: Partial<AccountState> | null;
  perpsBalances?: PerpsControllerState['perpsBalances'];
}): boolean {
  const balances = [
    accountState?.totalBalance,
    accountState?.spendableBalance,
    accountState?.withdrawableBalance,
    perpsBalances?.[HYPERLIQUID_PROVIDER_ID]?.totalBalance,
  ].filter((balance): balance is string => balance !== undefined);

  return balances.length > 0 && balances.every(isZeroDecimalBalance);
}

/**
 * True if Arbitrum USDC balance is below $10 (user can't deposit directly on HL).
 * @param options0
 * @param options0.accountId
 * @param options0.assetsController
 */
export function hasLowArbitrumUsdcBalance({
  accountId,
  assetsController,
}: {
  accountId: string;
  assetsController: AssetsControllerLike;
}): boolean {
  const assetsBalance = assetsController.state?.assetsBalance ?? {};
  const accountBalances = assetsBalance[accountId] ?? {};

  // Look for Arbitrum USDC using CAIP asset ID (case-insensitive)
  const usdcEntry = Object.entries(accountBalances).find(
    ([assetId]) =>
      assetId.toLowerCase() === HYPERLIQUID_DEPOSIT_USDC_CAIP_ID.toLowerCase(),
  );

  const usdcBalance = usdcEntry?.[1];
  const rawAmount = usdcBalance?.amount;

  if (!rawAmount) {
    return true; // No USDC = below threshold
  }

  return isDecimalBalanceBelowThreshold(
    rawAmount,
    HYPERLIQUID_DEPOSIT_USDC_THRESHOLD,
  );
}

/**
 * True if user has any positive balance on mainnet EVM chains that MM Pay can use.
 * @param options0
 * @param options0.accountId
 * @param options0.assetsController
 */
export function hasAvailableMetaMaskPayBalance({
  accountId,
  assetsController,
}: {
  accountId: string;
  assetsController: AssetsControllerLike;
}): boolean {
  const assetsBalance = assetsController.state?.assetsBalance ?? {};
  const assetsInfo = assetsController.state?.assetsInfo ?? {};
  const accountBalances = assetsBalance[accountId] ?? {};

  return Object.entries(accountBalances).some(([assetId, balance]) => {
    const metadata = assetsInfo[assetId as CaipAssetType];
    if (!metadata) {
      return false;
    }

    // Skip test chains
    const chainId = getHexChainIdFromCaipAssetId(assetId);
    if (!chainId || isTestChain(chainId)) {
      return false;
    }

    return isPositiveDecimalBalance(balance?.amount);
  });
}

function isPerpsExperienceAvailable(
  remoteFeatureFlagController?: RemoteFeatureFlagControllerLike,
): boolean {
  return (
    getIsPerpsIncludedInBuild() &&
    isPerpsRemoteConfigSatisfied(
      remoteFeatureFlagController?.state?.remoteFeatureFlags
        ?.perpsEnabledVersion,
    )
  );
}

function isHyperliquidDepositPromptEnabled(
  remoteFeatureFlagController?: RemoteFeatureFlagControllerLike,
): boolean {
  return getBooleanFeatureFlag(
    remoteFeatureFlagController?.state?.remoteFeatureFlags
      ?.extensionUxHyperliquidDepositPrompt,
    false,
  );
}

function getAccountIdByAddress(
  accountsController: AccountsControllerLike,
  address: string,
): string | undefined {
  const accounts = accountsController.state?.internalAccounts?.accounts ?? {};

  const entry = Object.entries(accounts).find(
    ([, account]) => account.address.toLowerCase() === address.toLowerCase(),
  );

  return entry?.[0];
}

async function getHyperliquidAccountState({
  logger,
  perpsController,
  signerAddress,
}: {
  logger: Pick<typeof log, 'warn'>;
  perpsController: PerpsControllerLike;
  signerAddress: string;
}): Promise<Partial<AccountState> | undefined> {
  if (!perpsController.getAccountState) {
    return undefined;
  }

  try {
    return await perpsController.getAccountState({
      source: ELIGIBILITY_ACCOUNT_STATE_SOURCE,
      standalone: true,
      userAddress: signerAddress,
    });
  } catch (error) {
    logger.warn('HyperliquidDepositPrompt: Unable to fetch account state', {
      error,
    });
    return undefined;
  }
}

function isZeroDecimalBalance(balance: string): boolean {
  const parsedBalance = Number.parseFloat(balance);
  return Number.isFinite(parsedBalance) && parsedBalance === 0;
}

function isDecimalBalanceBelowThreshold(
  amount: string,
  threshold: bigint,
): boolean {
  try {
    const rawAmount = decimalBalanceToRawUnits(
      amount,
      HYPERLIQUID_DEPOSIT_USDC_DECIMALS,
    );
    if (rawAmount === undefined) {
      return true;
    }
    return rawAmount < threshold;
  } catch {
    return true;
  }
}

function decimalBalanceToRawUnits(
  amount: string,
  decimals: number,
): bigint | undefined {
  const trimmed = amount.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/u.test(trimmed)) {
    return undefined;
  }

  const [integerPart = '0', fractionalPart = ''] = trimmed.split('.');
  const scaledFraction = fractionalPart
    .padEnd(decimals, '0')
    .slice(0, decimals);

  return BigInt(`${integerPart}${scaledFraction}`);
}

function isPositiveDecimalBalance(amount: string | undefined): boolean {
  if (!amount) {
    return false;
  }
  try {
    const decimalAmount = Number.parseFloat(amount);
    return Number.isFinite(decimalAmount) && decimalAmount > 0;
  } catch {
    return false;
  }
}

function getHexChainIdFromCaipAssetId(assetId: string): string | undefined {
  try {
    const { chain } = parseCaipAssetType(assetId as CaipAssetType);
    if (chain.namespace !== KnownCaipNamespace.Eip155) {
      return undefined;
    }
    return `0x${Number(chain.reference).toString(16)}`;
  } catch {
    return undefined;
  }
}

function isTestChain(chainId: string): boolean {
  return TEST_CHAINS.some(
    (testChainId) => testChainId.toLowerCase() === chainId.toLowerCase(),
  );
}
