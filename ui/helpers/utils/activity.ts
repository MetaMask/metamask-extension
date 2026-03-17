import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { PAY_TRANSACTION_TYPES } from '../../pages/confirmations/constants/pay';

type TransactionGroup = {
  initialTransaction: TransactionMeta;
};

export function filterTransactionByChain(
  transactionGroup: TransactionGroup,
  enabledChainIds: string[],
): boolean {
  const { initialTransaction } = transactionGroup;
  const { type, chainId, metamaskPay } = initialTransaction;
  const sourceChainId = metamaskPay?.chainId;

  if (
    !PAY_TRANSACTION_TYPES.includes(type as TransactionType) ||
    !sourceChainId
  ) {
    return enabledChainIds.includes(chainId);
  }

  if (type === TransactionType.perpsDeposit) {
    return enabledChainIds.includes(sourceChainId);
  }

  return (
    enabledChainIds.includes(chainId) || enabledChainIds.includes(sourceChainId)
  );
}
