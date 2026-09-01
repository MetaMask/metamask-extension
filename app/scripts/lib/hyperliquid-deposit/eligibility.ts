import type {
  AccountTrackerControllerState,
  TokenBalancesControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import type {
  AccountState,
  PerpsControllerState,
} from '@metamask/perps-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import log from 'loglevel';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { getIsPerpsIncludedInBuild } from '../../../../shared/lib/environment';
import { isPerpsRemoteConfigSatisfied } from '../../../../shared/lib/perps-feature-flags';
import { getBooleanFeatureFlag } from '../../../../shared/lib/remote-feature-flag-utils';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
  HYPERLIQUID_DEPOSIT_USDC_THRESHOLD,
} from './constants';

const HYPERLIQUID_PROVIDER_ID = 'hyperliquid';
const ELIGIBILITY_ACCOUNT_STATE_SOURCE =
  'hyperliquid_deposit_prompt_eligibility';

type TokenBalances = NonNullable<TokenBalancesControllerState['tokenBalances']>;

type UpdateBalancesOptions = {
  chainIds?: string[];
  queryAllAccounts?: boolean;
  tokenAddresses?: string[];
};

type PerpsControllerLike = {
  getAccountState?: (params?: {
    source?: string;
    standalone?: boolean;
    userAddress?: string;
  }) => Promise<Partial<AccountState>>;
  state?: Partial<Pick<PerpsControllerState, 'perpsBalances'>>;
};

type AccountTrackerControllerLike = {
  state?: Partial<Pick<AccountTrackerControllerState, 'accountsByChainId'>>;
};

type TokenBalancesControllerLike = {
  state?: Partial<TokenBalancesControllerState>;
  updateBalances?: (options?: UpdateBalancesOptions) => Promise<void> | void;
};

type TokensControllerLike = {
  state?: Partial<Pick<TokensControllerState, 'allTokens'>>;
};

type RemoteFeatureFlagControllerLike = {
  state?: Partial<Pick<RemoteFeatureFlagControllerState, 'remoteFeatureFlags'>>;
};

type IsHyperliquidDepositPromptEligibleOptions = {
  accountTrackerController?: AccountTrackerControllerLike;
  logger?: Pick<typeof log, 'warn'>;
  perpsController?: PerpsControllerLike;
  remoteFeatureFlagController?: RemoteFeatureFlagControllerLike;
  signerAddress?: string;
  tokenBalancesController?: TokenBalancesControllerLike;
  tokensController?: TokensControllerLike;
};

/**
 * Eligible when: no Hyperliquid balance, <$10 Arbitrum USDC, and has MM Pay funds.
 *
 * @param options - The eligibility check options.
 * @param options.accountTrackerController - Provides native balances by chain.
 * @param options.logger - Logger used for non-fatal failures.
 * @param options.perpsController - Provides Hyperliquid account state.
 * @param options.remoteFeatureFlagController - Provides the perps rollout flag.
 * @param options.signerAddress - The address that signed the ApproveAgent request.
 * @param options.tokenBalancesController - Provides ERC-20 balances.
 * @param options.tokensController - Provides tracked tokens by chain.
 * @returns Whether the deposit prompt should be shown.
 */
export async function isHyperliquidDepositPromptEligible({
  accountTrackerController,
  logger = log,
  perpsController,
  remoteFeatureFlagController,
  signerAddress,
  tokenBalancesController,
  tokensController,
}: IsHyperliquidDepositPromptEligibleOptions): Promise<boolean> {
  // Return false if perps is not available
  if (!isPerpsExperienceAvailable(remoteFeatureFlagController)) {
    return false;
  }

  if (!isHyperliquidDepositPromptEnabled(remoteFeatureFlagController)) {
    return false;
  }

  // Return false if required dependencies are missing
  if (
    !signerAddress ||
    !accountTrackerController ||
    !perpsController ||
    !tokenBalancesController ||
    !tokensController
  ) {
    return false;
  }

  // Return false if Hyperliquid account state is not available
  const accountState = await getHyperliquidAccountState({
    logger,
    perpsController,
    signerAddress,
  });

  if (!accountState) {
    return false;
  }

  // Refresh Arbitrum USDC balance
  const didRefreshUsdcBalance = await refreshArbitrumUsdcBalance({
    logger,
    tokenBalancesController,
  });

  if (!didRefreshUsdcBalance) {
    return false;
  }

  // Return true if all conditions are met
  return (
    hasZeroHyperliquidPerpsBalance({
      accountState,
      perpsBalances: perpsController.state?.perpsBalances,
    }) &&
    hasLowArbitrumUsdcBalance({
      address: signerAddress,
      tokenBalances: tokenBalancesController.state?.tokenBalances ?? {},
    }) &&
    hasAvailableMetaMaskPayBalance({
      accountTrackerState: accountTrackerController.state,
      address: signerAddress,
      tokenBalances: tokenBalancesController.state?.tokenBalances ?? {},
      tokensControllerState: tokensController.state,
    })
  );
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
 *
 * @param options - The balance check options.
 * @param options.address - The wallet address to check.
 * @param options.tokenBalances - ERC-20 balances from TokenBalancesController.
 * @returns Whether the Arbitrum USDC balance is below the $10 threshold.
 */
export function hasLowArbitrumUsdcBalance({
  address,
  tokenBalances,
}: {
  address: string;
  tokenBalances: TokenBalances;
}): boolean {
  const accountBalances = getCaseInsensitiveRecordValue(tokenBalances, address);
  const chainBalances = getCaseInsensitiveRecordValue(
    accountBalances,
    HYPERLIQUID_DEPOSIT_CHAIN_ID,
  );
  const usdcBalance = getCaseInsensitiveRecordValue(
    chainBalances,
    HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
  );

  return (
    usdcBalance === undefined ||
    isHexBalanceBelowThreshold(usdcBalance, HYPERLIQUID_DEPOSIT_USDC_THRESHOLD)
  );
}

/**
 * True if user has any positive balance on mainnet EVM chains that MM Pay can use.
 * Background approximation of UI token-picker eligibility (native + ERC-20 balances).
 *
 * @param options - The balance check options.
 * @param options.accountTrackerState - Native balances by chain from AccountTrackerController.
 * @param options.address - The wallet address to check.
 * @param options.tokenBalances - ERC-20 balances from TokenBalancesController.
 * @param options.tokensControllerState - Tracked tokens by chain from TokensController.
 * @returns Whether the user has at least one Pay-eligible balance.
 */
export function hasAvailableMetaMaskPayBalance({
  accountTrackerState,
  address,
  tokenBalances,
  tokensControllerState,
}: {
  accountTrackerState?: Partial<
    Pick<AccountTrackerControllerState, 'accountsByChainId'>
  >;
  address: string;
  tokenBalances: TokenBalances;
  tokensControllerState?: Partial<Pick<TokensControllerState, 'allTokens'>>;
}): boolean {
  return (
    hasAvailableNativeBalance({ accountTrackerState, address }) ||
    hasAvailableTokenBalance({
      address,
      tokenBalances,
      tokensControllerState,
    })
  );
}

/**
 * Background equivalent of the UI `getIsPerpsExperienceAvailable` selector:
 * perps must be included in the build (`PERPS_ENABLED`) and the
 * `perpsEnabledVersion` remote rollout flag must be satisfied.
 *
 * @param remoteFeatureFlagController - Provides the remote feature flags.
 * @returns Whether the perps experience is available.
 */
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

/**
 * Checks whether `extensionUxHyperliquidDepositPrompt` remote feature flag is enabled.
 *
 * @param remoteFeatureFlagController - Provides the remote feature flags.
 * @returns Whether the Hyperliquid deposit prompt is enabled.
 */
function isHyperliquidDepositPromptEnabled(
  remoteFeatureFlagController?: RemoteFeatureFlagControllerLike,
): boolean {
  return getBooleanFeatureFlag(
    remoteFeatureFlagController?.state?.remoteFeatureFlags
      ?.extensionUxHyperliquidDepositPrompt,
    false,
  );
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
    logger.warn(
      'Unable to fetch Hyperliquid account state for deposit prompt',
      {
        error,
      },
    );
    return undefined;
  }
}

async function refreshArbitrumUsdcBalance({
  logger,
  tokenBalancesController,
}: {
  logger: Pick<typeof log, 'warn'>;
  tokenBalancesController: TokenBalancesControllerLike;
}): Promise<boolean> {
  if (!tokenBalancesController.updateBalances) {
    return false;
  }

  try {
    await tokenBalancesController.updateBalances({
      chainIds: [HYPERLIQUID_DEPOSIT_CHAIN_ID],
      queryAllAccounts: true,
      tokenAddresses: [HYPERLIQUID_DEPOSIT_USDC_ADDRESS],
    });
    return true;
  } catch (error) {
    logger.warn(
      'Unable to refresh Arbitrum USDC balance for Hyperliquid deposit prompt',
      {
        error,
      },
    );
    return false;
  }
}

function isZeroDecimalBalance(balance: string): boolean {
  const parsedBalance = Number.parseFloat(balance);
  return Number.isFinite(parsedBalance) && parsedBalance === 0;
}

function isHexBalanceBelowThreshold(
  balance: string,
  threshold: bigint,
): boolean {
  try {
    return BigInt(balance) < threshold;
  } catch {
    return false;
  }
}

function hasAvailableNativeBalance({
  accountTrackerState,
  address,
}: {
  accountTrackerState?: Partial<
    Pick<AccountTrackerControllerState, 'accountsByChainId'>
  >;
  address: string;
}): boolean {
  const accountsByChainId = accountTrackerState?.accountsByChainId ?? {};

  return Object.entries(accountsByChainId).some(([chainId, accounts]) => {
    if (isTestChain(chainId)) {
      return false;
    }

    const account = getCaseInsensitiveRecordValue(accounts, address);
    return Boolean(account?.balance && isPositiveHexBalance(account.balance));
  });
}

function hasAvailableTokenBalance({
  address,
  tokenBalances,
  tokensControllerState,
}: {
  address: string;
  tokenBalances: TokenBalances;
  tokensControllerState?: Partial<Pick<TokensControllerState, 'allTokens'>>;
}): boolean {
  const allTokens = tokensControllerState?.allTokens ?? {};

  return Object.entries(allTokens).some(([chainId, tokensByAddress]) => {
    if (isTestChain(chainId)) {
      return false;
    }

    const accountTokens = getCaseInsensitiveRecordValue(
      tokensByAddress,
      address,
    );

    return (accountTokens ?? []).some(({ address: tokenAddress }) => {
      const accountBalances = getCaseInsensitiveRecordValue(
        tokenBalances,
        address,
      );
      const chainBalances = getCaseInsensitiveRecordValue(
        accountBalances,
        chainId,
      );
      const tokenBalance = getCaseInsensitiveRecordValue(
        chainBalances,
        tokenAddress,
      );

      return Boolean(tokenBalance && isPositiveHexBalance(tokenBalance));
    });
  });
}

function isPositiveHexBalance(balance: string): boolean {
  try {
    return BigInt(balance) > 0n;
  } catch {
    return false;
  }
}

function isTestChain(chainId: string): boolean {
  return TEST_CHAINS.some(
    (testChainId) => testChainId.toLowerCase() === chainId.toLowerCase(),
  );
}

function getCaseInsensitiveRecordValue<Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Value | undefined {
  return Object.entries(record ?? {}).find(
    ([recordKey]) => recordKey.toLowerCase() === key.toLowerCase(),
  )?.[1];
}
