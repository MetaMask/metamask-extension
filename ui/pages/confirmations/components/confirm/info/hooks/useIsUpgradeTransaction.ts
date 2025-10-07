import { Hex } from '@metamask/utils';
import { EIP_7702_REVOKE_ADDRESS } from '../../../../hooks/useEIP7702Account';
import { useUnapprovedTransaction } from '../../../../hooks/transactions/useUnapprovedTransaction';

export function useIsUpgradeTransaction() {
  const authorizationAddress = useTransactionAuthorizationAddress();
  const currentConfirmation = useUnapprovedTransaction();
  const { data } = currentConfirmation?.txParams ?? {};
  const isUpgrade =
    Boolean(authorizationAddress) &&
    authorizationAddress !== EIP_7702_REVOKE_ADDRESS;
  return {
    isUpgrade,
    isUpgradeOnly: isUpgrade && (!data || data === '0x'),
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
  const currentConfirmation = useUnapprovedTransaction();
  const { txParams } = currentConfirmation ?? {};
  const { authorizationList } = txParams ?? {};
  const authorization = authorizationList?.[0];

  return authorization?.address;
}
