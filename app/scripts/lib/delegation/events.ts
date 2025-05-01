import type { DelegationController } from '@metamask/delegation-controller';
import { TransactionEventPayload } from '../../../../shared/types/metametrics';
import { getDelegationHashOffchain } from '../../../../shared/lib/delegation';
import { DELEGATION_TAGS } from '../../../../shared/lib/delegation/utils';

export const handleRevokeConfirmation = async (
  transactionEventPayload: TransactionEventPayload,
  controller: DelegationController,
) => {
  const { transactionMeta } = transactionEventPayload;
  const transactionId = transactionMeta.id;

  const { delegations } = controller.state;

  const delegationEntries = Object.values(delegations).filter((entry) => {
    return entry.tags.includes(DELEGATION_TAGS.REVOKE);
  });

  // Fix This: this logic doesn't work if user speed up the transaction
  const revokeEntry = delegationEntries.find((entry) => {
    const revokeId = JSON.parse(entry.meta ?? '{}').revokeId ?? '';

    return revokeId === transactionId;
  });

  if (!revokeEntry) {
    return;
  }

  controller.delete(getDelegationHashOffchain(revokeEntry.delegation));
};
