import { mkdir, mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { DEFAULT_FIXTURE_SOLANA_ACCOUNT } from '../constants';
import {
  LAMPORTS_PER_SOL,
  buildSolanaValidatorStateArgs,
} from '../seeder/solana/node';
import type { SolanaSeedAsset, SolanaTokenMint } from '../seeder/solana/assets';
import { SolanaSeeder } from '../seeder/solana/solana-seeder';
import {
  buildSolanaNodeOptions,
  getSolanaFixtureAssets,
} from '../tests/solana/fixtures/with-solana-fixtures';

describe('Solana seeding', () => {
  it('builds Solana node options from native asset balances and raw state paths', () => {
    expect(
      buildSolanaNodeOptions(
        [
          {
            address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
            assets: [
              {
                balance: 12.5,
                decimals: 9,
                name: 'Solana',
                priceUsd: 180.5,
                symbol: 'SOL',
                type: 'native',
              },
            ],
          },
        ],
        { loadState: 'test/e2e/seeder/solana/network-states/with-usdc' },
      ),
    ).toStrictEqual({
      initialBalances: {
        [DEFAULT_FIXTURE_SOLANA_ACCOUNT]: 12.5 * LAMPORTS_PER_SOL,
      },
      loadState: 'test/e2e/seeder/solana/network-states/with-usdc',
    });
  });

  it('keeps legacy Solana native balance fields working', () => {
    expect(
      buildSolanaNodeOptions([
        {
          address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
          balanceSol: 2,
        },
      ]),
    ).toStrictEqual({
      initialBalances: {
        [DEFAULT_FIXTURE_SOLANA_ACCOUNT]: 2 * LAMPORTS_PER_SOL,
      },
    });
  });

  it('creates validator arguments from a Solana raw state manifest', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'solana-state-test-'));
    await mkdir(join(directory, 'accounts'));
    await mkdir(join(directory, 'programs'));
    await writeFile(join(directory, 'accounts', 'mint.json'), '{}');
    await writeFile(join(directory, 'programs', 'program.so'), '');
    await writeFile(
      join(directory, 'manifest.json'),
      JSON.stringify({
        accounts: {
          EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'accounts/mint.json',
        },
        accountDirs: ['accounts'],
        bpfPrograms: [
          {
            address: 'BPFLoader1111111111111111111111111111111111',
            path: 'programs/program.so',
          },
        ],
      }),
    );

    await expect(
      buildSolanaValidatorStateArgs(directory),
    ).resolves.toStrictEqual([
      '--account',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      join(directory, 'accounts', 'mint.json'),
      '--account-dir',
      join(directory, 'accounts'),
      '--bpf-program',
      'BPFLoader1111111111111111111111111111111111',
      join(directory, 'programs', 'program.so'),
    ]);
  });

  it('seeds SPL-style assets through Solana mints and token accounts', async () => {
    const node = createMockSolanaNode();
    const seeder = new SolanaSeeder(node);

    await seeder.seedAccountAssets([
      {
        address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
        assets: [
          {
            balance: '8908267',
            decimals: 6,
            name: 'USD Coin',
            priceUsd: 1,
            symbol: 'USDC',
            type: 'spl-token',
          },
          {
            balance: '1',
            decimals: 0,
            name: 'Test NFT',
            symbol: 'TNFT',
            type: 'nft',
            uri: 'https://example.test/metadata.json',
          },
        ],
      },
    ]);

    expect(node.createTokenMint).toHaveBeenCalledWith(
      expect.objectContaining({
        decimals: 6,
        symbol: 'USDC',
        type: 'spl-token',
      }),
    );
    expect(node.createTokenMint).toHaveBeenCalledWith(
      expect.objectContaining({
        decimals: 0,
        symbol: 'TNFT',
        type: 'nft',
      }),
    );
    const usdcMint = node.tokenMints.USDC;
    if (!usdcMint) {
      throw new Error('USDC mint was not created');
    }

    expect(node.mintTokenToAddress).toHaveBeenCalledWith(
      usdcMint,
      DEFAULT_FIXTURE_SOLANA_ACCOUNT,
      '8908267',
    );
    expect(seeder.getAssetRegistry().getMintAddress('USDC')).toBe(
      usdcMint.address,
    );
  });

  it('collects fixture assets for token metadata and price mocks', () => {
    expect(
      getSolanaFixtureAssets([
        {
          address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
          assets: [
            {
              balance: 1,
              decimals: 9,
              name: 'Solana',
              priceUsd: 180.5,
              symbol: 'SOL',
              type: 'native',
            },
            {
              balance: '1000000',
              decimals: 6,
              name: 'USD Coin',
              priceUsd: 1,
              symbol: 'USDC',
              type: 'spl-token',
            },
          ],
        },
      ]).map((asset) => asset.symbol),
    ).toStrictEqual(['SOL', 'USDC']);
  });
});

function createMockSolanaNode() {
  const mints: Record<'TNFT' | 'USDC', SolanaTokenMint> = {
    TNFT: {
      address: '7bYxDqvLQ4P8p6Vq3J6t1wczVwLk9h4Q9M5rjqvN1sVg',
      decimals: 0,
      name: 'Test NFT',
      symbol: 'TNFT',
      tokenProgramId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      type: 'nft',
    },
    USDC: {
      address: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      tokenProgramId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      type: 'spl-token',
    },
  };
  const tokenMints: Partial<Record<string, SolanaTokenMint>> = {};

  return {
    createTokenMint: jest.fn(async (asset: SolanaSeedAsset) => {
      const mint = mints[asset.symbol as 'TNFT' | 'USDC'];
      tokenMints[asset.symbol] = mint;
      return mint;
    }),
    mintTokenToAddress: jest.fn(),
    tokenMints,
  };
}
