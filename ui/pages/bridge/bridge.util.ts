import { Contract } from '@ethersproject/contracts';
import { Hex, add0x } from '@metamask/utils';
import { TransactionParams } from '@metamask/transaction-controller';
import {
  BridgeFeatureFlagsKey,
  BridgeFeatureFlags,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
  ETH_USDT_ADDRESS,
  METABRIDGE_ETHEREUM_ADDRESS,
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
import { CHAIN_IDS } from '../../../shared/constants/network';
import { ETHEREUM_USDT_APPROVALS_ABI } from './EthUsdtApprovalsAbi';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };
const CACHE_REFRESH_TEN_MINUTES = 10 * MINUTE;

// Types copied from Metabridge API
enum BridgeFlag {
  EXTENSION_SUPPORT = 'extension-support',
  NETWORK_SRC_ALLOWLIST = 'src-network-allowlist',
  NETWORK_DEST_ALLOWLIST = 'dest-network-allowlist',
  APPROVAL_GAS_MULTIPLIER = 'approval-gas-multiplier',
  BRIDGE_GAS_MULTIPLIER = 'bridge-gas-multiplier',
}

type DecChainId = string;
type GasMultiplierByDecChainId = Record<DecChainId, number>;

export type FeatureFlagResponse = {
  [BridgeFlag.EXTENSION_SUPPORT]: boolean;
  [BridgeFlag.NETWORK_SRC_ALLOWLIST]: number[];
  [BridgeFlag.NETWORK_DEST_ALLOWLIST]: number[];
  [BridgeFlag.APPROVAL_GAS_MULTIPLIER]: GasMultiplierByDecChainId;
  [BridgeFlag.BRIDGE_GAS_MULTIPLIER]: GasMultiplierByDecChainId;
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
        {
          property: BridgeFlag.APPROVAL_GAS_MULTIPLIER,
          type: 'object',
          validator: (v): v is GasMultiplierByDecChainId =>
            Object.values(v as { [s: DecChainId]: unknown }).every(
              (i) => typeof i === 'number',
            ),
        },
        {
          property: BridgeFlag.BRIDGE_GAS_MULTIPLIER,
          type: 'object',
          validator: (v): v is GasMultiplierByDecChainId =>
            Object.values(v as { [s: DecChainId]: unknown }).every(
              (i) => typeof i === 'number',
            ),
        },
      ],
      rawFeatureFlags,
      url,
    )
  ) {
    const approvalGasMultiplier = Object.keys(
      rawFeatureFlags[BridgeFlag.APPROVAL_GAS_MULTIPLIER],
    ).reduce<GasMultiplierByDecChainId>((acc, decChainId) => {
      const hexChainId = add0x(decimalToHex(decChainId));
      acc[hexChainId] =
        rawFeatureFlags[BridgeFlag.APPROVAL_GAS_MULTIPLIER][decChainId];
      return acc;
    }, {});

    const bridgeGasMultiplier = Object.keys(
      rawFeatureFlags[BridgeFlag.BRIDGE_GAS_MULTIPLIER],
    ).reduce<GasMultiplierByDecChainId>((acc, decChainId) => {
      const hexChainId = add0x(decimalToHex(decChainId));
      acc[hexChainId] =
        rawFeatureFlags[BridgeFlag.BRIDGE_GAS_MULTIPLIER][decChainId];
      return acc;
    }, {});

    return {
      [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]:
        rawFeatureFlags[BridgeFlag.EXTENSION_SUPPORT],
      [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: rawFeatureFlags[
        BridgeFlag.NETWORK_SRC_ALLOWLIST
      ].map((chainIdDec) => add0x(decimalToHex(chainIdDec))),
      [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: rawFeatureFlags[
        BridgeFlag.NETWORK_DEST_ALLOWLIST
      ].map((chainIdDec) => add0x(decimalToHex(chainIdDec))),
      [BridgeFeatureFlagsKey.APPROVAL_GAS_MULTIPLIER]: approvalGasMultiplier,
      [BridgeFeatureFlagsKey.BRIDGE_GAS_MULTIPLIER]: bridgeGasMultiplier,
    };
  }

  return {
    // TODO set default to true once bridging is live
    [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
    // TODO set default to ALLOWED_BRIDGE_CHAIN_IDS once bridging is live
    [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
    // TODO set default to ALLOWED_BRIDGE_CHAIN_IDS once bridging is live
    [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
    [BridgeFeatureFlagsKey.APPROVAL_GAS_MULTIPLIER]: {},
    [BridgeFeatureFlagsKey.BRIDGE_GAS_MULTIPLIER]: {},
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

/**
 * A function to return tx for setting allowance to 0 for USDT on Ethereum
 *
 * @param approval - The original transaction params for the required allowance
 * @returns Modified approval transaction params that will reset allowance to 0
 */
export const getEthUsdtApproveResetTxParams = (approval: TransactionParams) => {
  const UsdtContractInterface = new Contract(
    ETH_USDT_ADDRESS,
    ETHEREUM_USDT_APPROVALS_ABI,
  ).interface;
  const data = UsdtContractInterface.encodeFunctionData('approve', [
    METABRIDGE_ETHEREUM_ADDRESS,
    '0',
  ]);

  return {
    ...approval,
    data,
  };
};

export const isEthUsdt = (chainId: Hex, address: string) =>
  chainId === CHAIN_IDS.MAINNET &&
  address.toLowerCase() === ETH_USDT_ADDRESS.toLowerCase();
