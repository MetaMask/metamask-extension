import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

import {
  latestPendingConfirmationSelector,
  pendingConfirmationsSelector,
  unapprovedPersonalMsgsSelector,
} from '../../../selectors';

type Approval = ApprovalRequest<Record<string, Json>>;

const useCurrentConfirmation = () => {
  const { id: paramsTransactionId } = useParams<{ id: string }>();
  const unapprovedPersonalMsgs = useSelector(unapprovedPersonalMsgsSelector);
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
      // currently re-design is enabled only for personal signatures
      // condition below can be changed as we enable it for other transactions also
      const unapprovedMsg = unapprovedPersonalMsgs[pendingConfirmation.id];
      if (!unapprovedMsg) {
        setCurrentConfirmation(undefined);
        return;
      }
      const { siwe } = unapprovedMsg.msgParams;

      if (siwe?.isSIWEMessage) {
        setCurrentConfirmation(undefined);
      } else {
        setCurrentConfirmation(unapprovedMsg);
      }
    }
  }, [latestPendingConfirmation, paramsTransactionId, unapprovedPersonalMsgs]);

  return { currentConfirmation };
};

export default useCurrentConfirmation;
