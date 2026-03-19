/**
 * Network configuration data for production token import tests
 *
 * To add a new network:
 * 1. Add a new entry to the NETWORK_CONFIGS array
 * 2. The test will automatically run for that network
 *
 * No code changes needed - just update this data file!
 */

export type NetworkConfig = {
  /**
   * Unique identifier for the network (used in test names and reports)
   */
  networkId: string;

  /**
   * Display name of the network
   */
  networkName: string;

  /**
   * Chain ID (decimal number)
   */
  chainId: number;

  /**
   * Native currency symbol (e.g., 'ETH', 'XTZ')
   */
  symbol: string;

  /**
   * RPC endpoint URL
   */
  rpcUrl: string;

  /**
   * RPC name (displayed in MetaMask)
   */
  rpcName: string;

  /**
   * URL to the tokenlist JSON file
   */
  tokenlistUrl: string;

  /**
   * Optional: Block explorer URL
   */
  blockExplorerUrl?: string;
};

/**
 * Token object from a tokenlist JSON file
 */
export type TokenListToken = {
  chainId: number | string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  [key: string]: any;
};

/**
 * Complete tokenlist structure
 */
export type TokenList = {
  name?: string;
  logoURI?: string;
  tokens: TokenListToken[];
  [key: string]: any;
};

/**
 * Normalise a chainId to a decimal number.
 * Handles: number (1), decimal string ('1'), hex string ('0x1')
 *
 * @param value - The chainId value
 * @returns The chainId as a decimal number
 */
export function normalizeChainId(value: number | string): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.startsWith('0x')) {
    return parseInt(value, 16);
  }

  return parseInt(value, 10);
}

/**
 * Filter a tokenlist to only include tokens matching a specific chainId.
 *
 * Does not mutate the original tokenlist. Returns a new object with filtered tokens.
 *
 * @param tokenList - The complete tokenlist to filter
 * @param chainId - The target chain ID
 * @returns A new tokenlist containing only tokens for the target chainId
 * @example
 * ```typescript
 * const filtered = filterTokenListByChainId(tokenList, 4326);
 * // filtered.tokens now contains only tokens with chainId: 4326
 * ```
 */
export function filterTokenListByChainId(
  tokenList: TokenList,
  chainId: number,
): TokenList {
  return {
    ...tokenList,
    tokens: tokenList.tokens.filter(
      (token) => normalizeChainId(token.chainId) === chainId,
    ),
  };
}

/**
 * Fetch tokenlist JSON and filter tokens to only those matching the network's chainId.
 *
 * Many tokenlists include tokens for multiple chains (e.g., megaeth list has both
 * chainId 1 and 4326 tokens). This function fetches the list and filters to only
 * the tokens that belong to the specified network.
 *
 * @param network - Network config containing tokenlistUrl and chainId
 * @returns Promise resolving to the filtered tokenlist
 * @throws Error if fetch fails
 * @example
 * ```typescript
 * const megaethConfig = getNetworkConfig('megaeth');
 * const tokenList = await fetchAndFilterTokenList(megaethConfig);
 * // tokenList.tokens now contains ONLY tokens with chainId: 4326
 * ```
 */
export async function fetchAndFilterTokenList(
  network: NetworkConfig,
): Promise<TokenList> {
  const response = await fetch(network.tokenlistUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch tokenlist for ${network.networkId}: ${response.status}`,
    );
  }

  const tokenList: TokenList = await response.json();
  return filterTokenListByChainId(tokenList, network.chainId);
}

/**
 * Fetch tokenlist and extract token addresses for a specific network.
 *
 * Returns only the token addresses (not the full token objects).
 *
 * @param network - Network config containing tokenlistUrl and chainId
 * @returns Promise resolving to array of token addresses
 * @throws Error if fetch fails
 * @example
 * ```typescript
 * const megaethConfig = getNetworkConfig('megaeth');
 * const addresses = await getTokenAddressesForNetwork(megaethConfig);
 * // Returns: ['0xB0F70C0bD6FD87dbEb7C10dC692a2a6106817072', ...]
 * // Only addresses for chainId 4326
 * ```
 */
export async function getTokenAddressesForNetwork(
  network: NetworkConfig,
): Promise<string[]> {
  const tokenList = await fetchAndFilterTokenList(network);
  return tokenList.tokens.map((token) => token.address);
}

/**
 * Fetch tokenlist and get complete token objects for a specific network.
 *
 * Returns the full token objects with all metadata (name, symbol, decimals, etc.).
 *
 * @param network - Network config containing tokenlistUrl and chainId
 * @returns Promise resolving to array of token objects
 * @throws Error if fetch fails
 * @example
 * ```typescript
 * const megaethConfig = getNetworkConfig('megaeth');
 * const tokens = await getTokensForNetwork(megaethConfig);
 * // Returns: [
 * //   {
 * //     chainId: 4326,
 * //     address: '0xB0F70C0bD6FD87dbEb7C10dC692a2a6106817072',
 * //     name: 'Bitcoin',
 * //     symbol: 'BTC.b',
 * //     decimals: 8,
 * //     ...
 * //   },
 * //   ...
 * // ]
 * // Only tokens with chainId 4326
 * ```
 */
export async function getTokensForNetwork(
  network: NetworkConfig,
): Promise<TokenListToken[]> {
  const tokenList = await fetchAndFilterTokenList(network);
  return tokenList.tokens;
}

/**
 * Network configurations for production token import tests
 *
 * Add new networks here to automatically include them in tests
 */
export const NETWORK_CONFIGS: NetworkConfig[] = [
  // {
  //   networkId: 'bob',
  //   networkName: 'BOB',
  //   chainId: 60808,
  //   symbol: 'ETH',
  //   rpcUrl: 'https://rpc.gobob.xyz',
  //   rpcName: 'BOB RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/bob-collective/bob/refs/heads/master/tokenlist/tokenlist-bob.json',
  //   blockExplorerUrl: 'https://explorer.gobob.xyz',
  // },
  // {
  //   networkId: 'etherlink',
  //   networkName: 'Etherlink Mainnet',
  //   chainId: 42793,
  //   symbol: 'XTZ',
  //   rpcUrl: 'https://node.mainnet.etherlink.com',
  //   rpcName: 'Etherlink RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/etherlinkcom/Token-List/refs/heads/main/tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.etherlink.com',
  // },
  // {
  //   networkId: 'Injective',
  //   networkName: 'Injective',
  //   chainId: 1776,
  //   symbol: 'INJ',
  //   rpcUrl: 'https://sentry.evm-rpc.injective.network',
  //   rpcName: 'Injective RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/InjectiveLabs/injective-lists/master/json/tokens/evm/mainnet.json',
  //   blockExplorerUrl: 'https://blockscout.injective.network',
  // },
  // {
  //   networkId: 'Rootstock',
  //   networkName: 'Rootstock Mainnet',
  //   chainId: 30,
  //   symbol: 'RBTC',
  //   rpcUrl: 'https://mycrypto.rsk.co',
  //   rpcName: 'Rootstock RPC',
  //   tokenlistUrl: 'https://tokens.rootstock.io/tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.rsk.co',
  // },
  // {
  //   networkId: 'Genesys',
  //   networkName: 'Genesys Mainnet',
  //   chainId: 16507,
  //   symbol: 'GSYS',
  //   rpcUrl: 'https://rpc.genesys.network',
  //   rpcName: 'Genesys RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/Gchainvalidators/dex-assets/main/tokenlist.json',
  //   blockExplorerUrl: 'https://gchainexplorer.genesys.network',
  // },
  // {
  //   networkId: 'Matchain',
  //   networkName: 'Matchain',
  //   chainId: 698,
  //   symbol: 'BNB',
  //   rpcUrl: 'https://rpc.matchain.io',
  //   rpcName: 'Matchain RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/matchainjis/tokenlist/main/tokenlist.json',
  //   blockExplorerUrl: 'https://matchscan.io',
  // },
  // {
  //   networkId: 'EDU Chain',
  //   networkName: 'EDU Chain',
  //   chainId: 41923,
  //   symbol: 'EDU',
  //   rpcUrl: 'https://rpc.edu-chain.raas.gelato.cloud',
  //   rpcName: 'EDU Chain RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/greenbookwebb/metamask-educhain/main/tokens.json',
  //   blockExplorerUrl: 'https://educhain.blockscout.com',
  // },
  // {
  //   networkId: 'ApeChain',
  //   networkName: 'ApeChain',
  //   chainId: 33139, // 0x8173 in hex
  //   symbol: 'APE',
  //   rpcUrl: 'https://apechain.drpc.org',
  //   rpcName: 'ApeChain RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/CamelotLabs/default-token-list/main/src/tokens/apechain.json',
  //   blockExplorerUrl: 'https://apescan.io',
  // },
  // {
  //   networkId: 'Berachain',
  //   networkName: 'Berachain',
  //   chainId: 80094,
  //   symbol: 'BERA',
  //   rpcUrl: 'https://rpc.berachain.com',
  //   rpcName: 'Berachain RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/berachain/metadata/main/src/tokens/mainnet.json', // Using main branch
  //   blockExplorerUrl: 'https://beratrail.io',
  // },
  // {
  //   networkId: 'XRPLEVM',
  //   networkName: 'XRPL EVM',
  //   chainId: 1440000,
  //   symbol: 'XRP',
  //   rpcUrl: 'https://rpc.xrplevm.org',
  //   rpcName: 'XRPL EVM RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/vriveraPeersyst/xrplevm-tokenlist/main/tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.xrplevm.org',
  // },
  // {
  //   networkId: 'Omnia Chain',
  //   networkName: 'Omnia Chain',
  //   chainId: 2342,
  //   symbol: 'OMNIA',
  //   rpcUrl: 'https://rpc.omniaverse.io',
  //   rpcName: 'Omnia Chain RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/omni-network/omni/refs/heads/main/docs/docs/public/nom/tokenlist.json',
  //   blockExplorerUrl: 'https://scan.omniaverse.io',
  // },
  // {
  //   networkId: 'Fraxtal',
  //   networkName: 'Fraxtal',
  //   chainId: 252,
  //   symbol: 'FRAX',
  //   rpcUrl: 'https://rpc.frax.com',
  //   rpcName: 'Fraxtal RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/FraxFinance/docs/master/public/tokenlist.json',
  //   blockExplorerUrl: 'https://fraxscan.com',
  // },
  // {
  //   networkId: 'XDC',
  //   networkName: 'XDC Network',
  //   chainId: 50,
  //   symbol: 'XDC',
  //   rpcUrl: 'https://rpc.xdcrpc.com',
  //   rpcName: 'XDC Network RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/lifinance/customized-token-list/main/tokens/XDC.json',
  //   blockExplorerUrl: 'https://xdcscan.io',
  // },
  // {
  //   networkId: 'Plasma',
  //   networkName: 'Plasma Network',
  //   chainId: 9745,
  //   symbol: 'XPL',
  //   rpcUrl: 'https://plasma.drpc.org',
  //   rpcName: 'Plasma Network RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/PlasmaLaboratories/plasma-tokenlist/main/plasma.tokenlist.json',
  //   blockExplorerUrl: 'https://plasmascan.to',
  // },
  // {
  //   networkId: 'Hemi',
  //   networkName: 'Hemi Network',
  //   chainId: 43111,
  //   symbol: 'ETH',
  //   rpcUrl: 'https://rpc.hemi.network/rpc',
  //   rpcName: 'Hemi Network RPC',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/hemilabs/token-list/master/src/hemi.tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.hemi.xyz',
  // },
  // {
  //   networkId: 'Cronos Mainnet',
  //   networkName: 'Cronos Mainnet',
  //   chainId: 25,
  //   symbol: 'CRO',
  //   rpcUrl: 'https://cronos.drpc.org',
  //   rpcName: 'Cronos Mainnet RPC',
  //   tokenlistUrl: 'https://gist.githubusercontent.com/sugh01/220d1f9d23d99686c51e5e5850ebd87e/raw/d92e6d2290e02368c40be2ffd0c77e519db626ec/omni.json',
  //   blockExplorerUrl: 'https://explorer.cronos.org',
  // },
  // {
  //   networkId: 'X Layer Mainnet',
  //   networkName: 'X Layer Mainnet',
  //   chainId: 196,
  //   symbol: 'OKB',
  //   rpcUrl: 'https://xlayer.drpc.org',
  //   rpcName: 'X Layer Mainnet',
  //   tokenlistUrl: 'https://raw.githubusercontent.com/okx/xlayer-tokenlist/main/xlayer.tokenlist.json',
  //   blockExplorerUrl: 'https://www.oklink.com/xlayer',
  // },
  {
    networkId: 'Chiliz',
    networkName: 'Chiliz Chain',
    chainId: 88888,
    symbol: 'CHZ',
    rpcUrl: 'https://rpc.ankr.com/chiliz',
    rpcName: 'Chiliz RPC',
    tokenlistUrl:
      'https://raw.githubusercontent.com/chiliz-chain/token-list/main/tokenlist.json',
    blockExplorerUrl: 'https://scan.chiliz.com',
  },
  // {
  //   networkId: 'Tempo Mainnet',
  //   networkName: 'Tempo Mainnet',
  //   chainId: 4217,
  //   symbol: 'USD',
  //   rpcUrl: 'https://tempo-mainnet.drpc.org',
  //   rpcName: 'Tempo Mainnet RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/tempoxyz/tempo-apps/refs/heads/main/apps/tokenlist/data/4217/tokenlist.json',
  //   blockExplorerUrl: 'https://explore.mainnet.tempo.xyz',
  // },
  // {
  //   networkId: 'Tempo Testnet',
  //   networkName: 'Tempo Testnet Moderato',
  //   chainId: 42429,
  //   symbol: 'USD',
  //   rpcUrl: 'https://rpc.testnet.tempo.xyz',
  //   rpcName: 'Tempo Testnet RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/tempoxyz/tempo-apps/main/apps/tokenlist/data/42429/tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.tempo.xyz',
  // },
  // {
  //   networkId: 'megaeth',
  //   networkName: 'MegaETH',
  //   chainId: 4326,
  //   symbol: 'MEGA', // adjust if the native symbol differs
  //   rpcUrl: 'https://rpc.megaeth.io', // placeholder, replace with real RPC
  //   rpcName: 'MegaETH RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/megaeth-labs/mega-tokenlist/main/megaeth.tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.megaeth.io', // optional
  // },
  // {
  //   networkId: 'Base',
  //   networkName: 'Base',
  //   chainId: 4326,
  //   symbol: 'ETH', // adjust if the native symbol differs
  //   rpcUrl: 'https://rpc.megaeth.io', // placeholder, replace with real RPC
  //   rpcName: 'MegaETH RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/megaeth-labs/mega-tokenlist/main/megaeth.tokenlist.json',
  //   blockExplorerUrl: 'https://explorer.megaeth.io', // optional
  // },
];

/**
 * Get network config by network ID
 *
 * @param networkId - The unique identifier for the network
 * @returns The network configuration or undefined if not found
 */
export function getNetworkConfig(networkId: string): NetworkConfig | undefined {
  return NETWORK_CONFIGS.find((config) => config.networkId === networkId);
}

/**
 * Get all network IDs
 *
 * @returns Array of all network IDs
 */
export function getAllNetworkIds(): string[] {
  return NETWORK_CONFIGS.map((config) => config.networkId);
}
