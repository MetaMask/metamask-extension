import type { V6BalancesResponse } from '@metamask/core-backend';
import {
  filterGroupedDefiProtocolPositions,
  groupDefiProtocolPositions,
  isDefiBalancesProcessing,
} from './group-defi-protocol-positions';

const createDefiBalance = ({
  assetId,
  symbol,
  balance,
  decimals,
  price,
  protocolId,
  protocolName,
  protocolIconUrl,
}: {
  assetId: string;
  symbol: string;
  balance: string;
  decimals: number;
  price: string;
  protocolId: string;
  protocolName: string;
  protocolIconUrl: string;
}) => ({
  category: 'defi' as const,
  assetId,
  name: symbol,
  symbol,
  decimals,
  balance,
  price,
  metadata: {
    protocolId,
    protocolName,
    description: '',
    protocolUrl: '',
    protocolIconUrl,
    positionType: 'stake',
    poolAddress: '0xpool',
  },
});

describe('group-defi-protocol-positions', () => {
  const response: V6BalancesResponse = {
    unprocessedNetworks: [],
    unprocessedIncludeAssetIds: [],
    accounts: [
      {
        accountId: 'eip155:0:0xabc',
        balances: [
          createDefiBalance({
            assetId: 'eip155:1/erc20:0xwsteth',
            symbol: 'wstETH',
            balance: '1000000000000000000',
            decimals: 18,
            price: '2000',
            protocolId: 'lido',
            protocolName: 'Lido',
            protocolIconUrl: 'lido.png',
          }),
          createDefiBalance({
            assetId: 'eip155:1/erc20:0xsteth',
            symbol: 'stETH',
            balance: '500000000000000000',
            decimals: 18,
            price: '2000',
            protocolId: 'lido',
            protocolName: 'Lido',
            protocolIconUrl: 'lido.png',
          }),
          createDefiBalance({
            assetId: 'eip155:137/erc20:0xusdc',
            symbol: 'USDC',
            balance: '1000000',
            decimals: 6,
            price: '1',
            protocolId: 'aave-v3',
            protocolName: 'Aave V3',
            protocolIconUrl: 'aave.png',
          }),
        ],
      },
      {
        accountId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7EqQ',
        balances: [
          createDefiBalance({
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            balance: '2000000',
            decimals: 6,
            price: '1',
            protocolId: 'aave-v3',
            protocolName: 'Aave V3',
            protocolIconUrl: 'aave.png',
          }),
        ],
      },
    ],
  };

  describe('groupDefiProtocolPositions', () => {
    it('groups defi balances by chain and protocol id', () => {
      const grouped = groupDefiProtocolPositions(response);

      expect(grouped).toHaveLength(3);

      const lido = grouped.find(
        (position) =>
          position.protocolId === 'lido' && position.chainId === 'eip155:1',
      );
      expect(lido).toMatchObject({
        chainId: 'eip155:1',
        protocolId: 'lido',
        title: 'lido',
        tokenImage: 'lido.png',
        tokenFiatAmount: 3000,
      });
      expect(lido?.underlyingSymbols).toStrictEqual(['wstETH', 'stETH']);

      const polygonAave = grouped.find(
        (position) =>
          position.protocolId === 'aave-v3' &&
          position.chainId === 'eip155:137',
      );
      expect(polygonAave).toMatchObject({
        chainId: 'eip155:137',
        protocolId: 'aave-v3',
        title: 'aave-v3',
        tokenFiatAmount: 1,
      });

      const solanaAave = grouped.find(
        (position) =>
          position.protocolId === 'aave-v3' &&
          position.chainId === 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      expect(solanaAave).toMatchObject({
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        protocolId: 'aave-v3',
        title: 'aave-v3',
        tokenFiatAmount: 2,
      });
    });

    it('returns an empty array when response is undefined', () => {
      expect(groupDefiProtocolPositions(undefined)).toStrictEqual([]);
    });
  });

  describe('isDefiBalancesProcessing', () => {
    it('returns true when any account is still processing defi positions', () => {
      expect(
        isDefiBalancesProcessing({
          ...response,
          accounts: [
            {
              accountId: 'eip155:0:0xabc',
              balances: [],
              processingDefiPositions: true,
            },
          ],
        }),
      ).toBe(true);
    });

    it('returns false when no account is processing defi positions', () => {
      expect(isDefiBalancesProcessing(response)).toBe(false);
    });
  });

  describe('filterGroupedDefiProtocolPositions', () => {
    it('keeps only positions on enabled chains', () => {
      const grouped = groupDefiProtocolPositions(response);

      const filtered = filterGroupedDefiProtocolPositions(grouped, [
        'eip155:1',
      ]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].protocolId).toBe('lido');
    });
  });
});
