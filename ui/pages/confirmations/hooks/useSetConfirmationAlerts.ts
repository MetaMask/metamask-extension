import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { useSignatureRequestOptional } from './useSignatureRequest';
import useConfirmationAlerts from './useConfirmationAlerts';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';

const useSetConfirmationAlerts = () => {
  const dispatch = useDispatch();
  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;
  const alerts = useConfirmationAlerts();
  const ownerId = currentConfirmation?.id as string;

  useEffect(() => {
    dispatch(updateAlerts(ownerId, alerts));
  }, [alerts, ownerId]);

  useEffect(() => {
    return () => {
      dispatch(clearAlerts(ownerId));
    };
  }, [ownerId]);
};

export default useSetConfirmationAlerts;
