import { Hex, add0x } from '@metamask/utils';
import {
  BridgeFeatureFlagsKey,
  BridgeFeatureFlags,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
} from '../../../shared/constants/bridge';
import { MINUTE } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { validateData } from '../../../shared/lib/swaps-utils';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../shared/modules/conversion.utils';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
} from '../../../shared/constants/swaps';
import { TOKEN_VALIDATORS } from '../swaps/swaps.util';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../../shared/modules/swaps.utils';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };
const CACHE_REFRESH_TEN_MINUTES = 10 * MINUTE;

// Types copied from Metabridge API
enum BridgeFlag {
  EXTENSION_SUPPORT = 'extension-support',
  NETWORK_SRC_ALLOWLIST = 'src-network-allowlist',
  NETWORK_DEST_ALLOWLIST = 'dest-network-allowlist',
}

export type FeatureFlagResponse = {
  [BridgeFlag.EXTENSION_SUPPORT]: boolean;
  [BridgeFlag.NETWORK_SRC_ALLOWLIST]: number[];
  [BridgeFlag.NETWORK_DEST_ALLOWLIST]: number[];
};
// End of copied types

type Validator<ExpectedResponse, DataToValidate> = {
  property: keyof ExpectedResponse | string;
  type: string;
  validator: (value: DataToValidate) => boolean;
};

const validateResponse = <ExpectedResponse, DataToValidate>(
  validators: Validator<ExpectedResponse, DataToValidate>[],
  data: unknown,
  urlUsed: string,
): data is ExpectedResponse => {
  return validateData(validators, data, urlUsed);
};

export async function fetchBridgeFeatureFlags(): Promise<BridgeFeatureFlags> {
  const url = `${BRIDGE_API_BASE_URL}/getAllFeatureFlags`;
  const rawFeatureFlags = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_TEN_MINUTES },
    functionName: 'fetchBridgeFeatureFlags',
  });

  if (
    validateResponse<FeatureFlagResponse, unknown>(
      [
        {
          property: BridgeFlag.EXTENSION_SUPPORT,
          type: 'boolean',
          validator: (v) => typeof v === 'boolean',
        },
        {
          property: BridgeFlag.NETWORK_SRC_ALLOWLIST,
          type: 'object',
          validator: (v): v is number[] =>
            Object.values(v as { [s: string]: unknown }).every(
              (i) => typeof i === 'number',
            ),
        },
        {
          property: BridgeFlag.NETWORK_DEST_ALLOWLIST,
          type: 'object',
          validator: (v): v is number[] =>
            Object.values(v as { [s: string]: unknown }).every(
              (i) => typeof i === 'number',
            ),
        },
      ],
      rawFeatureFlags,
      url,
    )
  ) {
    return {
      [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]:
        rawFeatureFlags[BridgeFlag.EXTENSION_SUPPORT],
      [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: rawFeatureFlags[
        BridgeFlag.NETWORK_SRC_ALLOWLIST
      ].map((chainIdDec) => add0x(decimalToHex(chainIdDec))),
      [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: rawFeatureFlags[
        BridgeFlag.NETWORK_DEST_ALLOWLIST
      ].map((chainIdDec) => add0x(decimalToHex(chainIdDec))),
    };
  }

  return {
    // TODO set default to true once bridging is live
    [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
    // TODO set default to ALLOWED_BRIDGE_CHAIN_IDS once bridging is live
    [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
    // TODO set default to ALLOWED_BRIDGE_CHAIN_IDS once bridging is live
    [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
  };
}

// Returns a list of enabled (unblocked) tokens
export async function fetchBridgeTokens(
  chainId: Hex,
): Promise<Record<string, SwapsTokenObject>> {
  // TODO make token api v2 call
  const url = `${BRIDGE_API_BASE_URL}/getTokens?chainId=${hexToDecimal(
    chainId,
  )}`;
  const tokens = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: CACHE_REFRESH_TEN_MINUTES },
    functionName: 'fetchBridgeTokens',
  });

  const isSwapsChainId = (
    c: string,
  ): c is keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP =>
    Object.keys(SWAPS_CHAINID_DEFAULT_TOKEN_MAP).includes(c);
  const nativeToken = isSwapsChainId(chainId)
    ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]
    : null;

  const transformedTokens: Record<string, SwapsTokenObject> = {};
  if (nativeToken) {
    transformedTokens[nativeToken.address] = nativeToken;
  }

  tokens.forEach((token: SwapsTokenObject) => {
    if (
      validateResponse<SwapsTokenObject, string>(
        TOKEN_VALIDATORS,
        token,
        url,
      ) &&
      !(
        isSwapsDefaultTokenSymbol(token.symbol, chainId) ||
        isSwapsDefaultTokenAddress(token.address, chainId)
      )
    ) {
      transformedTokens[token.address] = token;
    }
  });
  return transformedTokens;
}
