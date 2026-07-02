/* eslint-disable @typescript-eslint/naming-convention */
import { base58 } from '@scure/base';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { sha256 } from 'ethereum-cryptography/sha256';
import { type JavaTronPrivateNetworkPorts } from './java-tron-config';

export type TronTrc10Symbol = 'GAS_FREE';
export type TronTrc20Symbol = 'HTX' | 'SEED' | 'USDD' | 'USDT';
export type TronAssetSymbol = TronTrc10Symbol | TronTrc20Symbol;

export type TronAssetMetadata = {
  decimals: number;
  name: string;
  symbol: TronAssetSymbol;
  /**
   * Short on-chain abbreviation used only for TRC-10 issuance
   * (`/wallet/createassetissue`'s `abbr` field, capped at 5 chars). Kept
   * separate from `symbol`, which is the identifying key used elsewhere and
   * can be longer than 5 chars (e.g. `GAS_FREE`).
   */
  abbr?: string;
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
};

export type TronNativeAccount = {
  address?: string;
  balance?: number;
  [key: string]: unknown;
};

export const TRON_TEST_ASSETS = {
  GAS_FREE: {
    abbr: 'GASF',
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
