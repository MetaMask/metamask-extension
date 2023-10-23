import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

import {
  getLatestPendingConfirmation,
  getPendingConfirmations,
  unapprovedPersonalMsgsSelector,
} from '../../selectors';
import { updatCurrentConfirmation } from '../../ducks/confirm/confirm.duck';

type Approval = ApprovalRequest<Record<string, Json>>;

const updateCurrentConfirmation = () => {
  const dispatch = useDispatch();
  const { id: paramsTransactionId } = useParams<{ id: string }>();
  const unapprovedPersonalMsgs = useSelector(unapprovedPersonalMsgsSelector);

  const latestPendingConfirmation: Approval = useSelector(
    getLatestPendingConfirmation,
  );
  const pendingConfirmations: Approval[] = useSelector(getPendingConfirmations);

  useEffect(() => {
    let pendingConfirmation: Approval | undefined;
    if (paramsTransactionId) {
      pendingConfirmation = pendingConfirmations.find(
        ({ id: confirmId }) => confirmId === paramsTransactionId,
      );
    } else {
      pendingConfirmation = latestPendingConfirmation;
    }
    if (pendingConfirmation) {
      const unapprovedMsg = unapprovedPersonalMsgs[pendingConfirmation.id];
      dispatch(updatCurrentConfirmation(unapprovedMsg));
    }
    return () => {
      dispatch(updatCurrentConfirmation(undefined));
    };
  }, []);
};

export default updateCurrentConfirmation;
