import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import Popover from '../../ui/popover';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  cancelTx,
  rejectPendingApproval,
  cancelQrCodeScan,
} from '../../../store/actions';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';
import QRHardwareSignRequest from './qr-hardware-sign-request';

const QRHardwarePopover = () => {
  const t = useI18nContext();

  const activeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const [errorTitle, setErrorTitle] = useState('');

  const { txData } = useSelector((state) => {
    return state.confirmTransaction;
  });
  // the confirmTransaction's life cycle is not consistent with QR hardware wallet;
  // the confirmTransaction will change after the previous tx is confirmed or cancel,
  // we want to block the changing by sign request id;
  const _txData = useMemo(() => {
    return txData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScanRequest?.requestId]);

  const dispatch = useDispatch();
  const walletImporterCancel = useCallback(
    () => dispatch(cancelQrCodeScan()),
    [dispatch],
  );

  const signRequestCancel = useCallback(() => {
    dispatch(
      rejectPendingApproval(
        _txData.id,
        serializeError(providerErrors.userRejectedRequest()),
      ),
    );
    dispatch(cancelTx(_txData));
    dispatch(cancelQrCodeScan());
  }, [dispatch, _txData]);

  const title = useMemo(() => {
    if (activeScanRequest === QrScanRequestType.SIGN) {
      return t('QRHardwareSignRequestTitle');
    }
    if (activeScanRequest === QrScanRequestType.PAIR) {
      return t('QRHardwareWalletImporterTitle');
    }
    if (errorTitle !== '') {
      return errorTitle;
    }
    return '';
  }, [activeScanRequest, t, errorTitle]);

  return activeScanRequest ? (
    <Popover
      title={title}
      onClose={
        activeScanRequest.type === QrScanRequestType.PAIR
          ? walletImporterCancel
          : signRequestCancel
      }
    >
      {activeScanRequest.type === QrScanRequestType.PAIR && (
        <QRHardwareWalletImporter
          handleCancel={walletImporterCancel}
          setErrorTitle={setErrorTitle}
        />
      )}
      {activeScanRequest.type === QrScanRequestType.SIGN && (
        <QRHardwareSignRequest
          setErrorTitle={setErrorTitle}
          handleCancel={signRequestCancel}
          request={activeScanRequest.request}
        />
      )}
    </Popover>
  ) : null;
};

export default QRHardwarePopover;
