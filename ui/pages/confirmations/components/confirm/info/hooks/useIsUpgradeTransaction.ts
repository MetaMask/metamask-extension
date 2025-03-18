import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';

export function useIsUpgradeTransaction(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { txParams } = currentConfirmation ?? {};
  const { authorizationList } = txParams ?? {};

  return Boolean(authorizationList?.length);
}
