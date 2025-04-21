import { TransactionMeta } from '@metamask/transaction-controller';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  BridgeId,
  StatusResponse,
  StatusTypes,
  ActionTypes,
  StartPollingForBridgeTxStatusArgsSerialized,
  BridgeHistoryItem,
} from '../../../../shared/types/bridge-status';

export const MockStatusResponse = {
  getPending: ({
    srcTxHash = '0xsrcTxHash1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    status: 'PENDING' as StatusTypes,
    srcChain: {
      chainId: srcChainId,
      txHash: srcTxHash,
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: srcChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2518.47',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
    destChain: {
      chainId: destChainId,
      token: {},
    },
  }),
  getComplete: ({
    srcTxHash = '0xsrcTxHash1',
    destTxHash = '0xdestTxHash1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    status: 'COMPLETE' as StatusTypes,
    isExpectedToken: true,
    bridge: 'across' as BridgeId,
    srcChain: {
      chainId: srcChainId,
      txHash: srcTxHash,
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: srcChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
    destChain: {
      chainId: destChainId,
      txHash: destTxHash,
      amount: '990654755978611',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: destChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.63',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
  }),
};

let mockFetchBridgeTxStatusCount = 0;
export const mockFetchBridgeTxStatus: () => Promise<StatusResponse> = () => {
  return new Promise((resolve) => {
    console.log('HELLO mockFetchBridgeTxStatus', mockFetchBridgeTxStatusCount);
    setTimeout(() => {
      if (mockFetchBridgeTxStatusCount === 0) {
        resolve(
          MockStatusResponse.getPending({
            srcTxHash:
              '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
            srcChainId: 1,
            destChainId: 42161,
          }),
        );
      } else {
        resolve(
          MockStatusResponse.getComplete({
            srcTxHash:
              '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
            destTxHash:
              '0x010e1bffe8288956012e6b6132d7eb3eaf9d0bbf066bd13aae13b973c678508f',
            srcChainId: 1,
            destChainId: 42161,
          }),
        );
      }
      mockFetchBridgeTxStatusCount += 1;
    }, 2000);
  });
};

export const getMockQuote = ({
  srcChainId = 42161,
  destChainId = 10,
} = {}) => ({
  requestId: '197c402f-cb96-4096-9f8c-54aed84ca776',
  srcChainId,
  srcTokenAmount: '991250000000000',
  srcAsset: {
    address: '0x0000000000000000000000000000000000000000',
    assetId: getNativeAssetForChainId(srcChainId).assetId,
    chainId: srcChainId,
    symbol: 'ETH',
    decimals: 18,
    name: 'ETH',
    coinKey: 'ETH',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    priceUSD: '2478.7',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  destChainId,
  destTokenAmount: '990654755978612',
  destAsset: {
    address: '0x0000000000000000000000000000000000000000',
    assetId: getNativeAssetForChainId(destChainId).assetId,
    chainId: destChainId,
    symbol: 'ETH',
    decimals: 18,
    name: 'ETH',
    coinKey: 'ETH',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    priceUSD: '2478.63',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  feeData: {
    metabridge: {
      amount: '8750000000000',
      asset: {
        address: '0x0000000000000000000000000000000000000000',
        assetId: getNativeAssetForChainId(srcChainId).assetId,
        chainId: srcChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
  },
  bridgeId: 'lifi',
  bridges: ['across'],
  steps: [
    {
      action: 'bridge' as ActionTypes,
      srcChainId,
      destChainId,
      protocol: {
        name: 'across',
        displayName: 'Across',
        icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/acrossv2.png',
      },
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        assetId: getNativeAssetForChainId(srcChainId).assetId,
        chainId: srcChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
      destAsset: {
        address: '0x0000000000000000000000000000000000000000',
        assetId: getNativeAssetForChainId(destChainId).assetId,
        chainId: destChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.63',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
      srcAmount: '991250000000000',
      destAmount: '990654755978612',
    },
  ],
});

export const getMockStartPollingForBridgeTxStatusArgs = ({
  txMetaId = 'bridgeTxMetaId1',
  srcTxHash = '0xsrcTxHash1',
  account = '0xaccount1',
  srcChainId = 42161,
  destChainId = 10,
} = {}): StartPollingForBridgeTxStatusArgsSerialized => ({
  bridgeTxMeta: {
    id: txMetaId,
  } as TransactionMeta,
  statusRequest: {
    bridgeId: 'lifi',
    srcTxHash,
    bridge: 'across',
    srcChainId,
    destChainId,
    quote: getMockQuote({ srcChainId, destChainId }),
    refuel: false,
  },
  quoteResponse: {
    quote: getMockQuote({ srcChainId, destChainId }),
    trade: {
      chainId: srcChainId,
      to: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      from: account,
      value: '0x038d7ea4c68000',
      data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038589602234000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000007f544a44c0000000000000000000000000056ca675c3633cc16bd6849e2b431d4e8de5e23bf000000000000000000000000000000000000000000000000000000000000006c5a39b10a4f4f0747826140d2c5fe6ef47965741f6f7a4734bf784bf3ae3f24520000000a000222266cc2dca0671d2a17ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd00dfeeddeadbeef8932eb23bad9bddb5cf81426f78279a53c6c3b7100000000000000000000000000000000000000009ce3c510b3f58edc8d53ae708056e30926f62d0b42d5c9b61c391bb4e8a2c1917f8ed995169ffad0d79af2590303e83c57e15a9e0b248679849556c2e03a1c811b',
      gasLimit: 282915,
    },
    approval: null,
    estimatedProcessingTimeInSeconds: 15,
    sentAmount: { amount: '1.234', valueInCurrency: null, usd: null },
    toTokenAmount: { amount: '1.234', valueInCurrency: null, usd: null },
    totalNetworkFee: { amount: '1.234', valueInCurrency: null, usd: null },
    totalMaxNetworkFee: { amount: '1.234', valueInCurrency: null, usd: null },
    gasFee: { amount: '1.234', valueInCurrency: null, usd: null },
    adjustedReturn: { valueInCurrency: null, usd: null },
    swapRate: '1.234',
    cost: { valueInCurrency: null, usd: null },
  },
  startTime: 1729964825189,
  slippagePercentage: 0,
  initialDestAssetBalance: undefined,
  targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
});

export const MockTxHistory = {
  getInitNoSrcTxHash: ({
    txMetaId = 'bridgeTxMetaId1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}): Record<string, BridgeHistoryItem> => ({
    [txMetaId]: {
      txMetaId,
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      initialDestAssetBalance: undefined,
      pricingData: { amountSent: '1.234' },
      status: MockStatusResponse.getPending({
        srcChainId,
      }),
      hasApprovalTx: false,
    },
  }),
  getInit: ({
    txMetaId = 'bridgeTxMetaId1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}): Record<string, BridgeHistoryItem> => ({
    [txMetaId]: {
      txMetaId,
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      initialDestAssetBalance: undefined,
      pricingData: { amountSent: '1.234' },
      status: MockStatusResponse.getPending({
        srcChainId,
      }),
      hasApprovalTx: false,
    },
  }),
  getPending: ({
    txMetaId = 'bridgeTxMetaId1',
    srcTxHash = '0xsrcTxHash1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}): Record<string, BridgeHistoryItem> => ({
    [txMetaId]: {
      txMetaId,
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      status: MockStatusResponse.getPending({
        srcTxHash,
        srcChainId,
      }),
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      initialDestAssetBalance: undefined,
      pricingData: { amountSent: '1.234' },
      hasApprovalTx: false,
    },
  }),
  getComplete: ({
    txMetaId = 'bridgeTxMetaId1',
    srcTxHash = '0xsrcTxHash1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}): Record<string, BridgeHistoryItem> => ({
    [txMetaId]: {
      txMetaId,
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      completionTime: 1736277625746,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      status: MockStatusResponse.getComplete({ srcTxHash }),
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      initialDestAssetBalance: undefined,
      pricingData: {
        amountSent: '1.234',
        amountSentInUsd: undefined,
        quotedGasInUsd: undefined,
        quotedReturnInUsd: undefined,
      },
      hasApprovalTx: false,
    },
  }),
};
