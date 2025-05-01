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

  const delegationEntries = controller.list({
    chainId: transactionMeta.chainId,
    tags: [DELEGATION_TAGS.REVOKE],
  });

  const revokeEntry = delegationEntries.find((entry) => {
    const revokeId = JSON.parse(entry.meta ?? '{}').revokeId ?? '';
    const revokeIdAfterHyphen = revokeId.substring(revokeId.indexOf('-') + 1);
    const transactionIdAfterHyphen = transactionId.substring(
      transactionId.indexOf('-') + 1,
    );
    return revokeIdAfterHyphen === transactionIdAfterHyphen;
  });

  if (!revokeEntry) {
    return;
  }

  controller.delete(getDelegationHashOffchain(revokeEntry.delegation));
};
