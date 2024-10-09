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
import { REFRESH_INTERVAL_MS } from '../../../app/scripts/controllers/bridge/constants';
import {
  BridgeAsset,
  BridgeFlag,
  FeatureFlagResponse,
  Quote,
  QuoteRequest,
  QuoteResponse,
  TxData,
} from './types';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };
const CACHE_REFRESH_TEN_MINUTES = 10 * MINUTE;

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
          property: BridgeFlag.EXTENSION_CONFIG,
          type: 'object',
          validator: (
            v,
          ): v is Pick<FeatureFlagResponse, BridgeFlag.EXTENSION_CONFIG> =>
            typeof v === 'object' &&
            v !== null &&
            'refreshRate' in v &&
            typeof v.refreshRate === 'number' &&
            'maxRefreshCount' in v &&
            typeof v.maxRefreshCount === 'number',
        },
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
      [BridgeFeatureFlagsKey.EXTENSION_CONFIG]:
        rawFeatureFlags[BridgeFlag.EXTENSION_CONFIG],
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
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: 5,
    },
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

  const nativeToken =
    SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
      chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
    ];

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

// Returns a list of bridge tx quotes
export async function fetchBridgeQuotes(
  request: QuoteRequest,
): Promise<QuoteResponse[]> {
  const url = `${BRIDGE_API_BASE_URL}/getQuote?${Object.entries(request)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')}`;
  const quotes = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: 0 },
    functionName: 'fetchBridgeQuotes',
  });

  const filteredQuotes = quotes.filter((quote: QuoteResponse) =>
    validateResponse<QuoteResponse, unknown>(
      [
        {
          property: 'quote',
          type: 'object',
          validator: (v): v is Quote =>
            typeof v === 'object' &&
            v !== null &&
            v !== undefined &&
            [
              'requestId',
              'srcTokenAmount',
              'destTokenAmount',
              'bridgeId',
            ].every(
              (k) => k in v && typeof v[k as keyof typeof v] === 'string',
            ) &&
            ['srcTokenAmount', 'destTokenAmount'].every(
              (k) =>
                k in v &&
                typeof v[k as keyof typeof v] === 'string' &&
                /^\d+$/u.test(v[k as keyof typeof v] as string),
            ) &&
            ['srcAsset', 'destAsset'].every(
              (k) =>
                k in v &&
                typeof v[k as keyof typeof v] === 'object' &&
                'address' in v[k as keyof typeof v] &&
                typeof (v[k as keyof typeof v] as BridgeAsset).address ===
                  'string' &&
                'decimals' in v[k as keyof typeof v] &&
                typeof (v[k as keyof typeof v] as BridgeAsset).decimals ===
                  'number',
            ),
        },
        {
          property: 'approval',
          type: 'object|undefined',
          validator: (v): v is TxData | undefined =>
            v === undefined ||
            (v
              ? typeof v === 'object' &&
                'gasLimit' in v &&
                typeof v.gasLimit === 'number' &&
                'to' in v &&
                typeof v.to === 'string' &&
                'from' in v &&
                typeof v.from === 'string' &&
                'data' in v &&
                typeof v.data === 'string'
              : false),
        },
        {
          property: 'trade',
          type: 'object',
          validator: (v): v is TxData =>
            v
              ? typeof v === 'object' &&
                'gasLimit' in v &&
                typeof v.gasLimit === 'number' &&
                'to' in v &&
                typeof v.to === 'string' &&
                'from' in v &&
                typeof v.from === 'string' &&
                'data' in v &&
                typeof v.data === 'string' &&
                'value' in v &&
                typeof v.value === 'string' &&
                v.value.startsWith('0x')
              : false,
        },
        {
          property: 'estimatedProcessingTimeInSeconds',
          type: 'number',
          validator: (v): v is number[] =>
            Object.values(v as { [s: string]: unknown }).every(
              (i) => typeof i === 'number',
            ),
        },
      ],
      quote,
      url,
    ),
  );
  return filteredQuotes;
}
