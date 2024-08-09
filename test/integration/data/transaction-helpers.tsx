import { TransactionType } from '@metamask/transaction-controller';

export const getUnapprovedTransaction = (
  accountAddress: string,
  pendingTransactionId: string,
  pendingTransactionTime: number,
) => {
  return {
    actionId: 4256525906,
    chainId: '0x5',
    dappSuggestedGasFees: {
      gas: '0x16a92',
    },
    id: pendingTransactionId,
    origin: 'https:example.com',
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
    },
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
