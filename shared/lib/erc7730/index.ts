/**
 * Minimal ERC-7730 clear-signing lookup.
 *
 * The on-chain registry at
 *   https://github.com/LedgerHQ/clear-signing-erc7730-registry
 * publishes JSON descriptors per contract that map each function signature to
 * a human-readable `intent` (e.g. "Swap"). We bundle a small curated subset
 * here as a pre-compiled lookup table keyed by `chainId:address` so callers
 * can resolve `(chainId, to, calldata) -> intent` synchronously with no
 * network access.
 *
 * Selectors are 4-byte keccak256 prefixes of the canonical ABI function
 * signature (lower-cased, with the leading 0x).
 */

type Erc7730ContractEntry = {
  owner: string;
  // Map of 4-byte function selector ("0x" + 8 hex chars, lowercased) to
  // human-readable intent.
  selectors: Record<string, string>;
};

const ETH_MAINNET = 1;
// Local Anvil chain used by the MetaMask e2e harness. Entries below this
// chainId are only meant for visual-testing demos.
const LOCAL_ANVIL = 1337;

// chainId:lowercased-address  ->  entry
const REGISTRY: Record<string, Erc7730ContractEntry> = {
  // Uniswap V3 SwapRouter02
  [`${ETH_MAINNET}:0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45`]: {
    owner: 'Uniswap',
    selectors: {
      '0x414bf389': 'Swap on Uniswap', // exactInputSingle
      '0xc04b8d59': 'Swap on Uniswap', // exactInput
      '0xdb3e2198': 'Swap on Uniswap', // exactOutputSingle
      '0xf28c0498': 'Swap on Uniswap', // exactOutput
      '0x472b43f3': 'Swap on Uniswap', // swapExactTokensForTokens
      '0x42712a67': 'Swap on Uniswap', // swapTokensForExactTokens
      '0x5ae401dc': 'Swap on Uniswap', // multicall(uint256,bytes[])
      '0xac9650d8': 'Swap on Uniswap', // multicall(bytes[])
    },
  },

  // Uniswap Universal Router
  [`${ETH_MAINNET}:0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad`]: {
    owner: 'Uniswap',
    selectors: {
      '0x3593564c': 'Swap on Uniswap', // execute(bytes,bytes[],uint256)
      '0x24856bc3': 'Swap on Uniswap', // execute(bytes,bytes[])
    },
  },

  // WETH9
  [`${ETH_MAINNET}:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`]: {
    owner: 'WETH',
    selectors: {
      '0xd0e30db0': 'Wrap ETH', // deposit()
      '0x2e1a7d4d': 'Unwrap ETH', // withdraw(uint256)
    },
  },

  // Permit2 (same address on every chain via CREATE2)
  [`${ETH_MAINNET}:0x000000000022d473030f116ddee9f6b43ac78ba3`]: {
    owner: 'Uniswap Permit2',
    selectors: {
      '0x87517c45': 'Approve via Permit2', // approve(address,address,uint160,uint48)
      '0x36c78516': 'Transfer via Permit2', // transferFrom(address,address,uint160,address)
      '0x2b67b570': 'Sign Permit2 permission', // permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)
    },
  },

  // Seaport 1.6 (OpenSea)
  [`${ETH_MAINNET}:0x0000000000000068f116a894984e2db1123eb395`]: {
    owner: 'OpenSea',
    selectors: {
      '0xfb0f3ee1': 'Buy NFT on OpenSea', // fulfillBasicOrder
      '0x00000000': 'Buy NFT on OpenSea', // fulfillBasicOrder_efficient_6GL6yc
      '0xb3a34c4c': 'Buy NFT on OpenSea', // fulfillOrder
      '0xe7acab24': 'Buy NFT on OpenSea', // fulfillAdvancedOrder
      '0x87201b41': 'Buy NFTs on OpenSea', // fulfillAvailableAdvancedOrders
      '0xed98a574': 'Buy NFTs on OpenSea', // fulfillAvailableOrders
    },
  },

  // Seaport 1.5 (OpenSea, legacy)
  [`${ETH_MAINNET}:0x00000000000000adc04c56bf30ac9d3c0aaf14dc`]: {
    owner: 'OpenSea',
    selectors: {
      '0xfb0f3ee1': 'Buy NFT on OpenSea', // fulfillBasicOrder
      '0x00000000': 'Buy NFT on OpenSea', // fulfillBasicOrder_efficient_6GL6yc
      '0xb3a34c4c': 'Buy NFT on OpenSea', // fulfillOrder
      '0xe7acab24': 'Buy NFT on OpenSea', // fulfillAdvancedOrder
    },
  },

  // Aave v3 Pool
  [`${ETH_MAINNET}:0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2`]: {
    owner: 'Aave',
    selectors: {
      '0x617ba037': 'Deposit to Aave', // supply(address,uint256,address,uint16)
      '0x69328dec': 'Withdraw from Aave', // withdraw(address,uint256,address)
      '0xa415bcad': 'Borrow from Aave', // borrow(address,uint256,uint256,uint16,address)
      '0x573ade81': 'Repay Aave loan', // repay(address,uint256,uint256,address)
    },
  },

  // Lido (stETH)
  [`${ETH_MAINNET}:0xae7ab96520de3a18e5e111b5eaab095312d7fe84`]: {
    owner: 'Lido',
    selectors: {
      '0xa1903eab': 'Stake ETH with Lido', // submit(address)
    },
  },

  // Local-only demo entry: PiggyBank test contract seeded by the mm CLI on
  // the Anvil chain at deterministic address.
  [`${LOCAL_ANVIL}:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947`]: {
    owner: 'Piggy Bank',
    selectors: {
      '0xd0e30db0': 'Deposit to Piggy Bank', // deposit()
      '0x2e1a7d4d': 'Withdraw from Piggy Bank', // withdraw(uint256)
    },
  },
};

const SELECTOR_LENGTH = 10; // '0x' + 8 hex chars

const isHexAddress = (value: unknown): value is string =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);

/**
 * Look up the ERC-7730 intent for a contract call.
 *
 * Returns `undefined` if the contract isn't in the bundled registry, the
 * 4-byte selector isn't recognized, or the inputs are malformed.
 */
export function getErc7730Intent(
  chainId: string | number | undefined,
  to: string | undefined,
  data: string | undefined,
): string | undefined {
  if (!chainId || !isHexAddress(to) || typeof data !== 'string') {
    return undefined;
  }

  if (data.length < SELECTOR_LENGTH) {
    return undefined;
  }

  const numericChainId =
    typeof chainId === 'number'
      ? chainId
      : parseInt(chainId.startsWith('0x') ? chainId : `0x${chainId}`, 16);

  if (!Number.isFinite(numericChainId)) {
    return undefined;
  }

  const entry = REGISTRY[`${numericChainId}:${to.toLowerCase()}`];
  if (!entry) {
    return undefined;
  }

  return entry.selectors[data.slice(0, SELECTOR_LENGTH).toLowerCase()];
}

/**
 * Exposed for tests / debugging.
 */
export function getErc7730Owner(
  chainId: string | number | undefined,
  to: string | undefined,
): string | undefined {
  if (!chainId || !isHexAddress(to)) {
    return undefined;
  }
  const numericChainId =
    typeof chainId === 'number'
      ? chainId
      : parseInt(chainId.startsWith('0x') ? chainId : `0x${chainId}`, 16);
  if (!Number.isFinite(numericChainId)) {
    return undefined;
  }
  return REGISTRY[`${numericChainId}:${to.toLowerCase()}`]?.owner;
}
