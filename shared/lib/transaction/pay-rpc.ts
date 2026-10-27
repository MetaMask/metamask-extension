import { TransactionType } from '@metamask/transaction-controller';

/**
 * Remote feature flag that controls which MetaMask Pay transaction types dApps
 * can request through `wallet_mmPay`, and which dApps can request them.
 */
export const PAY_RPC_FEATURE_FLAG = 'confirmations_pay_rpc';

export type PayRpcType =
  | typeof TransactionType.perpsDeposit
  | typeof TransactionType.perpsWithdraw;

type PayRpcDappConfig = {
  allowedTypes?: unknown;
};

type PayRpcFeatureFlag = {
  allowedTypes?: unknown;
  dapps?: Record<string, PayRpcDappConfig | undefined>;
};

type PayPostQuoteConfig = {
  enabled?: boolean;
};

type PayPostQuoteFeatureFlag = {
  default?: PayPostQuoteConfig;
  overrides?: Record<string, PayPostQuoteConfig | undefined>;
  [transactionType: string]: unknown;
};

type FeatureFlagSource = {
  remoteFeatureFlags?: Record<string, unknown>;
};

// `localhost` is allowed on any port, so local development servers work
// without listing every port in the flag.
const LOCALHOST_ORIGIN = 'http://localhost';

/**
 * Whether a dApp may request a MetaMask Pay transaction type through
 * `wallet_mmPay`, based on the `confirmations_pay_rpc` remote feature flag.
 *
 * The type must be enabled at the top level (the kill switch) and listed for
 * the requesting dApp. Origins are matched exactly, scheme included, except
 * `http://localhost`, which matches any port. `perpsWithdraw` also requires
 * the in-wallet withdraw flag (`confirmations_pay_post_quote`).
 *
 * @param source - An object holding the remote feature flags.
 * @param origin - The requesting dApp's origin.
 * @param type - The requested transaction type.
 * @returns Whether the request is allowed.
 */
export function isPayRpcTypeAllowed(
  source: FeatureFlagSource,
  origin: string,
  type: string,
): boolean {
  const flag = source.remoteFeatureFlags?.[PAY_RPC_FEATURE_FLAG] as
    | PayRpcFeatureFlag
    | undefined;

  if (!isPlainObject(flag)) {
    return false;
  }

  if (!toStringArray(flag.allowedTypes).includes(type)) {
    return false;
  }

  const dappConfig = getDappConfig(flag.dapps, origin);

  if (!toStringArray(dappConfig?.allowedTypes).includes(type)) {
    return false;
  }

  if (type === TransactionType.perpsWithdraw) {
    return isPerpsWithdrawEnabled(source);
  }

  return true;
}

function getDappConfig(
  dapps: PayRpcFeatureFlag['dapps'],
  origin: string,
): PayRpcDappConfig | undefined {
  if (!isPlainObject(dapps)) {
    return undefined;
  }

  const url = parseUrl(origin);

  if (!url) {
    return undefined;
  }

  const exactMatch = dapps[url.origin];

  if (exactMatch) {
    return exactMatch;
  }

  const isLocalhost = url.protocol === 'http:' && url.hostname === 'localhost';

  return isLocalhost ? dapps[LOCALHOST_ORIGIN] : undefined;
}

// A dApp withdraw uses the in-wallet withdraw flow, so it is also gated by that
// flow's flag. Same resolution as the UI's `selectPayQuoteConfig`: a
// transaction-specific config (under `overrides` or a direct key) wins over
// `default`.
function isPerpsWithdrawEnabled(source: FeatureFlagSource): boolean {
  const flag = source.remoteFeatureFlags?.confirmations_pay_post_quote as
    | PayPostQuoteFeatureFlag
    | undefined;

  const transactionConfig = (flag?.overrides?.[TransactionType.perpsWithdraw] ??
    flag?.[TransactionType.perpsWithdraw]) as PayPostQuoteConfig | undefined;

  return (transactionConfig?.enabled ?? flag?.default?.enabled) === true;
}

function parseUrl(origin: string): URL | undefined {
  try {
    return new URL(origin);
  } catch {
    return undefined;
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isPlainObject<Value>(
  value: Value | undefined,
): value is Value & object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
