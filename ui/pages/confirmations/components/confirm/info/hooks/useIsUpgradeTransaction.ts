import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useConfirmContext } from '../../../../context/confirm';
import { EIP_7702_REVOKE_ADDRESS } from '../../../../hooks/useEIP7702Account';

export function useIsUpgradeTransaction() {
  const authorizationAddress = useTransactionAuthorizationAddress();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  console.log('nestedTransactions = ', nestedTransactions);
  const isUpgrade =
    Boolean(authorizationAddress) &&
    authorizationAddress !== EIP_7702_REVOKE_ADDRESS;
  return {
    isUpgrade,
    isUpgradeWithoutNestedTransactions:
      isUpgrade && !nestedTransactions?.length,
  };
}

export function useIsDowngradeTransaction(): boolean {
  const authorizationAddress = useTransactionAuthorizationAddress();

  return (
    Boolean(authorizationAddress) &&
    authorizationAddress === EIP_7702_REVOKE_ADDRESS
  );
}

function useTransactionAuthorizationAddress(): Hex | undefined {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { txParams } = currentConfirmation ?? {};
  const { authorizationList } = txParams ?? {};
  const authorization = authorizationList?.[0];

  return authorization?.address;
}
