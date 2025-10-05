import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  ApprovalsMetaMaskState,
  getUnapprovedTransaction,
  oldestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import {
  shouldUseRedesignForSignatures,
  shouldUseRedesignForTransactions,
} from '../../../../shared/lib/confirmation.utils';
import { useUnapprovedTransaction } from './transactions/useUnapprovedTransaction';
import { useSignatureRequest } from './signatures/useSignatureRequest';

/**
 * Determine the current confirmation based on the pending approvals and controller state.
 *
 * DO NOT USE within a redesigned confirmation.
 * Instead use ConfirmContext to read the current confirmation.
 *
 * @returns The current confirmation data.
 */
const useCurrentConfirmation = () => {
  const unapprovedTransaction = useUnapprovedTransaction();
  const signatureRequest = useSignatureRequest();

  const currentConfirmation = unapprovedTransaction ?? signatureRequest;

  return { currentConfirmation };
};

export default useCurrentConfirmation;
