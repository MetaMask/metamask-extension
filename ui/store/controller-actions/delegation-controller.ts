import {
  type DelegationEntry,
  type DelegationFilter,
} from '@metamask/delegation-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { UnsignedDelegation } from '../../../shared/lib/delegation';
import { submitRequestToBackground } from '../background-connection';

export const signDelegation = async ({
  delegation,
  chainId,
}: {
  delegation: UnsignedDelegation;
  chainId: Hex;
}): Promise<Hex> => {
  return await submitRequestToBackground('signDelegation', [
    { delegation, chainId },
  ]);
};

export const storeDelegationEntry = async (
  entry: DelegationEntry,
): Promise<void> => {
  return await submitRequestToBackground('storeDelegationEntry', [{ entry }]);
};

export const listDelegationEntries = async (
  filter: DelegationFilter,
): Promise<DelegationEntry[]> => {
  return await submitRequestToBackground('listDelegationEntries', [filter]);
};

export const getDelegationEntry = async (
  hash: Hex,
): Promise<DelegationEntry> => {
  return await submitRequestToBackground('getDelegationEntry', [hash]);
};

export const getDelegationEntryChain = async (
  hash: Hex,
): Promise<DelegationEntry[]> => {
  return await submitRequestToBackground('getDelegationEntryChain', [hash]);
};

export const deleteDelegationEntry = async (hash: Hex) => {
  return await submitRequestToBackground('deleteDelegationEntry', [hash]);
};

export const awaitDeleteDelegationEntry = async ({
  hash,
  txMeta,
  entryToStore,
}: {
  hash: Hex;
  txMeta: TransactionMeta;
  entryToStore?: DelegationEntry;
}) => {
  return await submitRequestToBackground('awaitDeleteDelegationEntry', [
    { hash, txMeta, entryToStore },
  ]);
};
