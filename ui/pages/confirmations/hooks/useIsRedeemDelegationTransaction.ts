import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { getDeleGatorEnvironment } from '@metamask-private/delegation-utils';

export function useIsRedeemDelegationTransaction(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (!currentConfirmation) {
    return false;
  }

  const { chainId } = currentConfirmation;
  const chainIdDecimal = parseInt(chainId, 16);

  const delegationManagerAddress = getDeleGatorEnvironment(
    chainIdDecimal,
    '1.2.0',
  )?.DelegationManager;

  return (
    delegationManagerAddress &&
    currentConfirmation?.txParams?.to?.toLowerCase() ===
      delegationManagerAddress.toLowerCase()
  );
}
