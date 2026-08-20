import type { CaipChainId } from '@metamask/utils';
import {
  type ChainRankingEntry,
  getChainValueOrder,
  parsePositionOverrides,
} from './chain-value-order';

const ETHEREUM = 'eip155:1';
const OPTIMISM = 'eip155:10';
const BASE = 'eip155:8453';
const SOLANA = 'solana:mainnet';
const UNKNOWN_CHAIN: CaipChainId = 'eip155:999999';

const chainRanking: ChainRankingEntry[] = [
  { chainId: ETHEREUM, name: 'Ethereum' },
  { chainId: OPTIMISM, name: 'Optimism' },
  { chainId: BASE, name: 'Base' },
  { chainId: SOLANA, name: 'Solana' },
];

describe('parsePositionOverrides', () => {
  it('returns valid entries in array order and keeps the first duplicate', () => {
    expect(
      parsePositionOverrides({
        positionOverrides: [
          { chainId: BASE, name: 'Base' },
          { chainId: ETHEREUM, name: 'Ethereum' },
          { chainId: BASE, name: 'Duplicate Base' },
        ],
      }),
    ).toStrictEqual([
      { chainId: BASE, name: 'Base' },
      { chainId: ETHEREUM, name: 'Ethereum' },
    ]);
  });

  // @ts-expect-error - each is a valid test function
  it.each([
    undefined,
    null,
    {},
    { positionOverrides: 'invalid' },
    { positionOverrides: [] },
  ])(
    'returns the same empty list for an empty or malformed value',
    (value: unknown) => {
      const firstResult = parsePositionOverrides(value);
      const secondResult = parsePositionOverrides(value);

      expect(firstResult).toStrictEqual([]);
      expect(firstResult).toBe(secondResult);
    },
  );

  it('skips malformed entries individually', () => {
    expect(
      parsePositionOverrides({
        positionOverrides: [
          null,
          { chainId: 'invalid', name: 'Invalid chain' },
          { chainId: 'eip155:999999', name: 'Unknown chain' },
          { chainId: BASE, name: '' },
          { chainId: OPTIMISM, name: '  ' },
          { chainId: ETHEREUM, name: 'Ethereum' },
        ],
      }),
    ).toStrictEqual([{ chainId: ETHEREUM, name: 'Ethereum' }]);
  });
});

describe('getChainValueOrder', () => {
  it('orders chains by descending holdings value', () => {
    expect(
      getChainValueOrder(
        chainRanking,
        {
          [ETHEREUM]: 25,
          [OPTIMISM]: 100,
          [BASE]: 50,
        },
        [],
      ).map(({ chainId }) => chainId),
    ).toStrictEqual([OPTIMISM, BASE, ETHEREUM, SOLANA]);
  });

  it('preserves LaunchDarkly order for ties and zero balances', () => {
    expect(
      getChainValueOrder(
        chainRanking,
        {
          [ETHEREUM]: 10,
          [OPTIMISM]: 10,
        },
        [],
      ).map(({ chainId }) => chainId),
    ).toStrictEqual([ETHEREUM, OPTIMISM, BASE, SOLANA]);
  });

  it('treats non-finite and non-positive holdings as zero', () => {
    expect(
      getChainValueOrder(
        chainRanking,
        {
          [ETHEREUM]: Number.NaN,
          [OPTIMISM]: Number.POSITIVE_INFINITY,
          [BASE]: -1,
          [SOLANA]: 1,
        },
        [],
      ).map(({ chainId }) => chainId),
    ).toStrictEqual([SOLANA, ETHEREUM, OPTIMISM, BASE]);
  });

  it('promotes known chains in override order and skips unknown chains', () => {
    expect(
      getChainValueOrder(
        chainRanking,
        {
          [ETHEREUM]: 100,
          [OPTIMISM]: 75,
          [BASE]: 50,
        },
        [
          { chainId: BASE, name: 'Base' },
          { chainId: UNKNOWN_CHAIN, name: 'Unknown' },
          { chainId: OPTIMISM, name: 'Optimism' },
        ],
      ).map(({ chainId }) => chainId),
    ).toStrictEqual([BASE, OPTIMISM, ETHEREUM, SOLANA]);
  });

  it('does not mutate its inputs or remove chains', () => {
    const ranking = chainRanking.map((chain) => ({ ...chain }));
    const holdings = { [BASE]: 100 };
    const promotions: ChainRankingEntry[] = [
      { chainId: ETHEREUM, name: 'Ethereum' },
    ];
    const originalRanking = ranking.map((chain) => ({ ...chain }));
    const originalHoldings = { ...holdings };
    const originalPromotions = promotions.map((chain) => ({ ...chain }));

    const result = getChainValueOrder(ranking, holdings, promotions);

    expect(ranking).toStrictEqual(originalRanking);
    expect(holdings).toStrictEqual(originalHoldings);
    expect(promotions).toStrictEqual(originalPromotions);
    expect(result).toHaveLength(ranking.length);
    expect(new Set(result.map(({ chainId }) => chainId))).toStrictEqual(
      new Set(ranking.map(({ chainId }) => chainId)),
    );
  });
});
