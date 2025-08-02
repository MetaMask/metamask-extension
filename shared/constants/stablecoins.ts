/**
 * Comprehensive stablecoin addresses across different chains
 * Used for determining optimal slippage in swaps
 */

import { CHAIN_IDS } from './network';

export const STABLECOIN_ADDRESSES = {
  // Mainnet stablecoins
  [CHAIN_IDS.MAINNET]: {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    FRAX: '0x853d955acef822db058eb8505911ed77f175b99e',
    TUSD: '0x0000000000085d4780b73119b644ae5ecd22b376',
    BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    GUSD: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
    LUSD: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0',
    USDP: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
    MIM: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3',
  },

  // Polygon stablecoins
  [CHAIN_IDS.POLYGON]: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    'USDC.e': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    DAI: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    FRAX: '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
    MAI: '0xa3fa99a148fa48d14ed51d610c367c61876997f1',
    AGEUR: '0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
  },

  // Arbitrum stablecoins
  [CHAIN_IDS.ARBITRUM]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    FRAX: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F',
    MIM: '0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A',
    LUSD: '0x93b346b6BC2548dA6A1E7d98E9a421B42541425b',
  },

  // Optimism stablecoins
  [CHAIN_IDS.OPTIMISM]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    'USDC.e': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    FRAX: '0x2E3D870790dC77A83DD1d18184Acc7439A53f475',
    LUSD: '0xc40F949F8a4e094D1b49a23ea9241D289B7b2819',
    sUSD: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
  },

  // Base stablecoins
  [CHAIN_IDS.BASE]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // Bridged USDC
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  },

  // BSC stablecoins
  [CHAIN_IDS.BSC]: {
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    DAI: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    FRAX: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
    TUSD: '0x14016e85a25aeb13065688cafb43044c2ef86784',
  },

  // Avalanche stablecoins
  [CHAIN_IDS.AVALANCHE]: {
    USDC: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    'USDC.e': '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
    USDT: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
    'USDT.e': '0xc7198437980c041c805a1edcba50c1ce5db95118',
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    FRAX: '0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64',
    MIM: '0x130966628846BFd36ff31a822705796e8cb8C18D',
  },

  // zkSync Era stablecoins
  [CHAIN_IDS.ZKSYNC_ERA]: {
    USDC: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
    'USDC.e': '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
    USDT: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
  },

  // Linea stablecoins
  [CHAIN_IDS.LINEA_MAINNET]: {
    USDC: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
    USDT: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    DAI: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
  },

  // Sei stablecoins
  [CHAIN_IDS.SEI]: {
    USDC: '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1',
  },
};

/**
 * Convert the nested structure to Sets for efficient lookups
 */
export const StablecoinsByChainId: Partial<Record<string, Set<string>>> = {};

Object.entries(STABLECOIN_ADDRESSES).forEach(([chainId, stablecoins]) => {
  StablecoinsByChainId[chainId] = new Set(
    Object.values(stablecoins).map(address => address.toLowerCase())
  );
});
