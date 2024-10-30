import { zeroAddress } from 'ethereumjs-util';
import { Hex } from '@metamask/utils';
import { METABRIDGE_ETHEREUM_ADDRESS } from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { BridgeControllerState, BridgeFeatureFlagsKey } from './types';

export const BRIDGE_CONTROLLER_NAME = 'BridgeController';
export const REFRESH_INTERVAL_MS = 30 * 1000;
const DEFAULT_MAX_REFRESH_COUNT = 5;
export const DEFAULT_SLIPPAGE = 0.5;

export enum RequestStatus {
  LOADING,
  FETCHED,
  ERROR,
}

export const DEFAULT_BRIDGE_CONTROLLER_STATE: BridgeControllerState = {
  bridgeFeatureFlags: {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: DEFAULT_MAX_REFRESH_COUNT,
    },
    [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
    [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
    [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
  },
  srcTokens: {},
  srcTopAssets: [],
  destTokens: {},
  destTopAssets: [],
  quotes: [
    // {
    //   quote: {
    //     requestId: 'a750458d-910a-4f9d-8a76-19ffe7d4e89c',
    //     srcChainId: 10,
    //     srcAsset: {
    //       chainId: 10,
    //       address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    //       symbol: 'USDC',
    //       name: 'USD Coin',
    //       decimals: 6,
    //       icon: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //       logoURI: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //       chainAgnosticId: null,
    //     },
    //     srcTokenAmount: '14000000',
    //     destChainId: 42161,
    //     destAsset: {
    //       chainId: 42161,
    //       address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    //       symbol: 'USDC',
    //       name: 'USD Coin',
    //       decimals: 6,
    //       icon: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //       logoURI: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //       chainAgnosticId: null,
    //     },
    //     destTokenAmount: '13600000',
    //     feeData: {
    //       metabridge: {
    //         amount: '0',
    //         asset: {
    //           chainId: 10,
    //           address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    //           symbol: 'USDC',
    //           name: 'USD Coin',
    //           decimals: 6,
    //           icon: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           logoURI: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           chainAgnosticId: null,
    //         },
    //       },
    //     },
    //     bridgeId: 'socket',
    //     bridges: ['celercircle'],
    //     steps: [
    //       {
    //         action: 'bridge',
    //         srcChainId: 10,
    //         destChainId: 42161,
    //         protocol: {
    //           name: 'cctp',
    //           displayName: 'Circle CCTP',
    //           icon: 'https://movricons.s3.ap-south-1.amazonaws.com/CCTP.svg',
    //         },
    //         srcAsset: {
    //           chainId: 10,
    //           address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    //           symbol: 'USDC',
    //           name: 'USD Coin',
    //           decimals: 6,
    //           icon: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           logoURI: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           chainAgnosticId: null,
    //         },
    //         destAsset: {
    //           chainId: 42161,
    //           address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    //           symbol: 'USDC',
    //           name: 'USD Coin',
    //           decimals: 6,
    //           icon: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           logoURI: 'https://assets.polygon.technology/tokenAssets/usdc.svg',
    //           chainAgnosticId: null,
    //         },
    //         srcAmount: '14000000',
    //         destAmount: '13600000',
    //       },
    //     ],
    //   },
    //   approval: {
    //     chainId: 10,
    //     to: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    //     from: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    //     value: '0x00',
    //     data: '0x095ea7b3000000000000000000000000b90357f2b86dbfd59c3502215d4060f71df8ca0e0000000000000000000000000000000000000000000000000000000000d59f80',
    //     gasLimit: 61865,
    //   },
    //   trade: {
    //     chainId: 10,
    //     to: '0xB90357f2b86dbfD59c3502215d4060f71DF8ca0e',
    //     from: '0x141d32a89a1e0a5ef360034a2f60a4b917c18838',
    //     value: '0x00',
    //     data: '0x3ce33bff00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff850000000000000000000000000000000000000000000000000000000000d59f8000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000f736f636b6574416461707465725632000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002400000000000000000000000003a23f943181408eac424116af7b7790c94cb97a50000000000000000000000003a23f943181408eac424116af7b7790c94cb97a5000000000000000000000000000000000000000000000000000000000000a4b10000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff85000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000000000000000000000000000000000000000d59f8000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000716a8b9dd056055c84b7a2ba0a016099465a518700000000000000000000000000000000000000000000000000000000000000e80000018cb7dfe9d00000000000000000000000000000000000000000000000000000000000d59f8000000000000000000000000000000000000000000000000000000000000000c4000000000000000000000000141d32a89a1e0a5ef360034a2f60a4b917c188380000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff85000000000000000000000000000000000000000000000000000000000000a4b100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000061a8000000000000000000000000000000000000000000000000037c4e6d05ade63f74fc570e26c4e28f1ef3d39829e4aaab4eab15701586d9c98159a5806a9681bb9f1e7bb60a29f02b43d3067e4953aa05a748b0647f71440301c',
    //     gasLimit: 290954,
    //   },
    //   estimatedProcessingTimeInSeconds: 1500,
    // },
  ],
  quoteRequest: {
    walletAddress: undefined,
    srcTokenAddress: zeroAddress(),
    slippage: DEFAULT_SLIPPAGE,
  },
  quotes: [],
  quotesLastFetched: undefined,
  quotesLoadingStatus: undefined,
  quotesRefreshCount: 0,
};

export const METABRIDGE_CHAIN_TO_ADDRESS_MAP: Record<Hex, string> = {
  [CHAIN_IDS.MAINNET]: METABRIDGE_ETHEREUM_ADDRESS,
};
