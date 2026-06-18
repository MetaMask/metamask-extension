import type {
  SolanaFixtureAsset,
  SolanaSeedAsset,
  SolanaSeederAccount,
  SolanaTokenAccount,
  SolanaTokenMint,
} from './assets';

type SolanaSeederNode = {
  createTokenMint: (asset: SolanaSeedAsset) => Promise<SolanaTokenMint>;
  mintTokenToAddress: (
    mint: SolanaTokenMint,
    ownerAddress: string,
    amount: string,
  ) => Promise<SolanaTokenAccount>;
  tokenMints: Partial<Record<string, SolanaTokenMint>>;
};

export class SolanaAssetRegistry {
  readonly #mints: SolanaTokenMint[] = [];

  getAllMintAddresses(): string[] {
    return this.#mints.map((mint) => mint.address);
  }

  getMint(symbol: string): SolanaTokenMint | undefined {
    return this.#mints.filter((mint) => mint.symbol === symbol).at(-1);
  }

  getMintAddress(symbol: string): string | undefined {
    return this.getMint(symbol)?.address;
  }

  storeMint(mint: SolanaTokenMint): void {
    this.#mints.push(mint);
  }
}

export class SolanaSeeder {
  readonly #assetRegistry = new SolanaAssetRegistry();

  readonly #node: SolanaSeederNode;

  constructor(node: SolanaSeederNode) {
    this.#node = node;
  }

  getAssetRegistry(): SolanaAssetRegistry {
    return this.#assetRegistry;
  }

  async seedAccountAssets(accounts: SolanaSeederAccount[]): Promise<void> {
    for (const asset of getUniqueSeedAssets(accounts)) {
      const existingMint = this.#node.tokenMints[asset.symbol];
      const mint = existingMint ?? (await this.#node.createTokenMint(asset));
      this.#assetRegistry.storeMint(mint);

      for (const account of accounts) {
        const matchingAsset = account.assets?.find(
          (accountAsset): accountAsset is SolanaSeedAsset =>
            isSolanaSeedAsset(accountAsset) &&
            accountAsset.symbol === asset.symbol,
        );
        if (matchingAsset) {
          await this.#node.mintTokenToAddress(
            mint,
            account.address,
            getSeedAmount(matchingAsset),
          );
        }
      }
    }
  }
}

function getUniqueSeedAssets(
  accounts: SolanaSeederAccount[],
): SolanaSeedAsset[] {
  const assetsByKey = new Map<string, SolanaSeedAsset>();
  for (const account of accounts) {
    for (const asset of account.assets ?? []) {
      if (isSolanaSeedAsset(asset)) {
        assetsByKey.set(`${asset.type}:${asset.symbol}`, asset);
      }
    }
  }

  return [...assetsByKey.values()];
}

function getSeedAmount(asset: SolanaSeedAsset): string {
  if (asset.type === 'nft') {
    return asset.balance ?? '1';
  }

  return asset.balance;
}

function isSolanaSeedAsset(
  asset: SolanaFixtureAsset,
): asset is SolanaSeedAsset {
  return asset.type !== 'native';
}
