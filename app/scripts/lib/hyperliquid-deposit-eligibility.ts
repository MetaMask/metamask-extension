import type { TokenBalancesControllerState } from '@metamask/assets-controllers';
import type {
  AccountState,
  PerpsControllerState,
} from '@metamask/perps-controller';
import log from 'loglevel';
import {
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
} from '../../../shared/lib/hyperliquid-deposit-transaction';

const HYPERLIQUID_PROVIDER_ID = 'hyperliquid';
const ELIGIBILITY_ACCOUNT_STATE_SOURCE =
  'hyperliquid_deposit_prompt_eligibility';

type TokenBalances =
  NonNullable<TokenBalancesControllerState['tokenBalances']>;

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
  }) => Promise<AccountState>;
  state?: Partial<Pick<PerpsControllerState, 'perpsBalances'>>;
};

type TokenBalancesControllerLike = {
  state?: Partial<TokenBalancesControllerState>;
  updateBalances?: (
    options?: UpdateBalancesOptions,
  ) => Promise<void> | void;
};

type IsHyperliquidDepositPromptEligibleOptions = {
  logger?: Pick<typeof log, 'warn'>;
  perpsController?: PerpsControllerLike;
  signerAddress?: string;
  tokenBalancesController?: TokenBalancesControllerLike;
};

export async function isHyperliquidDepositPromptEligible({
  logger = log,
  perpsController,
  signerAddress,
  tokenBalancesController,
}: IsHyperliquidDepositPromptEligibleOptions): Promise<boolean> {
  if (!signerAddress || !perpsController || !tokenBalancesController) {
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

  const didRefreshUsdcBalance = await refreshArbitrumUsdcBalance({
    logger,
    tokenBalancesController,
  });

  if (!didRefreshUsdcBalance) {
    return false;
  }

  return (
    hasZeroHyperliquidPerpsBalance({
      accountState,
      perpsBalances: perpsController.state?.perpsBalances,
    }) &&
    hasZeroArbitrumUsdcBalance({
      address: signerAddress,
      tokenBalances: tokenBalancesController.state?.tokenBalances ?? {},
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
    accountState?.availableBalance,
    accountState?.availableToTradeBalance,
    perpsBalances?.[HYPERLIQUID_PROVIDER_ID]?.totalBalance,
  ].filter((balance): balance is string => balance !== undefined);

  return balances.length > 0 && balances.every(isZeroDecimalBalance);
}

export function hasZeroArbitrumUsdcBalance({
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

  return usdcBalance === undefined || isZeroHexBalance(usdcBalance);
}

async function getHyperliquidAccountState({
  logger,
  perpsController,
  signerAddress,
}: {
  logger: Pick<typeof log, 'warn'>;
  perpsController: PerpsControllerLike;
  signerAddress: string;
}): Promise<AccountState | undefined> {
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
    logger.warn('Unable to fetch Hyperliquid account state for deposit gate', {
      error,
    });
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
    logger.warn('Unable to refresh Arbitrum USDC balance for deposit gate', {
      error,
    });
    return false;
  }
}

function isZeroDecimalBalance(balance: string): boolean {
  const parsedBalance = Number.parseFloat(balance);
  return Number.isFinite(parsedBalance) && parsedBalance === 0;
}

function isZeroHexBalance(balance: string): boolean {
  try {
    return BigInt(balance) === 0n;
  } catch {
    return false;
  }
}

function getCaseInsensitiveRecordValue<Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Value | undefined {
  return Object.entries(record ?? {}).find(
    ([recordKey]) => recordKey.toLowerCase() === key.toLowerCase(),
  )?.[1];
}
