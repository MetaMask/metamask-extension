import type { V6BalancesResponse } from '@metamask/core-backend';
import {
  filterDefiBalancesByProtocol,
  groupDefiProtocolDetails,
  groupDefiProtocolDetailsSections,
} from './group-defi-protocol-details';

const createDefiBalance = ({
  assetId,
  symbol,
  name,
  balance,
  decimals,
  price,
  protocolId,
  protocolName,
  protocolIconUrl,
  positionType,
  poolAddress,
}: {
  assetId: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price: string;
  protocolId: string;
  protocolName: string;
  protocolIconUrl: string;
  positionType: string;
  poolAddress: string;
}) => ({
  category: 'defi' as const,
  assetId,
  name,
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
    positionType,
    poolAddress,
  },
});

describe('group-defi-protocol-details', () => {
  const response: V6BalancesResponse = {
    unprocessedNetworks: [],
    unprocessedIncludeAssetIds: [],
    accounts: [
      {
        accountId: 'eip155:0:0xabc',
        balances: [
          createDefiBalance({
            assetId: 'eip155:1/erc20:0xusdc',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '1',
            decimals: 6,
            price: '1',
            protocolId: 'curve',
            protocolName: 'Curve.fi USDC Pool',
            protocolIconUrl: 'curve.png',
            positionType: 'supply',
            poolAddress: '0xpool-a',
          }),
          createDefiBalance({
            assetId: 'eip155:1/erc20:0xdai',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            balance: '2',
            decimals: 18,
            price: '1',
            protocolId: 'curve',
            protocolName: 'Curve.fi USDC Pool',
            protocolIconUrl: 'curve.png',
            positionType: 'supply',
            poolAddress: '0xpool-a',
          }),
          createDefiBalance({
            assetId: 'eip155:1/erc20:0xweth',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            balance: '1',
            decimals: 18,
            price: '2000',
            protocolId: 'curve',
            protocolName: 'Curve.fi ETH Pool',
            protocolIconUrl: 'curve.png',
            positionType: 'stake',
            poolAddress: '0xpool-b',
          }),
          createDefiBalance({
            assetId: 'eip155:137/erc20:0xusdc',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '5',
            decimals: 6,
            price: '1',
            protocolId: 'curve',
            protocolName: 'Curve.fi USDC Pool',
            protocolIconUrl: 'curve.png',
            positionType: 'supply',
            poolAddress: '0xpool-c',
          }),
        ],
      },
    ],
  };

  describe('filterDefiBalancesByProtocol', () => {
    it('returns only balances for the requested chain and protocol', () => {
      const filtered = filterDefiBalancesByProtocol(
        response,
        'eip155:1',
        'curve',
      );

      expect(filtered).toHaveLength(3);
      expect(filtered.every((balance) => balance.metadata.protocolId === 'curve')).toBe(
        true,
      );
    });
  });

  describe('groupDefiProtocolDetailsSections', () => {
    it('groups balances by protocol name and pool address', () => {
      const filtered = filterDefiBalancesByProtocol(
        response,
        'eip155:1',
        'curve',
      );
      const sections = groupDefiProtocolDetailsSections(filtered);

      expect(sections).toHaveLength(2);

      const usdcPool = sections.find(
        (section) => section.protocolName === 'Curve.fi USDC Pool',
      );
      expect(usdcPool?.poolGroups).toHaveLength(1);
      expect(usdcPool?.poolGroups[0].positions).toHaveLength(2);

      const ethPool = sections.find(
        (section) => section.protocolName === 'Curve.fi ETH Pool',
      );
      expect(ethPool?.poolGroups).toHaveLength(1);
      expect(ethPool?.poolGroups[0].positions).toHaveLength(1);
    });
  });

  describe('groupDefiProtocolDetails', () => {
    it('builds the protocol details view model', () => {
      const details = groupDefiProtocolDetails(response, 'eip155:1', 'curve');

      expect(details).toMatchObject({
        protocolId: 'curve',
        chainId: 'eip155:1',
        protocolIconUrl: 'curve.png',
        aggregatedMarketValue: 2003,
      });
      expect(details?.sections).toHaveLength(2);
    });

    it('returns undefined when no balances match', () => {
      expect(
        groupDefiProtocolDetails(response, 'eip155:1', 'unknown-protocol'),
      ).toBeUndefined();
    });
  });
});
