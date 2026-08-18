import { formatChainIdToHex } from '@metamask/bridge-controller';
import type { Hex } from '@metamask/utils';
import { isStrictHexString } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import { StablecoinsByChainId } from '../../../shared/constants/swaps';
import { MUSD_TOKEN_ADDRESS } from '../../components/app/musd/constants';
import type { BlockedPayTokensListConfig } from '../../pages/confirmations/selectors/feature-flags';
import type { Asset } from '../../pages/confirmations/types/send';
import { isTokenBlocked } from '../../pages/confirmations/utils/transaction-pay';

export const MONEY_PROJECTION_YEARS = 1;

type CurrencyRate = {
  conversionRate?: number | null;
  usdConversionRate?: number | null;
};

type NetworkConfiguration = {
  nativeCurrency?: string;
};

export type MoneyDepositToken = {
  chainId: Hex;
  address: Hex;
  decimals: number;
  image: string;
  networkImage?: string;
  networkName?: string;
  symbol: string;
  title: string;
  moneyFiatAmountUsd: number;
};

export type MoneySubsidizedRoute = {
  sourceChain: Hex;
  sourceToken: Hex;
  targetChain: Hex;
  targetToken: Hex;
};

type FilterMoneyDepositTokensOptions = {
  assets: Asset[];
  blockedTokens: BlockedPayTokensListConfig;
  minBalance: number;
  currentCurrency: string;
  currencyRates: Record<string, CurrencyRate> | undefined;
  networkConfigurations: Record<string, NetworkConfiguration>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const addressesEqual = (
  first: string | undefined,
  second: string | undefined,
): boolean =>
  Boolean(first && second && first.toLowerCase() === second.toLowerCase());

const OPTIMISTIC_STABLECOIN_SYMBOLS = new Set([
  'DAI',
  'MUSD',
  'USDC',
  'USDS',
  'USDT',
]);

function isOptimisticStablecoin(
  token: Pick<MoneyDepositToken, 'address' | 'chainId' | 'symbol'>,
): boolean {
  const knownAddresses = StablecoinsByChainId[token.chainId];
  const hasKnownAddress = [...(knownAddresses ?? [])].some((address) =>
    addressesEqual(address, token.address),
  );

  return (
    hasKnownAddress ||
    OPTIMISTIC_STABLECOIN_SYMBOLS.has(token.symbol.toUpperCase())
  );
}

/**
 * Calculates projected earnings for a fiat principal and APY.
 *
 * @param principalFiat - Principal value in fiat.
 * @param apyDecimal - APY expressed as a decimal.
 * @param years - Projection horizon in years.
 * @returns Projected fiat earnings.
 */
export function calculateMoneyProjectedEarnings(
  principalFiat: number,
  apyDecimal: number,
  years = MONEY_PROJECTION_YEARS,
): number {
  return principalFiat * (Math.pow(1 + apyDecimal, years) - 1);
}

/**
 * Converts a value in the selected fiat currency to USD.
 *
 * @param fiatValue - Value in the selected fiat currency.
 * @param conversionRate - Native-token price in the selected currency.
 * @param usdConversionRate - Native-token price in USD.
 * @returns The USD value, or `undefined` when conversion is unavailable.
 */
export function convertMoneyFiatToUsd(
  fiatValue: number,
  conversionRate: number | null | undefined,
  usdConversionRate: number | null | undefined,
): number | undefined {
  if (!conversionRate || !usdConversionRate) {
    return undefined;
  }

  return fiatValue * (usdConversionRate / conversionRate);
}

function getUsdFiatAmount({
  fiatAmount,
  chainId,
  currentCurrency,
  currencyRates,
  networkConfigurations,
}: {
  fiatAmount: number;
  chainId: string;
  currentCurrency: string;
  currencyRates: Record<string, CurrencyRate> | undefined;
  networkConfigurations: Record<string, NetworkConfiguration>;
}): number | undefined {
  if (currentCurrency.toLowerCase() === 'usd') {
    return fiatAmount;
  }

  const nativeCurrency =
    networkConfigurations[chainId]?.nativeCurrency ??
    networkConfigurations[chainId.toLowerCase()]?.nativeCurrency;
  const preferredRate = nativeCurrency
    ? currencyRates?.[nativeCurrency]
    : undefined;
  const fallbackRate = Object.values(currencyRates ?? {}).find(
    ({ conversionRate, usdConversionRate }) =>
      Boolean(conversionRate && usdConversionRate),
  );
  const rate =
    preferredRate?.conversionRate && preferredRate.usdConversionRate
      ? preferredRate
      : fallbackRate;

  return convertMoneyFiatToUsd(
    fiatAmount,
    rate?.conversionRate,
    rate?.usdConversionRate,
  );
}

/**
 * Filters and sorts wallet assets that can fund a Money account.
 *
 * @param options - Wallet assets and Money deposit configuration.
 * @param options.assets
 * @param options.blockedTokens
 * @param options.minBalance
 * @param options.currentCurrency
 * @param options.currencyRates
 * @param options.networkConfigurations
 * @returns Deposit-eligible EVM assets, normalized to USD.
 */
export function filterMoneyDepositTokens({
  assets,
  blockedTokens,
  minBalance,
  currentCurrency,
  currencyRates,
  networkConfigurations,
}: FilterMoneyDepositTokensOptions): MoneyDepositToken[] {
  return assets
    .flatMap((asset) => {
      const fiatAmount = Number(asset.fiat?.balance);
      const chainId = String(asset.chainId ?? '');
      const { address } = asset;
      if (
        !asset.accountType?.includes('eip155') ||
        !chainId ||
        !address ||
        !Number.isFinite(fiatAmount) ||
        isTokenBlocked(asset, blockedTokens)
      ) {
        return [];
      }

      const chainIdHex = formatChainIdToHex(chainId);
      const moneyFiatAmountUsd = getUsdFiatAmount({
        fiatAmount,
        chainId: chainIdHex,
        currentCurrency: asset.fiat?.currency ?? currentCurrency,
        currencyRates,
        networkConfigurations,
      });
      if (
        moneyFiatAmountUsd === undefined ||
        !Number.isFinite(moneyFiatAmountUsd) ||
        moneyFiatAmountUsd <= 0 ||
        moneyFiatAmountUsd < minBalance
      ) {
        return [];
      }

      return [
        {
          address: address as Hex,
          chainId: chainIdHex,
          decimals: asset.decimals ?? 0,
          image: asset.image ?? '',
          networkImage: asset.networkImage,
          networkName: asset.networkName,
          symbol: asset.symbol ?? '',
          title: asset.name ?? asset.symbol ?? '',
          moneyFiatAmountUsd,
        },
      ];
    })
    .sort(
      (first, second) => second.moneyFiatAmountUsd - first.moneyFiatAmountUsd,
    );
}

/**
 * Parses subsidized routes from the Relay fixed-spread feature flag.
 *
 * @param rawValue - Raw `confirmations_relay_fixed_spread` flag value.
 * @returns Valid resolved routes; malformed entries are ignored.
 */
export function parseMoneySubsidizedRoutes(
  rawValue: unknown,
): MoneySubsidizedRoute[] {
  let parsed = rawValue;
  if (typeof rawValue === 'string') {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      return [];
    }
  }
  if (
    !isRecord(parsed) ||
    !isRecord(parsed.chains) ||
    !isRecord(parsed.tokens)
  ) {
    return [];
  }

  const { chains } = parsed;
  const { tokens } = parsed;
  if (!Array.isArray(parsed.routes)) {
    return [];
  }

  return parsed.routes.flatMap((route) => {
    if (
      !Array.isArray(route) ||
      route.length !== 4 ||
      route.some((alias) => typeof alias !== 'string')
    ) {
      return [];
    }

    const [
      sourceChainAlias,
      sourceTokenAlias,
      targetChainAlias,
      targetTokenAlias,
    ] = route as string[];
    const sourceChain = chains[sourceChainAlias];
    const sourceToken = tokens[sourceTokenAlias];
    const targetChain = chains[targetChainAlias];
    const targetToken = tokens[targetTokenAlias];
    if (
      !isStrictHexString(sourceChain) ||
      !isStrictHexString(sourceToken) ||
      !isStrictHexString(targetChain) ||
      !isStrictHexString(targetToken)
    ) {
      return [];
    }

    return [
      {
        sourceChain: sourceChain.toLowerCase() as Hex,
        sourceToken: sourceToken.toLowerCase() as Hex,
        targetChain: targetChain.toLowerCase() as Hex,
        targetToken: targetToken.toLowerCase() as Hex,
      },
    ];
  });
}

/**
 * Determines whether a Money deposit token has no Relay fee.
 *
 * @param token - Deposit token.
 * @param routes - Subsidized directional routes.
 * @returns Whether the token is Monad mUSD or has a subsidized route to it.
 */
export function isNoFeeMoneyDepositToken(
  token: Pick<MoneyDepositToken, 'address' | 'chainId' | 'symbol'>,
  routes: MoneySubsidizedRoute[],
): boolean {
  const target = {
    chainId: CHAIN_IDS.MONAD,
    address: MUSD_TOKEN_ADDRESS,
  };
  if (
    addressesEqual(token.chainId, target.chainId) &&
    addressesEqual(token.address, target.address)
  ) {
    return true;
  }

  const hasSubsidizedRoute = routes.some(
    (route) =>
      addressesEqual(route.sourceChain, token.chainId) &&
      addressesEqual(route.sourceToken, token.address) &&
      addressesEqual(route.targetChain, target.chainId) &&
      addressesEqual(route.targetToken, target.address),
  );

  if (hasSubsidizedRoute) {
    return true;
  }

  return isOptimisticStablecoin(token);
}
