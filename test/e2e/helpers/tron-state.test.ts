import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  loadTronState,
  mergeTronLocalNodeOptions,
  normalizeTronState,
} from '../seeder/tron/state';
import { buildTronNodeOptions } from '../tests/tron/fixtures/with-tron-fixtures';

describe('Tron raw state seeding', () => {
  const accountAddress = 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3';
  const secondAccountAddress = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';

  it('normalizes fixture-style accounts into Tron node state', () => {
    expect(
      normalizeTronState({
        accounts: [
          {
            address: accountAddress,
            assets: [
              {
                balance: 1_000_000,
                decimals: 6,
                name: 'Tron',
                symbol: 'TRX',
                type: 'native',
              },
              {
                balance: '2500000',
                decimals: 6,
                name: 'Tether',
                symbol: 'USDT',
                type: 'trc20',
              },
            ],
            stakedTrxBalance: '500000',
          },
        ],
        trc20Balances: {
          [secondAccountAddress]: {
            USDD: '3000000000000000000',
          },
        },
      }),
    ).toStrictEqual({
      initialBalances: {
        [accountAddress]: 1_000_000,
      },
      stakedTrxBalances: {
        [accountAddress]: '500000',
      },
      trc20Balances: {
        [accountAddress]: {
          USDT: '2500000',
        },
        [secondAccountAddress]: {
          USDD: '3000000000000000000',
        },
      },
    });
  });

  it('merges loaded raw state with explicit Tron node options', () => {
    expect(
      mergeTronLocalNodeOptions(
        {
          initialBalances: {
            [accountAddress]: 1_000_000,
          },
          trc20Balances: {
            [accountAddress]: {
              USDT: '2500000',
            },
          },
        },
        {
          initialBalances: {
            [secondAccountAddress]: 2_000_000,
          },
          trc20Balances: {
            [accountAddress]: {
              USDD: '3000000000000000000',
            },
          },
        },
      ),
    ).toStrictEqual({
      initialBalances: {
        [accountAddress]: 1_000_000,
        [secondAccountAddress]: 2_000_000,
      },
      trc20Balances: {
        [accountAddress]: {
          USDD: '3000000000000000000',
          USDT: '2500000',
        },
      },
    });
  });

  it('loads Tron node state from a JSON path', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tron-state-test-'));
    const statePath = join(directory, 'state.json');
    await writeFile(
      statePath,
      JSON.stringify({
        accounts: {
          [accountAddress]: {
            assets: [
              {
                balance: 1_000_000,
                decimals: 6,
                name: 'Tron',
                symbol: 'TRX',
                type: 'native',
              },
            ],
          },
        },
      }),
    );

    await expect(loadTronState(statePath)).resolves.toStrictEqual({
      initialBalances: {
        [accountAddress]: 1_000_000,
      },
    });
  });

  it('passes raw state paths through Tron fixture node options', () => {
    expect(
      buildTronNodeOptions([], {
        loadState: 'test/e2e/seeder/tron/network-states/with-usdt.json',
      }),
    ).toStrictEqual({
      loadState: 'test/e2e/seeder/tron/network-states/with-usdt.json',
    });
  });
});
