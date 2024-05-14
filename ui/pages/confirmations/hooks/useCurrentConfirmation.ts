import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  getRedesignedConfirmationsEnabled,
  latestPendingConfirmationSelector,
  pendingConfirmationsSelector,
  unconfirmedTransactionsHashSelector,
} from '../../../selectors';
import { REDESIGN_APPROVAL_TYPES, REDESIGN_TRANSACTION_TYPES } from '../utils';

type Approval = ApprovalRequest<Record<string, Json>>;

const useCurrentConfirmation = () => {
  const { id: paramsTransactionId } = useParams<{ id: string }>();
  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsHashSelector,
  );
  const latestPendingConfirmation: Approval = useSelector(
    latestPendingConfirmationSelector,
  );
  const pendingConfirmations: Approval[] = useSelector(
    pendingConfirmationsSelector,
  );
  const [currentConfirmation, setCurrentConfirmation] =
    useState<Record<string, unknown>>();
  const redesignedConfirmationsEnabled = useSelector(
    getRedesignedConfirmationsEnabled,
  );

  useEffect(() => {
    if (!redesignedConfirmationsEnabled) {
      return;
    }

    let pendingConfirmation: Approval | undefined;

    if (paramsTransactionId) {
      if (paramsTransactionId === currentConfirmation?.id) {
        return;
      }
      pendingConfirmation = pendingConfirmations.find(
        ({ id: confirmId }) => confirmId === paramsTransactionId,
      );
    }

    if (!pendingConfirmation) {
      if (!latestPendingConfirmation) {
        setCurrentConfirmation(undefined);
        return;
      }
      pendingConfirmation = latestPendingConfirmation;
    }

    if (pendingConfirmation.id !== currentConfirmation?.id) {
      const unconfirmedTransaction =
        unconfirmedTransactions[pendingConfirmation.id];
      if (!unconfirmedTransactions) {
        setCurrentConfirmation(undefined);
        return;
      }

      const isConfirmationRedesignType =
        REDESIGN_APPROVAL_TYPES.find(
          (type) => type === pendingConfirmation?.type,
        ) ||
        REDESIGN_TRANSACTION_TYPES.find(
          (type) => type === unconfirmedTransaction?.type,
        );

      if (!isConfirmationRedesignType) {
        setCurrentConfirmation(undefined);
        return;
      }

      if (pendingConfirmation?.type === ApprovalType.PersonalSign) {
        const { siwe } = unconfirmedTransaction.msgParams;
        if (siwe?.isSIWEMessage) {
          setCurrentConfirmation(undefined);
          return;
        }
      }
      setCurrentConfirmation(unconfirmedTransaction);
    }
  }, [latestPendingConfirmation, paramsTransactionId, unconfirmedTransactions]);

  return { currentConfirmation };
};

export default useCurrentConfirmation;
