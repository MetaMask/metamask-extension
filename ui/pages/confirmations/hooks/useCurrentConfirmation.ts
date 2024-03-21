import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';

import {
  latestPendingConfirmationSelector,
  pendingConfirmationsSelector,
  unconfirmedTransactionsHashSelector,
} from '../../../selectors';

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

  useEffect(() => {
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
      if (
        pendingConfirmation.type !== ApprovalType.PersonalSign &&
        pendingConfirmation.type !== ApprovalType.EthSignTypedData
      ) {
        return;
      }
      if (pendingConfirmation.type === ApprovalType.PersonalSign) {
        const { siwe } = unconfirmedTransaction.msgParams;
        if (siwe?.isSIWEMessage) {
          setCurrentConfirmation(undefined);
          return;
        }
      }
      if (pendingConfirmation.type === ApprovalType.EthSignTypedData) {
        const { version } = unconfirmedTransaction.msgParams;
        if (version !== 'V3' && version !== 'V4') {
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
