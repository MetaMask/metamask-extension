export const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const SOLANA_NATIVE_ASSET_ID = `${SOLANA_CHAIN_ID}/slip44:501`;
export const SOLANA_TOKEN_PROGRAM_ID =
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const SOLANA_TOKEN_2022_PROGRAM_ID =
  'TokenzQdBNbLqP5VEhdkAS6EPFh3WU7QbKqjYNuHh2';

export type SolanaAssetType = 'native' | 'nft' | 'spl-token' | 'spl-token-2022';

export type SolanaNativeFixtureAsset = {
  balance: number;
  decimals: 9;
  name: string;
  priceUsd?: number | null;
  symbol: 'SOL';
  type: 'native';
};

export type SolanaTokenFixtureAsset = {
  balance: string;
  decimals: number;
  mintAddress?: string;
  name: string;
  priceUsd?: number | null;
  symbol: string;
  type: 'spl-token' | 'spl-token-2022';
};

export type SolanaNftFixtureAsset = {
  balance?: '1' | string;
  decimals?: 0;
  mintAddress?: string;
  name: string;
  priceUsd?: number | null;
  symbol: string;
  type: 'nft';
  uri?: string;
};

export type SolanaFixtureAsset =
  | SolanaNativeFixtureAsset
  | SolanaTokenFixtureAsset
  | SolanaNftFixtureAsset;

export type SolanaSeedAsset = Exclude<
  SolanaFixtureAsset,
  SolanaNativeFixtureAsset
>;

export type SolanaTokenMint = {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  tokenProgramId: string;
  type: Exclude<SolanaAssetType, 'native'>;
  uri?: string;
};

export type SolanaTokenAccount = {
  address: string;
  mintAddress: string;
  ownerAddress: string;
  symbol: string;
};

export type SolanaSeederAccount = {
  address: string;
  assets?: SolanaFixtureAsset[];
};

export function getSolanaAssetId(
  asset: SolanaFixtureAsset,
  mintAddress?: string,
): string {
  if (asset.type === 'native') {
    return SOLANA_NATIVE_ASSET_ID;
  }

  return `${SOLANA_CHAIN_ID}/token:${mintAddress ?? asset.mintAddress ?? asset.symbol}`;
}
