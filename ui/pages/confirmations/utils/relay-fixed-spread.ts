import { Hex, isStrictHexString } from '@metamask/utils';

/**
 * Types + helpers for the `confirmations_relay_fixed_spread` remote feature flag.
 */

export type RelayFixedSpreadRoute = {
  sourceChain: Hex;
  sourceToken: Hex;
  targetChain: Hex;
  targetToken: Hex;
};

export type RelayFixedSpreadConfig = {
  routes: RelayFixedSpreadRoute[];
};

export const EMPTY_RELAY_FIXED_SPREAD_CONFIG: RelayFixedSpreadConfig = {
  routes: [],
};

const EXPECTED_FORMAT =
  'Expected format: {"chains":{"eth":"0x1"},"tokens":{"musd":"0x..."},"routes":[["eth","musd","eth","musd"]]}';

const isStringRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const buildAliasMap = (raw: unknown): Map<string, Hex> | null => {
  if (!isStringRecord(raw)) {
    return null;
  }
  const map = new Map<string, Hex>();
  for (const [alias, value] of Object.entries(raw)) {
    if (!isStrictHexString(value)) {
      continue;
    }
    map.set(alias, value.toLowerCase() as Hex);
  }
  return map;
};

type ResolvedRouteBase = {
  srcTokenAlias: string;
  dstTokenAlias: string;
  sourceChain: Hex;
  sourceToken: Hex;
  targetChain: Hex;
  targetToken: Hex;
};

const resolveRouteBase = (
  tuple: unknown,
  chains: Map<string, Hex>,
  tokens: Map<string, Hex>,
): ResolvedRouteBase | null => {
  if (!Array.isArray(tuple) || tuple.length !== 4) {
    return null;
  }
  const [srcChainAlias, srcTokenAlias, dstChainAlias, dstTokenAlias] = tuple;
  if (
    typeof srcChainAlias !== 'string' ||
    typeof srcTokenAlias !== 'string' ||
    typeof dstChainAlias !== 'string' ||
    typeof dstTokenAlias !== 'string'
  ) {
    return null;
  }
  const sourceChain = chains.get(srcChainAlias);
  const sourceToken = tokens.get(srcTokenAlias);
  const targetChain = chains.get(dstChainAlias);
  const targetToken = tokens.get(dstTokenAlias);
  if (!sourceChain || !sourceToken || !targetChain || !targetToken) {
    return null;
  }
  return {
    srcTokenAlias,
    dstTokenAlias,
    sourceChain,
    sourceToken,
    targetChain,
    targetToken,
  };
};

const resolveRoute = (
  tuple: unknown,
  chains: Map<string, Hex>,
  tokens: Map<string, Hex>,
): RelayFixedSpreadRoute | null => {
  const base = resolveRouteBase(tuple, chains, tokens);
  if (!base) {
    return null;
  }
  return {
    sourceChain: base.sourceChain,
    sourceToken: base.sourceToken,
    targetChain: base.targetChain,
    targetToken: base.targetToken,
  };
};

const tryJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractRoutes = (value: unknown): RelayFixedSpreadRoute[] | null => {
  if (!isStringRecord(value)) {
    return null;
  }
  const chains = buildAliasMap(value.chains);
  const tokens = buildAliasMap(value.tokens);
  const { routes } = value;
  if (!chains || !tokens || !Array.isArray(routes)) {
    return null;
  }
  return routes
    .map((tuple) => resolveRoute(tuple, chains, tokens))
    .filter((route): route is RelayFixedSpreadRoute => route !== null);
};

/**
 * Parses a `confirmations_relay_fixed_spread` remote flag value into a
 * normalised, lowercased {@link RelayFixedSpreadConfig}. Invalid entries are
 * silently dropped; a fully invalid payload yields {@link EMPTY_RELAY_FIXED_SPREAD_CONFIG}.
 *
 * Empty/missing payloads are the desired "feature off" state and produce no
 * warning.
 *
 * @param remoteValue - Raw remote feature flag value.
 * @param remoteFlagName - Flag name used in warning messages.
 */
export const getRelayFixedSpreadFromConfig = (
  remoteValue: unknown,
  remoteFlagName: string,
): RelayFixedSpreadConfig => {
  if (remoteValue === undefined || remoteValue === null || remoteValue === '') {
    return EMPTY_RELAY_FIXED_SPREAD_CONFIG;
  }

  const parsed =
    typeof remoteValue === 'string' ? tryJsonParse(remoteValue) : remoteValue;
  if (parsed === null) {
    console.warn(`Failed to parse remote ${remoteFlagName}: invalid JSON.`);
    return EMPTY_RELAY_FIXED_SPREAD_CONFIG;
  }

  const routes = extractRoutes(parsed);
  if (routes === null) {
    console.warn(
      `Remote ${remoteFlagName} produced invalid structure. ${EXPECTED_FORMAT}`,
    );
    return EMPTY_RELAY_FIXED_SPREAD_CONFIG;
  }

  return { routes };
};

const addressesEqual = (
  a: string | undefined,
  b: string | undefined,
): boolean => Boolean(a) && Boolean(b) && a?.toLowerCase() === b?.toLowerCase();

export type RouteEndpoint = {
  chainId: string;
  address: string;
};

/**
 * Returns true when at least one route in {@link config} has a source matching
 * `(chainId, address)`. Used by the "No fee" tag when the consumer does not
 * yet have a directional target.
 *
 * @param config - Parsed relay fixed-spread config.
 * @param source - Source token endpoint to match.
 */
export const isSubsidizedSource = (
  config: RelayFixedSpreadConfig,
  source: RouteEndpoint,
): boolean =>
  config.routes.some(
    (route) =>
      addressesEqual(route.sourceChain, source.chainId) &&
      addressesEqual(route.sourceToken, source.address),
  );

/**
 * Returns true when {@link endpoint} appears as either the source or target of
 * any route. Used by deposit amount prefill to treat relay fixed-spread
 * tokens as "stable" (100% prefill) vs other tokens (50% prefill).
 *
 * @param config - Parsed relay fixed-spread config.
 * @param endpoint - Token endpoint to match.
 */
export const isRouteToken = (
  config: RelayFixedSpreadConfig,
  endpoint: RouteEndpoint,
): boolean =>
  config.routes.some(
    (route) =>
      (addressesEqual(route.sourceChain, endpoint.chainId) &&
        addressesEqual(route.sourceToken, endpoint.address)) ||
      (addressesEqual(route.targetChain, endpoint.chainId) &&
        addressesEqual(route.targetToken, endpoint.address)),
  );

/**
 * Returns true when {@link config} contains an exact `(source → target)` route.
 *
 * @param config - Parsed relay fixed-spread config.
 * @param source - Source token endpoint.
 * @param target - Target token endpoint.
 */
export const isSubsidizedRoute = (
  config: RelayFixedSpreadConfig,
  source: RouteEndpoint,
  target: RouteEndpoint,
): boolean =>
  config.routes.some(
    (route) =>
      addressesEqual(route.sourceChain, source.chainId) &&
      addressesEqual(route.sourceToken, source.address) &&
      addressesEqual(route.targetChain, target.chainId) &&
      addressesEqual(route.targetToken, target.address),
  );
