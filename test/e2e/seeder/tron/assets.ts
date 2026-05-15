/* eslint-disable @typescript-eslint/naming-convention */
import { base58 } from '@scure/base';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { sha256 } from 'ethereum-cryptography/sha256';
import { type JavaTronPrivateNetworkPorts } from './java-tron-config';

export const TRON_CHAIN_ID = 'tron:728126428';
export const SUN_PER_TRX = 1_000_000;

export type TronTrc10Symbol = 'GAS_FREE';
export type TronTrc20Symbol = 'HTX' | 'SEED' | 'USDD' | 'USDT';
export type TronAssetSymbol = TronTrc10Symbol | TronTrc20Symbol;

export type TronAssetMetadata = {
  decimals: number;
  name: string;
  symbol: TronAssetSymbol;
};

export type TronTrc10Token = TronAssetMetadata & {
  symbol: TronTrc10Symbol;
  tokenId: string;
};

export type TronTrc20Token = TronAssetMetadata & {
  address: string;
  hexAddress: string;
  symbol: TronTrc20Symbol;
};

export type TronLocalNodeOptions = {
  initialBalances?: Record<string, number>;
  ports?: Partial<JavaTronPrivateNetworkPorts>;
  trc10Balances?: Record<string, Partial<Record<TronTrc10Symbol, string>>>;
  trc20Balances?: Record<string, Partial<Record<TronTrc20Symbol, string>>>;
  /**
   * Staked TRX (frozen for energy) per address, in SUN. Surfaces as the
   * single-entry `frozenV2` array on the TronGrid account response that the
   * wallet snap reads. Read-only state — no stake/unstake UX is available
   * in MetaMask, so we don't need a mutable stake API.
   */
  stakedTrxBalances?: Record<string, string>;
  /**
   * Placeholder for a future TRC721 implementation. The seeder accepts and
   * ignores this field today so test code can be authored against the final
   * shape before the runtime work lands.
   */
  trc721Balances?: Record<string, Record<string, string[]>>;
  /**
   * Placeholder for a future TRC1155 implementation. Same accept-and-ignore
   * contract as `trc721Balances`.
   */
  trc1155Balances?: Record<string, Record<string, Record<string, string>>>;
};

export type TronNativeAccount = {
  address?: string;
  balance?: number;
  [key: string]: unknown;
};

export const TRON_TEST_ASSETS = {
  GAS_FREE: {
    decimals: 6,
    name: 'GasFreeTransferSolution',
    symbol: 'GAS_FREE',
  },
  HTX: {
    decimals: 18,
    name: 'HTX DAO',
    symbol: 'HTX',
  },
  SEED: {
    decimals: 6,
    name: 'SEED',
    symbol: 'SEED',
  },
  USDD: {
    decimals: 18,
    name: 'USDD',
    symbol: 'USDD',
  },
  USDT: {
    decimals: 6,
    name: 'Tether',
    symbol: 'USDT',
  },
} as const satisfies Record<TronAssetSymbol, TronAssetMetadata>;

export function getTronAssetMetadata<TSymbol extends TronAssetSymbol>(
  symbol: TSymbol,
): (typeof TRON_TEST_ASSETS)[TSymbol] {
  return TRON_TEST_ASSETS[symbol];
}

export function base58AddressToHex(address: string): string {
  const decoded = base58.decode(address);
  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const expectedChecksum = sha256(sha256(payload)).slice(0, 4);

  if (!Buffer.from(checksum).equals(Buffer.from(expectedChecksum))) {
    throw new Error(`Invalid Tron address checksum for ${address}`);
  }

  return Buffer.from(payload).toString('hex');
}

export function hexAddressToBase58(hexAddress: string): string {
  const payload = Buffer.from(hexAddress.replace(/^0x/u, ''), 'hex');
  const checksum = Buffer.from(sha256(sha256(payload)).slice(0, 4));

  return base58.encode(Buffer.concat([payload, checksum]));
}

export function normalizeTronHexAddress(address: string): string {
  if (/^(0x)?41[0-9a-f]{40}$/iu.test(address)) {
    return address.replace(/^0x/u, '').toLowerCase();
  }
  return base58AddressToHex(address);
}

export function getContractAddressFromTx(
  ownerAddress: string,
  txId: string,
): string {
  const ownerHexAddress = normalizeTronHexAddress(ownerAddress);
  const digest = keccak256(
    Buffer.from(`${ownerHexAddress}${txId.replace(/^0x/u, '')}`, 'hex'),
  );
  const contractHexAddress = `41${Buffer.from(digest.slice(-20)).toString(
    'hex',
  )}`;

  return hexAddressToBase58(contractHexAddress);
}

export function encodeTrc20TransferParameter(
  recipientAddress: string,
  amount: string | number | bigint,
): string {
  const recipientPayload = normalizeTronHexAddress(recipientAddress).slice(2);
  const encodedRecipient = recipientPayload.padStart(64, '0');
  const encodedAmount = BigInt(amount).toString(16).padStart(64, '0');

  return `${encodedRecipient}${encodedAmount}`;
}

export function buildPermissiveTrc20Bytecode(decimals: number): string {
  const runtime = [
    '60003560e01c80',
    '63a9059cbb14602957',
    '806370a0823114603457',
    '8063313ce56714603f57',
    '60006000f3',
    '5b600160005260206000f3',
    '5b600060005260206000f3',
    `5b60${decimals.toString(16).padStart(2, '0')}60005260206000f3`,
  ].join('');
  const runtimeLength = (runtime.length / 2).toString(16).padStart(2, '0');

  return `60${runtimeLength}600c60003960${runtimeLength}6000f3${runtime}`;
}

export function createTronGridAccountResponse({
  address,
  nativeAccount,
  stakedTrxBalance,
  trc10Balances,
  trc10Tokens,
  trc20Balances,
  trc20Tokens,
}: {
  address: string;
  nativeAccount?: TronNativeAccount;
  stakedTrxBalance?: string;
  trc10Balances?: Partial<Record<TronTrc10Symbol, string>>;
  trc10Tokens?: Partial<Record<TronTrc10Symbol, TronTrc10Token>>;
  trc20Balances?: Partial<Record<TronTrc20Symbol, string>>;
  trc20Tokens?: Partial<Record<TronTrc20Symbol, TronTrc20Token>>;
}) {
  const assetV2 = Object.entries(trc10Balances ?? {}).flatMap(
    ([symbol, balance]) => {
      const token = trc10Tokens?.[symbol as TronTrc10Symbol];
      if (!token || balance === undefined) {
        return [];
      }
      return [{ key: token.tokenId, value: Number(balance) }];
    },
  );
  const trc20 = Object.entries(trc20Balances ?? {}).flatMap(
    ([symbol, balance]) => {
      const token = trc20Tokens?.[symbol as TronTrc20Symbol];
      if (!token || balance === undefined) {
        return [];
      }
      return [{ [token.address]: balance }];
    },
  );
  // Tron API and wallet snap both expect a JS number; SUN values in tests are
  // well below Number.MAX_SAFE_INTEGER (~9B TRX) so truncation is not a concern.
  // Guard handles both unset (undefined/empty) and explicit zero ('0').
  const frozenV2 =
    stakedTrxBalance && BigInt(stakedTrxBalance) > 0n
      ? [{ amount: Number(stakedTrxBalance), type: 'ENERGY' }]
      : [];
  const account = {
    ...(nativeAccount ?? {}),
    address,
    assetV2,
    balance: nativeAccount?.balance ?? 0,
    free_asset_net_usageV2: assetV2.map(({ key }) => ({ key, value: 0 })),
    // Placed after the spread so it overrides any frozenV2 from the native node.
    frozenV2,
    trc20,
  };

  return {
    data: [account],
    success: true,
    meta: {
      at: Date.now(),
      page_size: 1,
    },
  };
}

export function createEmptyTronGridTransactionsResponse() {
  return {
    data: [],
    success: true,
    meta: {
      at: Date.now(),
      page_size: 0,
    },
  };
}
