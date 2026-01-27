import { Mockttp } from 'mockttp';

export function getCommonMocks(server: Mockttp) {
  return [
    server.forGet('https://chainid.network/chains.json').thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            name: 'Ethereum Mainnet',
            chain: 'ETH',
            chainId: 1,
            networkId: 1,
            slip44: 60,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpc: ['https://mainnet.infura.io/v3/'],
            faucets: [],
            infoURL: 'https://ethereum.org',
            shortName: 'eth',
            explorers: [
              {
                name: 'etherscan',
                url: 'https://etherscan.io',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'Polygon Mainnet',
            chain: 'Polygon',
            chainId: 137,
            networkId: 137,
            slip44: 966,
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpc: ['https://polygon-rpc.com'],
            faucets: [],
            infoURL: 'https://polygon.technology/',
            shortName: 'matic',
            explorers: [
              {
                name: 'polygonscan',
                url: 'https://polygonscan.com',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'BNB Smart Chain Mainnet',
            chain: 'BSC',
            chainId: 56,
            networkId: 56,
            slip44: 714,
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpc: ['https://bsc-dataseed.binance.org'],
            faucets: [],
            infoURL: 'https://www.bnbchain.org',
            shortName: 'bnb',
            explorers: [
              {
                name: 'bscscan',
                url: 'https://bscscan.com',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'Linea Mainnet',
            chain: 'Linea',
            chainId: 59144,
            networkId: 59144,
            slip44: 60,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpc: ['https://linea-mainnet.infura.io/v3/'],
            faucets: [],
            infoURL: 'https://linea.build',
            shortName: 'linea',
            explorers: [
              {
                name: 'lineascan',
                url: 'https://lineascan.build',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'Base',
            chain: 'Base',
            chainId: 8453,
            networkId: 8453,
            slip44: 60,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpc: ['https://mainnet.base.org'],
            faucets: [],
            infoURL: 'https://base.org',
            shortName: 'base',
            explorers: [
              {
                name: 'basescan',
                url: 'https://basescan.org',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'Arbitrum One',
            chain: 'Arbitrum',
            chainId: 42161,
            networkId: 42161,
            slip44: 60,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpc: ['https://arb1.arbitrum.io/rpc'],
            faucets: [],
            infoURL: 'https://arbitrum.io',
            shortName: 'arb1',
            explorers: [
              {
                name: 'arbiscan',
                url: 'https://arbiscan.io',
                standard: 'EIP3091',
              },
            ],
          },
          {
            name: 'OP Mainnet',
            chain: 'Optimism',
            chainId: 10,
            networkId: 10,
            slip44: 60,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpc: ['https://mainnet.optimism.io'],
            faucets: [],
            infoURL: 'https://optimism.io',
            shortName: 'oeth',
            explorers: [
              {
                name: 'optimistic etherscan',
                url: 'https://optimistic.etherscan.io',
                standard: 'EIP3091',
              },
            ],
          },
        ],
      };
    }),
    server.forPost(/^https:\/\/sentry\.io\/api/u).thenCallback(() => {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        // Typical Sentry envelope endpoint response with event IDs
        json: {
          success: true,
        },
      };
    }),
    server.forPost(/^https:\/\/api\.segment\.io\/v1\//u).thenCallback(() => {
      return { statusCode: 200 };
    }),
    server
      .forGet(
        /^https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions/u,
      )
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            subscriptions: [],
            trialedProducts: [],
          },
        };
      }),
    server
      .forGet(
        /^https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions\/eligibility/u,
      )
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              canSubscribe: true,
              canViewEntryModal: true,
              minBalanceUSD: 1000,
              product: 'shield',
            },
          ],
        };
      }),
  ];
}
