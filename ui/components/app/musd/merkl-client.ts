import { type Hex, hexToNumber } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import {
  MERKL_API_BASE_URL,
  MERKL_CLAIM_CHAIN_ID,
  MERKL_DISTRIBUTOR_ADDRESS,
  MUSD_TOKEN_ADDRESS,
  AGLAMERKL_ADDRESS_MAINNET,
  AGLAMERKL_ADDRESS_LINEA,
  DISTRIBUTOR_CLAIMED_ABI,
} from './constants';

/**
 * Merkl API reward data structure
 */
export type MerklRewardData = {
  rewards: MerklReward[];
};

export type MerklReward = {
  token: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    price: number | null;
  };
  pending: string;
  proofs: string[];
  amount: string;
  claimed: string;
  recipient: string;
};

/**
 * Options for fetching Merkl rewards
 */
export type FetchMerklRewardsOptions = {
  userAddress: string;
  chainIds: Hex | Hex[];
  tokenAddress: Hex;
  signal?: AbortSignal;
};

/**
 * Check if the given token address is mUSD (case-insensitive).
 *
 * @param tokenAddress - Token address to check
 * @returns true if the address matches the mUSD token address
 */
const isMusdToken = (tokenAddress: string): boolean =>
  tokenAddress.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase();

/**
 * Build the Merkl API URL for fetching rewards.
 *
 * @param userAddress - The user's wallet address
 * @param chainIds - Single chainId or array of chainIds
 * @param tokenAddress - The token address
 * @returns Fully formed Merkl API URL
 */
const buildRewardsUrl = (
  userAddress: string,
  chainIds: Hex | Hex[],
  tokenAddress: Hex,
): string => {
  // Merkl API expects decimal chain IDs
  const toDecimal = (id: Hex): number => {
    return hexToNumber(id);
  };
  const chainIdParam = Array.isArray(chainIds)
    ? chainIds.map(toDecimal).join(',')
    : toDecimal(chainIds);

  let url = `${MERKL_API_BASE_URL}/users/${userAddress}/rewards?chainId=${chainIdParam}`;

  // Add test parameter for test tokens (case-insensitive comparison)
  if (
    tokenAddress.toLowerCase() === AGLAMERKL_ADDRESS_MAINNET.toLowerCase() ||
    tokenAddress.toLowerCase() === AGLAMERKL_ADDRESS_LINEA.toLowerCase()
  ) {
    url += '&test=true';
  }

  return url;
};

/**
 * Find the matching reward for a given token address in the API response.
 * Searches through all data array elements, not just data[0].
 *
 * @param data - Array of Merkl reward data from the API
 * @param tokenAddress - The token address to match
 * @returns The matching reward, or null if not found
 */
const findMatchingReward = (
  data: MerklRewardData[],
  tokenAddress: Hex,
): MerklReward | null => {
  const tokenAddressLower = tokenAddress.toLowerCase();

  for (const dataEntry of data) {
    const matchingReward = dataEntry?.rewards?.find(
      (reward) => reward.token.address.toLowerCase() === tokenAddressLower,
    );
    if (matchingReward) {
      return matchingReward;
    }
  }

  return null;
};

/**
 * Get the chain IDs to fetch Merkl rewards from.
 * For mUSD, rewards are on Linea regardless of where the user holds the token.
 *
 * @param assetChainId - The chain ID of the asset
 * @param tokenAddress - The token address
 * @returns Array of chain IDs to query
 */
const getChainIdsForRewardsFetch = (
  assetChainId: Hex,
  tokenAddress: string,
): Hex[] => {
  if (isMusdToken(tokenAddress)) {
    return [MERKL_CLAIM_CHAIN_ID];
  }
  return [assetChainId];
};

/**
 * Fetch Merkl rewards from the API for a given user and token.
 *
 * @param options - Fetch options
 * @param options.userAddress - The user's wallet address
 * @param options.chainIds - Chain ID(s) to query
 * @param options.tokenAddress - The reward token address to search for
 * @param options.signal - Optional AbortSignal for cancellation
 * @returns The matching reward data, or null if not found
 * @throws Error if the API request fails
 */
export const fetchMerklRewards = async ({
  userAddress,
  chainIds,
  tokenAddress,
  signal,
}: FetchMerklRewardsOptions): Promise<MerklReward | null> => {
  const url = buildRewardsUrl(userAddress, chainIds, tokenAddress);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch Merkl rewards: ${response.status}`);
  }

  const data: MerklRewardData[] = await response.json();
  return findMatchingReward(data, tokenAddress);
};

/**
 * Simple in-memory cache for Merkl reward data.
 * Avoids redundant API calls when the same data is requested within a short
 * window.
 */
const rewardCache = new Map<
  string,
  { data: MerklReward | null; timestamp: number }
>();
const REWARD_CACHE_TTL_MS = 5 * 60_000; // 5 minutes — proofs update infrequently (daily/weekly)

/**
 * Clear the reward cache. Exported for use in tests.
 */
export const clearRewardCache = () => rewardCache.clear();

/**
 * Fetch Merkl rewards for a specific asset.
 * For mUSD tokens, always fetches from Linea and looks for Linea mUSD rewards.
 * Results are cached for 5 minutes to speed up the claim flow when data was
 * recently fetched.
 *
 * @param tokenAddress - The token's contract address
 * @param chainId - The chain where the token is held
 * @param userAddress - The user's wallet address
 * @param signal - Optional AbortSignal for cancellation
 * @returns The matching reward data, or null if not found
 */
export const fetchMerklRewardsForAsset = async (
  tokenAddress: string,
  chainId: Hex,
  userAddress: string,
  signal?: AbortSignal,
): Promise<MerklReward | null> => {
  const chainIds = getChainIdsForRewardsFetch(chainId, tokenAddress);

  // For mUSD, always search for MUSD_TOKEN_ADDRESS rewards
  const rewardTokenAddress = isMusdToken(tokenAddress)
    ? (MUSD_TOKEN_ADDRESS as Hex)
    : (tokenAddress as Hex);

  const cacheKey = `${userAddress}:${rewardTokenAddress}:${chainIds.join(',')}`;
  const cached = rewardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < REWARD_CACHE_TTL_MS) {
    return cached.data;
  }

  const result = await fetchMerklRewards({
    userAddress,
    chainIds,
    tokenAddress: rewardTokenAddress,
    signal,
  });

  rewardCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};

/**
 * Get the RPC URL for a given chain ID, using the build-time resolved Infura
 * project ID from FEATURED_RPCS. This avoids the {infuraProjectId} placeholder
 * stored in NetworkController state, matching the pattern used by notification.util.ts.
 *
 * @param chainId - The chain ID to get the RPC URL for
 * @returns The RPC URL with the real Infura key baked in
 */
const getRpcUrlForChain = (chainId: Hex): string | null => {
  const rpc = FEATURED_RPCS.find((r) => r.chainId === chainId);
  return rpc?.rpcEndpoints?.[0]?.url ?? null;
};

/**
 * Read the claimed amount from the Merkl Distributor contract via JSON-RPC eth_call.
 * This provides the most up-to-date claimed amount directly from the blockchain,
 * bypassing the Merkl API which can have stale data after a claim.
 *
 * Uses the build-time resolved Infura URL (from FEATURED_RPCS) with the
 * Infura-Source header, matching the pattern used by notification.util.ts.
 *
 * @param userAddress - The user's wallet address
 * @param tokenAddress - The reward token address
 * @returns The claimed amount as a string (in base units/wei), or null if the call fails
 */
export const getClaimedAmountFromContract = async (
  userAddress: string,
  tokenAddress: Hex,
): Promise<string | null> => {
  try {
    const claimChainId = MERKL_CLAIM_CHAIN_ID;
    const rpcUrl = getRpcUrlForChain(claimChainId);
    if (!rpcUrl) {
      return null;
    }

    const contractInterface = new Interface(DISTRIBUTOR_CLAIMED_ABI);
    const data = contractInterface.encodeFunctionData('claimed', [
      userAddress,
      tokenAddress,
    ]);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Infura-Source': 'metamask/metamask',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: MERKL_DISTRIBUTOR_ADDRESS, data }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      result?: string;
      error?: { message: string };
    };

    if (json.error || !json.result || json.result === '0x') {
      return null;
    }

    // Decode the struct response: (uint208 amount, uint48 timestamp, bytes32 merkleRoot)
    const decoded = contractInterface.decodeFunctionResult(
      'claimed',
      json.result,
    );
    const claimedAmount = decoded.amount ?? decoded[0];
    return claimedAmount.toString();
  } catch {
    // Return null on error to allow fallback to API value
    return null;
  }
};
