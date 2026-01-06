import { TransactionType } from '@metamask/transaction-controller';

export const getUnapprovedContractInteractionTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    actionId: 4256525906,
    chainId: '0xaa36a7',
    dappSuggestedGasFees: {
      gas: '0x16a92',
    },
    id: pendingTransactionId,
    isFirstTimeInteraction: false,
    isGasFeeTokenIgnoredIfBalance: false,
    isGasFeeSponsored: false,
    origin: 'local:http://localhost:8086/',
    securityAlertResponse: {},
    status: 'unapproved',
    time: pendingTransactionTime,
    txParams: {
      from: accountAddress,
      data: '0x3b4b13810000000000000000000000000000000000000000000000000000000000000001',
      gas: '0x16a92',
      to: '0x076146c765189d51be3160a2140cf80bfc73ad68',
      value: '0x0',
      maxFeePerGas: '0x5b06b0c0d',
      maxPriorityFeePerGas: '0x59682f00',
      type: '0x2',
    },
    gasLimitNoBuffer: '0x16a92',
    userEditedGasLimit: false,
    verifiedOnBlockchain: false,
    type: TransactionType.contractInteraction,
    networkClientId: 'sepolia',
    defaultGasEstimates: {
      gas: '0x16a92',
      maxFeePerGas: '0x5b06b0c0d',
      maxPriorityFeePerGas: '0x59682f00',
      estimateType: 'medium',
    },
    userFeeLevel: 'medium',
    sendFlowHistory: [],
    history: [],
    simulationData: {
      tokenBalanceChanges: [
        {
          address: '0x076146c765189d51be3160a2140cf80bfc73ad68',
          standard: 'erc721',
          id: '0x01',
          previousBalance: '0x0',
          newBalance: '0x1',
          difference: '0x1',
          isDecrease: false,
        },
      ],
    },
    gasFeeEstimates: {
      type: 'fee-market',
      low: {
        maxFeePerGas: '0x451632798',
        maxPriorityFeePerGas: '0x3b9aca00',
      },
      medium: {
        maxFeePerGas: '0x5dd36ad5a',
        maxPriorityFeePerGas: '0x59682f00',
      },
      high: {
        maxFeePerGas: '0x7690a331c',
        maxPriorityFeePerGas: '0x77359400',
      },
    },
    gasFeeEstimatesLoaded: true,
  };
};

export const getUnapprovedContractDeploymentTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    txParams: {
      ...getUnapprovedContractInteractionTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ).txParams,
      data: '0xd0e30db0',
    },
    type: TransactionType.deployContract,
  };
};

export const getUnapprovedApproveTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    txParams: {
      ...getUnapprovedContractInteractionTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ).txParams,
      data: '0x095ea7b30000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
    },
    type: TransactionType.tokenMethodApprove,
  };
};

export const getUnapprovedIncreaseAllowanceTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    txParams: {
      ...getUnapprovedContractInteractionTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ).txParams,
      data: '0x395093510000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000007530',
    },
    type: TransactionType.tokenMethodIncreaseAllowance,
  };
};

export const getUnapprovedSetApprovalForAllTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
  paramValueApproved: boolean = true,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    txParams: {
      ...getUnapprovedContractInteractionTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ).txParams,
      data: paramValueApproved
        ? '0xa22cb4650000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000000001'
        : '0xa22cb4650000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000000000',
    },
    type: TransactionType.tokenMethodSetApprovalForAll,
  };
};

export const getMaliciousUnapprovedTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    securityAlertResponse: {
      block: 6485814,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Malicious',
      reason: 'raw_native_token_transfer',
      description:
        'Interaction with a known malicious address: 0x5fbdb2315678afecb367f032d93f642f64180aa3',
      features: ['Interaction with a known malicious address'],
      providerRequestsCount: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_getBlockByNumber: 1,
      },
      source: 'local',
      securityAlertId: '22ff30c4-0fe6-4d8b-af39-92aae0bd3c2c',
    },
  };
};

/**
 * Returns an unapproved dapp swap transaction for testing DappSwapComparisonBanner.
 * Uses the test dapp origin (https://metamask.github.io) which is allowlisted
 * for swap comparison functionality.
 *
 * @param accountAddress
 * @param pendingTransactionId
 * @param pendingTransactionTime
 * @param transactionRequestId
 */
export const getUnapprovedDappSwapTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
  transactionRequestId?: string,
) => {
  return {
    ...getUnapprovedContractInteractionTransaction(
      accountAddress,
      pendingTransactionId,
      pendingTransactionTime,
    ),
    chainId: '0xaa36a7',
    networkClientId: 'sepolia',
    origin: 'https://metamask.github.io',
    requestId: transactionRequestId,
    txParams: {
      ...getUnapprovedContractInteractionTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ).txParams,
      data: '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000694098c900000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000004060c100f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000110d9316ec000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110d9316ec0000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000058c51ee8998e8ef06362df26a0d966bbd0cf511300000000000000000000000000000000000000000000000000000000000013880000000000000000000000000000000000000000000000000000000000000040000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000000',
      to: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
      value: '0x110d9316ec000',
    },
    securityAlertResponse: {
      securityAlertId: 'dapp-swap-test-alert-id',
      result_type: 'Benign',
      reason: '',
      description: '',
      features: [],
      block: 6485814,
    },
    delegationAddress: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
    gasFeeTokens: [
      {
        amount: '0x1fdb74d609a6e',
        balance: '0x4baab3b5982f6',
        decimals: 18,
        fee: '0x84260a944df6',
        gas: '0x1ee78',
        gasTransfer: '0x61a8',
        maxFeePerGas: '0x8c209e07',
        maxPriorityFeePerGas: '0x7d2b7504',
        rateWei: '0xde0b6b3a7640000',
        recipient: '0xe3478b0bb1a5084567c319096437924948be1964',
        symbol: 'ETH',
        tokenAddress: '0x0000000000000000000000000000000000000000',
      },
    ],
    gasUsed: '0x1e2ec',
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x5cb846cc842f6',
        newBalance: '0x4baab3b5982f6',
        difference: '0x110d9316ec000',
        isDecrease: true,
      },
      tokenBalanceChanges: [
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          standard: 'erc20',
          previousBalance: '0x10c3c2',
          newBalance: '0x178971',
          difference: '0x6c5af',
          isDecrease: false,
        },
      ],
    },
  };
};
