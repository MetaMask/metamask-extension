import type { DelegationController } from '@metamask/delegation-controller';
import { TransactionEventPayload } from '../../../../shared/types/metametrics';
import { getDelegationHashOffchain } from '../../../../shared/lib/delegation';

export const DELEGATION_REVOKE_TAG = 'revoke';

export const handleRevokeConfirmation = async (
  transactionEventPayload: TransactionEventPayload,
  controller: DelegationController,
) => {
  const { transactionMeta } = transactionEventPayload;
  const transactionId = transactionMeta.id;

  const { delegations } = controller.state;

  const delegationEntries = Object.values(delegations).filter((entry) => {
    return entry.tags.includes(DELEGATION_REVOKE_TAG);
  });

  // FIXME: this logic doesn't work if user speeds up the transaction
  const revokeEntry = delegationEntries.find((entry) => {
    const revokeId = JSON.parse(entry.meta ?? '{}').revokeId ?? '';

    return revokeId === transactionId;
  });

  if (!revokeEntry) {
    return;
  }

  controller.delete(getDelegationHashOffchain(revokeEntry.delegation));
};
