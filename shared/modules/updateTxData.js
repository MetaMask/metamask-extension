import { TransactionType } from '@metamask/transaction-controller';

export default function updateTxData({
  txData,
  maxFeePerGas,
  customTokenAmount,
  dappProposedTokenAmount,
  currentTokenBalance,
  maxPriorityFeePerGas,
  baseFeePerGas,
  addToAddressBookIfNew,
  toAccounts,
  toAddress,
  name,
}) {
  if (txData.type === TransactionType.simpleSend) {
    addToAddressBookIfNew(toAddress, toAccounts);
  }

  if (baseFeePerGas) {
    txData.estimatedBaseFee = baseFeePerGas;
  }

  if (name) {
    txData.contractMethodName = name;
  }

  if (dappProposedTokenAmount) {
    txData.dappProposedTokenAmount = dappProposedTokenAmount;
    txData.originalApprovalAmount = dappProposedTokenAmount;
  }

  if (customTokenAmount) {
    txData.customTokenAmount = customTokenAmount;
    txData.finalApprovalAmount = customTokenAmount;
  } else if (dappProposedTokenAmount !== undefined) {
    txData.finalApprovalAmount = dappProposedTokenAmount;
  }

  if (currentTokenBalance) {
    txData.currentTokenBalance = currentTokenBalance;
  }

  if (maxFeePerGas) {
    txData.txParams = {
      ...txData.txParams,
      maxFeePerGas,
    };
  }

  if (maxPriorityFeePerGas) {
    txData.txParams = {
      ...txData.txParams,
      maxPriorityFeePerGas,
    };
  }

  return txData;
}
