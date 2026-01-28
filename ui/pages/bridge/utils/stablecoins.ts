/**
 * Used for determining optimal slippage in swaps
 * Only includes USDC and USDT for now
 */

import { CHAIN_IDS } from '../../../../shared/constants/network';
import { toAssetId } from '../../../../shared/lib/asset-utils';

/**
 * A set of lowercased assetIds of known stablecoin contracts with deep liquidity.
 * Used to determine if a pair qualifies for lower default slippage to avoid frontrunning.
 * Just using USDC and USDT for now, but can add more as needed.
 */
export const STABLECOIN_ASSET_IDS = new Set(
  [
    ...[
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.MAINNET)),
    ...[
      '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // USDC
      '0xA219439258ca9da29E9Cc4cE5596924745e12B93', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.LINEA_MAINNET)),
    ...[
      '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC.e
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.POLYGON)),
    ...[
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
      '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.ARBITRUM)),
    ...[
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    ].map((address) => toAssetId(address, CHAIN_IDS.BASE)),
    ...[
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
      '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC.e
      '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.OPTIMISM)),
    ...[
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
      '0x55d398326f99059ff775485246999027b3197955', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.BSC)),
    ...[
      '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC
      '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // USDC.e
      '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // USDT
      '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT.e
    ].map((address) => toAssetId(address, CHAIN_IDS.AVALANCHE)),
    ...[
      '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // USDC
      '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', // USDC.e
      '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // USDT
    ].map((address) => toAssetId(address, CHAIN_IDS.ZKSYNC_ERA)),
    toAssetId('0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', CHAIN_IDS.SEI), // USDC
  ]
    .filter((assetId) => assetId !== undefined)
    .map((assetId) => assetId.toLowerCase()),
);
