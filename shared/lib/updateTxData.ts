import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';

/** Confirmation UI fields merged onto {@link TransactionMeta} before submit. */
export type UpdateTxDataMeta = TransactionMeta & {
  estimatedBaseFee?: string;
  contractMethodName?: string;
  dappProposedTokenAmount?: string;
  originalApprovalAmount?: string;
  customTokenAmount?: string;
  finalApprovalAmount?: string;
  currentTokenBalance?: string;
};

export type UpdateTxDataParams = {
  txData: UpdateTxDataMeta;
  maxFeePerGas?: string;
  customTokenAmount?: string;
  dappProposedTokenAmount?: string;
  currentTokenBalance?: string;
  maxPriorityFeePerGas?: string;
  baseFeePerGas?: string;
  addToAddressBookIfNew?: (toAddress: string, toAccounts: unknown) => void;
  toAccounts?: unknown;
  toAddress?: string;
  name?: string;
};

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
}: UpdateTxDataParams): UpdateTxDataMeta {
  if (
    [TransactionType.simpleSend, TransactionType.swapAndSend].includes(
      txData.type,
    ) &&
    addToAddressBookIfNew &&
    toAddress !== undefined &&
    toAccounts !== undefined
  ) {
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
