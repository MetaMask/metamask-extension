import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../constants/network';

const nftPurchaseErc1155Transaction = {
  chainId: CHAIN_IDS.MAINNET,
  id: 'nft-buy-id',
  hash: '0x2fda37c5b591c30367649c3c317621429bb5c59ff6a77b0a8cd48b56897168bc',
  status: TransactionStatus.confirmed,
  time: 1780606867763,
  type: TransactionType.contractInteraction,
  txParams: {
    from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
    to: '0x0000000000000068f116a894984e2db1123eb395',
    value: '0x51d91a3da280',
    data: '0x00000000',
  },
  simulationData: {
    nativeBalanceChange: {
      previousBalance: '0x49bfcb2d8362e',
      newBalance: '0x44a23989a93ae',
      difference: '0x51d91a3da280',
      isDecrease: true,
    },
    tokenBalanceChanges: [
      {
        address: '0x6fad73936527d2a82aea5384d252462941b44042',
        standard: 'erc1155',
        id: '0x39',
        previousBalance: '0x0',
        newBalance: '0x1',
        difference: '0x1',
        isDecrease: false,
      },
    ],
  },
};

const perpsWithdrawTransaction = {
  actionId: 1780690942749.6296,
  batchTransactions: [],
  batchTransactionsOptions: {},
  chainId: CHAIN_IDS.ARBITRUM,
  customNonceValue: '',
  defaultGasEstimates: {
    estimateType: 'medium',
    gas: '0xce91',
    maxFeePerGas: '0x3a430a0',
    maxPriorityFeePerGas: '0x0',
  },
  delegationAddress: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
  gasFeeEstimatesLoaded: true,
  gasFeeTokens: [],
  gasLimitNoBuffer: '0xac24',
  hash: '0xd5dbb4421d123fd16d16485c394a68b5a28d9b5da9d9973554258a9fd2e9ebf6',
  id: '427ad200-611c-11f1-960a-af7f25501f42',
  isFirstTimeInteraction: false,
  isGasFeeSponsored: false,
  isGasFeeTokenIgnoredIfBalance: false,
  isIntentComplete: true,
  isInternal: true,
  metamaskPay: {
    bridgeFeeFiat: '0.28429',
    chainId: CHAIN_IDS.MAINNET,
    isPostQuote: true,
    networkFeeFiat: '0',
    sourceHash:
      '0xc01843d173d62145c192043d0c69ec02048100b70ed9401763e0ef2432d9fb30',
    targetFiat: '0.714705',
    tokenAddress: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
    totalFiat: '1.28429',
  },
  nestedTransactions: undefined,
  networkClientId: 'arbitrum-mainnet',
  origin: 'metamask',
  originalGasEstimate: '0xce91',
  r: '0x80a65112995ff66a0c1a65aed4b26ab0c2db34dc1e08af9618c957bc49878858',
  rawTx:
    '0x02f8ad82a4b138808403a476f082ce9194af88d065e77c8cc2239327c5edb3a432268e583180b844a9059cbb0000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e29200000000000000000000000000000000000000000000000000000000000f4240c080a080a65112995ff66a0c1a65aed4b26ab0c2db34dc1e08af9618c957bc49878858a06456697c1016f9265f308dd92c707a62611f4891067795cc676571e316a15c36',
  requiredTransactionIds: undefined,
  s: '0x6456697c1016f9265f308dd92c707a62611f4891067795cc676571e316a15c36',
  status: TransactionStatus.confirmed,
  submittedTime: 1780690964536,
  time: 1780690942752,
  txParams: {
    data: '0xa9059cbb0000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e29200000000000000000000000000000000000000000000000000000000000f4240',
    from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
    gas: '0xce91',
    gasLimit: '0xce91',
    maxFeePerGas: '0x3a476f0',
    maxPriorityFeePerGas: '0x0',
    to: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    type: '0x2',
    value: '0x0',
  },
  txReceipt: undefined,
  type: TransactionType.perpsWithdraw,
  userEditedGasLimit: false,
  userFeeLevel: 'medium',
  v: '0x0',
  verifiedOnBlockchain: false,
};

const lineaMusd = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const arbitrumUsdc = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';

const perpsDepositTransaction = {
  batchTransactions: [],
  batchTransactionsOptions: {},
  chainId: CHAIN_IDS.ARBITRUM,
  customNonceValue: '',
  delegationAddress: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
  gasFeeEstimatesLoaded: true,
  gasFeeTokens: [],
  hash: '0x3073fa67020abb1931ed043d7a8b6b020aa1004c9d0dd9ebd43ca5b9c10e9503',
  id: '238ebf90-659b-11f1-982b-71194b583664',
  isGasFeeSponsored: false,
  isGasFeeTokenIgnoredIfBalance: false,
  isIntentComplete: true,
  isInternal: true,
  metamaskPay: {
    bridgeFeeFiat: '0.001054',
    chainId: CHAIN_IDS.MAINNET,
    networkFeeFiat: '0.04143764111397638042',
    sourceHash:
      '0xc93326d28bfe73508ed6bbb9333835a0c6ee4e1b954205390eee0f2956b8c2f6',
    targetFiat: '1.000169',
    tokenAddress: lineaMusd,
    totalFiat: '1.04266064111397638042',
  },
  networkClientId: 'arbitrum-mainnet',
  origin: 'metamask',
  r: '0xd3ecffa0be63e8a61e487c727ce36a760f0c0a61291b2817cbe9dc55598e45bf',
  rawTx:
    '0x02f8ae82a4b139808403938700830186a094af88d065e77c8cc2239327c5edb3a432268e583180b844a9059cbb0000000000000000000000002df1c51e09aecf9cacb7bc98cb1742757f163df700000000000000000000000000000000000000000000000000000000000f42e9c080a0d3ecffa0be63e8a61e487c727ce36a760f0c0a61291b2817cbe9dc55598e45bfa013410ef68186a2782a10749ff54e39d6f014ed78a307cd4a344621fc2fac8441',
  requiredTransactionIds: ['276012e0-659b-11f1-982b-71194b583664'],
  s: '0x13410ef68186a2782a10749ff54e39d6f014ed78a307cd4a344621fc2fac8441',
  status: TransactionStatus.confirmed,
  submittedTime: 1781185247980,
  time: 1781185241609,
  txParams: {
    data: '0xa9059cbb0000000000000000000000002df1c51e09aecf9cacb7bc98cb1742757f163df700000000000000000000000000000000000000000000000000000000000f42e9',
    from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
    gas: '0x186a0',
    gasLimit: '0x186a0',
    maxFeePerGas: '0x3938700',
    maxPriorityFeePerGas: '0x0',
    to: arbitrumUsdc,
    type: '0x2',
    value: '0x0',
  },
  type: TransactionType.perpsDeposit,
  userEditedGasLimit: false,
  v: '0x0',
  verifiedOnBlockchain: false,
};

export const localStateFixtures = {
  // ERC-1155 purchase local state before API metadata is available.
  nftPurchaseErc1155: {
    transactionGroup: {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: nftPurchaseErc1155Transaction,
      nonce: '0xd8',
      primaryTransaction: nftPurchaseErc1155Transaction,
      transactions: [nftPurchaseErc1155Transaction],
    },
  },
  perpsWithdraw: {
    // Local-only Perps withdrawal from state.
    transactionGroup: {
      initialTransaction: perpsWithdrawTransaction,
      primaryTransaction: perpsWithdrawTransaction,
      transactions: [perpsWithdrawTransaction],
    },
  },
  perpsDeposit: {
    // Local-only Perps deposit from state.
    transactionGroup: {
      initialTransaction: perpsDepositTransaction,
      primaryTransaction: perpsDepositTransaction,
      transactions: [perpsDepositTransaction],
    },
  },
};
