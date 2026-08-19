import { TronNode } from '../seeder/tron/node';
import { TRON_ACCOUNT_ADDRESS } from '../tests/tron/mocks/common-tron';
import {
  GAS_FREE,
  HTX,
  SEED,
  TRX,
  USDD,
  USDT,
} from '../tests/tron/fixtures/tokens';
import {
  buildTronNodeOptions,
  resolveTronFixtureLocalNodeOptions,
} from '../tests/tron/fixtures/with-tron-fixtures';

describe('withTronFixtures', () => {
  it('builds Tron local node options from explicit account assets', () => {
    expect(
      buildTronNodeOptions([
        {
          address: TRON_ACCOUNT_ADDRESS,
          assets: [
            { ...TRX, balance: 6_072_392, priceUsd: 0.29469 },
            { ...GAS_FREE, balance: '33333333', priceUsd: 0.000_000_001 },
            { ...HTX, balance: '3156454956836360132407885' },
            { ...SEED, balance: '89851311' },
            { ...USDD, balance: '289757448699320931' },
            { ...USDT, balance: '2804595', priceUsd: 0.999176 },
          ],
        },
      ]),
    ).toStrictEqual({
      initialBalances: {
        [TRON_ACCOUNT_ADDRESS]: 6_072_392,
      },
      trc10Balances: {
        [TRON_ACCOUNT_ADDRESS]: {
          GAS_FREE: '33333333',
        },
      },
      trc20Balances: {
        [TRON_ACCOUNT_ADDRESS]: {
          HTX: '3156454956836360132407885',
          SEED: '89851311',
          USDD: '289757448699320931',
          USDT: '2804595',
        },
      },
    });
  });

  describe('resolveTronFixtureLocalNodeOptions', () => {
    const startupNodeOptions = { initialBalances: { [TRON_ACCOUNT_ADDRESS]: 1 } };

    it('starts Anvil and a new Tron process by default', () => {
      expect(
        resolveTronFixtureLocalNodeOptions({ startupNodeOptions }),
      ).toStrictEqual([
        'anvil',
        { type: 'tron', options: startupNodeOptions },
      ]);
    });

    it('starts only a new Tron process when Anvil is disabled', () => {
      expect(
        resolveTronFixtureLocalNodeOptions({
          includeAnvil: false,
          startupNodeOptions,
        }),
      ).toStrictEqual([{ type: 'tron', options: startupNodeOptions }]);
    });

    it('reuses a borrowed Tron node and still starts Anvil', () => {
      expect(
        resolveTronFixtureLocalNodeOptions({
          borrowedTronNode: {} as TronNode,
          startupNodeOptions,
        }),
      ).toStrictEqual(['anvil']);
    });

    it('does not start a local node when a borrowed Tron node is used without Anvil', () => {
      expect(
        resolveTronFixtureLocalNodeOptions({
          borrowedTronNode: {} as TronNode,
          includeAnvil: false,
          startupNodeOptions,
        }),
      ).toStrictEqual(['none']);
    });
  });
});
