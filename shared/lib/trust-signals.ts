import { CHAIN_IDS } from '../constants/network';

// Security Alerts API supported chains sorted alphabetically
export enum SupportedEVMChain {
  Abstract = 'abstract',
  AbstractTestnet = 'abstract-testnet',
  ApeChain = 'apechain',
  Arbitrum = 'arbitrum',
  Avalanche = 'avalanche',
  AvalancheFuji = 'avalanche-fuji',
  Base = 'base',
  BaseSepolia = 'base-sepolia',
  Berachain = 'berachain',
  BerachainBartio = 'berachain-bartio',
  Blast = 'blast',
  Bsc = 'bsc',
  Degen = 'degen',
  Ethereum = 'ethereum',
  EthereumSepolia = 'ethereum-sepolia',
  FlowEvm = 'flow-evm',
  Gnosis = 'gnosis',
  ImmutableZkevm = 'immutable-zkevm',
  ImmutableZkevmTestnet = 'immutable-zkevm-testnet',
  Ink = 'ink',
  InkSepolia = 'ink-sepolia',
  Linea = 'linea',
  Optimism = 'optimism',
  Polygon = 'polygon',
  Ronin = 'ronin',
  Scroll = 'scroll',
  Sei = 'sei',
  Soneium = 'soneium',
  SoneiumMinato = 'soneium-minato',
  Unichain = 'unichain',
  Worldchain = 'worldchain',
  ZeroNetwork = 'zero-network',
  Zksync = 'zksync',
  ZksyncSepolia = 'zksync-sepolia',
  Zora = 'zora',
}

const CHAIN_IDS_LOWERCASED: Record<string, SupportedEVMChain> = {
  [CHAIN_IDS.ARBITRUM.toLowerCase()]: SupportedEVMChain.Arbitrum,
  [CHAIN_IDS.AVALANCHE.toLowerCase()]: SupportedEVMChain.Avalanche,
  [CHAIN_IDS.BASE.toLowerCase()]: SupportedEVMChain.Base,
  [CHAIN_IDS.BASE_SEPOLIA.toLowerCase()]: SupportedEVMChain.BaseSepolia,
  [CHAIN_IDS.BSC.toLowerCase()]: SupportedEVMChain.Bsc,
  [CHAIN_IDS.MAINNET.toLowerCase()]: SupportedEVMChain.Ethereum,
  [CHAIN_IDS.OPTIMISM.toLowerCase()]: SupportedEVMChain.Optimism,
  [CHAIN_IDS.POLYGON.toLowerCase()]: SupportedEVMChain.Polygon,
  [CHAIN_IDS.ZKSYNC_ERA.toLowerCase()]: SupportedEVMChain.Zksync,
  [CHAIN_IDS.ZK_SYNC_ERA_TESTNET.toLowerCase()]:
    SupportedEVMChain.ZksyncSepolia,
  '0x76adf1': SupportedEVMChain.Zora,
  [CHAIN_IDS.LINEA_MAINNET.toLowerCase()]: SupportedEVMChain.Linea,
  [CHAIN_IDS.BLAST.toLowerCase()]: SupportedEVMChain.Blast,
  [CHAIN_IDS.SCROLL.toLowerCase()]: SupportedEVMChain.Scroll,
  [CHAIN_IDS.SEPOLIA.toLowerCase()]: SupportedEVMChain.EthereumSepolia,
  '0x27bc86aa': SupportedEVMChain.Degen,
  [CHAIN_IDS.AVALANCHE_TESTNET.toLowerCase()]: SupportedEVMChain.AvalancheFuji,
  '0x343b': SupportedEVMChain.ImmutableZkevm,
  '0x34a1': SupportedEVMChain.ImmutableZkevmTestnet,
  [CHAIN_IDS.GNOSIS.toLowerCase()]: SupportedEVMChain.Gnosis,
  '0x1e0': SupportedEVMChain.Worldchain,
  '0x79a': SupportedEVMChain.SoneiumMinato,
  '0x7e4': SupportedEVMChain.Ronin,
  [CHAIN_IDS.APECHAIN_MAINNET.toLowerCase()]: SupportedEVMChain.ApeChain,
  '0x849ea': SupportedEVMChain.ZeroNetwork,
  [CHAIN_IDS.BERACHAIN.toLowerCase()]: SupportedEVMChain.Berachain,
  '0x138c5': SupportedEVMChain.BerachainBartio,
  [CHAIN_IDS.INK.toLowerCase()]: SupportedEVMChain.Ink,
  [CHAIN_IDS.INK_SEPOLIA.toLowerCase()]: SupportedEVMChain.InkSepolia,
  '0xab5': SupportedEVMChain.Abstract,
  '0x2b74': SupportedEVMChain.AbstractTestnet,
  '0x74c': SupportedEVMChain.Soneium,
  [CHAIN_IDS.UNICHAIN.toLowerCase()]: SupportedEVMChain.Unichain,
  [CHAIN_IDS.SEI.toLowerCase()]: SupportedEVMChain.Sei,
  [CHAIN_IDS.FLOW.toLowerCase()]: SupportedEVMChain.FlowEvm,
};

export function mapChainIdToSupportedEVMChain(
  chainId: string,
): SupportedEVMChain | undefined {
  if (typeof chainId !== 'string' || !chainId) {
    return undefined;
  }

  return CHAIN_IDS_LOWERCASED[chainId.toLowerCase()];
}

export function createCacheKey(chain: SupportedEVMChain, address: string) {
  return `${chain.toLowerCase()}:${address.toLowerCase()}`;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const HEX_STRING_REGEX = /^0x[0-9a-fA-F]+$/u;
const DECIMAL_STRING_REGEX = /^[0-9]+$/u;
// The address space (2^160). Values are reduced into it, as the signer does.
const ADDRESS_MODULUS = 2n ** 160n;

// Cap the number of addresses returned for a single signature. A legitimate
// signature references far fewer; exceeding this is treated as unusual and
// surfaced to the user rather than scanned in full.
const MAX_SIGNATURE_ADDRESSES = 50;

// Limit recursion depth when walking nested types.
const MAX_TRAVERSAL_DEPTH = 12;

// Limit total nodes walked so a large or highly-repetitive payload cannot stall
// traversal, independent of how many distinct addresses are found.
const MAX_TRAVERSAL_NODES = 5000;

type Eip712Field = { name: string; type: string };
type Eip712Types = Record<string, Eip712Field[]>;

export type ExtractedSignatureAddresses = {
  // Distinct canonical addresses to scan, capped at MAX_SIGNATURE_ADDRESSES.
  addresses: string[];
  // True when the message references more distinct addresses than the cap, so
  // some were not returned and the caller should surface a caution.
  overflow: boolean;
};

/**
 * Reduce an `address`-typed value to canonical 20-byte hex.
 *
 * The signer accepts more than canonical hex for an `address` field (hex of any
 * length, or a decimal string) and reduces it into the 20-byte address space,
 * so matching only `0x` + 40 hex would miss an address encoded in another form.
 * Values are reduced the same way the signer does and returned in a single
 * canonical form for de-duping.
 *
 * @param value - The raw field value from the message.
 * @returns Canonical lower-case address, or undefined if not address-like.
 */
function normalizeAddress(value: unknown): string | undefined {
  let numeric: bigint;

  try {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (
        !HEX_STRING_REGEX.test(trimmed) &&
        !DECIMAL_STRING_REGEX.test(trimmed)
      ) {
        return undefined;
      }
      numeric = BigInt(trimmed);
    } else if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 0
    ) {
      numeric = BigInt(value);
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }

  // Reduce into the 20-byte address space, matching how the signer encodes an
  // `address` field, so non-canonical encodings resolve to the signed address.
  numeric %= ADDRESS_MODULUS;

  return `0x${numeric.toString(16).padStart(40, '0')}`;
}

/**
 * Collect every `address`-typed value in an EIP-712 message.
 *
 * Walks the `types` schema from `primaryType` and returns the value of each
 * field declared as `address` or `address[]`, recursing into nested structs and
 * arrays. Matching on the declared type rather than the field name means custom
 * and unknown message shapes are covered without per-protocol handling.
 *
 * `domain` is not traversed; `verifyingContract` is already scanned by the
 * trust-signals middleware.
 *
 * @param typedData - Parsed EIP-712 payload (`types`, `primaryType`, `message`).
 * @param options - Optional configuration.
 * @param options.exclude - Addresses to skip (e.g. the signer). The zero
 * address is always excluded.
 * @param options.excludeFields - Top-level field names to skip, used to avoid a
 * duplicate alert for a field already handled elsewhere (e.g. permit
 * `spender`). Only applied to the primary type, not nested structs.
 * @returns De-duplicated canonical addresses and whether the cap was exceeded.
 */
export function extractSignatureAddresses(
  typedData:
    | { types?: unknown; primaryType?: unknown; message?: unknown }
    | null
    | undefined,
  options: { exclude?: string[]; excludeFields?: string[] } = {},
): ExtractedSignatureAddresses {
  const types = typedData?.types as Eip712Types | undefined;
  const primaryType = typedData?.primaryType as string | undefined;
  const message = typedData?.message;

  if (
    !types ||
    typeof types !== 'object' ||
    !primaryType ||
    !Array.isArray(types[primaryType]) ||
    !message ||
    typeof message !== 'object'
  ) {
    return { addresses: [], overflow: false };
  }

  const excluded = new Set<string>();
  const zero = normalizeAddress(ZERO_ADDRESS);
  if (zero) {
    excluded.add(zero);
  }
  for (const address of options.exclude ?? []) {
    const normalized = normalizeAddress(address);
    if (normalized) {
      excluded.add(normalized);
    }
  }

  const excludedFields = new Set(
    (options.excludeFields ?? []).map((field) => field.toLowerCase()),
  );

  // Canonical addresses, in insertion order.
  const found = new Set<string>();

  // Set once a distinct address beyond the cap is seen.
  let overflow = false;

  // Total nodes walked, bounded by MAX_TRAVERSAL_NODES.
  let visited = 0;

  // Traversal continues past the address cap so overflow can be detected; only
  // depth and total work bound it.
  const budgetExhausted = (depth: number): boolean =>
    depth > MAX_TRAVERSAL_DEPTH || visited >= MAX_TRAVERSAL_NODES;

  function collect(value: unknown): void {
    const address = normalizeAddress(value);
    if (!address || excluded.has(address) || found.has(address)) {
      return;
    }
    if (found.size >= MAX_SIGNATURE_ADDRESSES) {
      overflow = true;
      return;
    }
    found.add(address);
  }

  function visitStruct(
    structName: string,
    value: unknown,
    depth: number,
  ): void {
    if (budgetExhausted(depth)) {
      return;
    }
    const fields = types[structName];
    if (!Array.isArray(fields) || !value || typeof value !== 'object') {
      return;
    }
    for (const field of fields) {
      if (budgetExhausted(depth)) {
        return;
      }
      if (
        !field ||
        typeof field.name !== 'string' ||
        typeof field.type !== 'string' ||
        // Field exclusions only apply to the primary type (depth 0), matching
        // the top-level field a dedicated hook already covers.
        (depth === 0 && excludedFields.has(field.name.toLowerCase()))
      ) {
        continue;
      }
      visitField(
        field.type,
        (value as Record<string, unknown>)[field.name],
        depth,
      );
    }
  }

  function visitField(type: string, value: unknown, depth: number): void {
    visited += 1;
    if (budgetExhausted(depth)) {
      return;
    }

    // Handle one array dimension at a time, e.g. `address[]` or `Type[][]`.
    const arrayMatch = type.match(/^(.*)\[\d*\]$/u);
    if (arrayMatch) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (budgetExhausted(depth)) {
            return;
          }
          visitField(arrayMatch[1], item, depth + 1);
        }
      }
      return;
    }

    if (type === 'address') {
      collect(value);
      return;
    }

    // Recurse into custom struct types; other primitives carry no address.
    if (Array.isArray(types[type])) {
      visitStruct(type, value, depth + 1);
    }
  }

  visitStruct(primaryType, message, 0);

  return { addresses: Array.from(found.values()), overflow };
}

export enum ResultType {
  Malicious = 'Malicious',
  Warning = 'Warning',
  Benign = 'Benign',
  Trusted = 'Trusted',
  ErrorResult = 'Error',
  Loading = 'Loading',
}

export type ScanAddressRequest = {
  chain: SupportedEVMChain;
  address: string;
};

export type ScanAddressResponse = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: ResultType;
  label: string;
};

export type CachedScanAddressResponse = ScanAddressResponse & {
  timestamp: number;
};

export type GetAddressSecurityAlertResponse = (
  cacheKey: string,
) => ScanAddressResponse | undefined;

export type AddAddressSecurityAlertResponse = (
  cacheKey: string,
  response: ScanAddressResponse,
) => void;
