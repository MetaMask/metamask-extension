import { TransactionEventPayload } from '../../../../shared/types/metametrics';
import { getDelegationHashOffchain } from '../../../../shared/lib/delegation';
import type { DelegationController } from '@metamask/delegation-controller';

export const handleRevokeConfirmation = async (
  transactionEventPayload: TransactionEventPayload,
  controller: DelegationController,
) => {
  const { transactionMeta } = transactionEventPayload;
  const transactionBatchId = transactionMeta.batchId;
  const from = transactionMeta.txParams.from as `0x${string}`;

  const delegationEntries = controller.list({
    from,
    chainId: transactionMeta.chainId,
  });

  const revokeEntry = delegationEntries.find(
    (entry) => JSON.parse(entry.meta ?? '{}').revokeId === transactionBatchId,
  );

  if (!revokeEntry) {
    return;
  }

  controller.delete(getDelegationHashOffchain(revokeEntry.delegation));
};
