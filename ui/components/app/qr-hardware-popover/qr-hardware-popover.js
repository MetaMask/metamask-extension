import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import {
  getCurrentQRHardwareState,
  isQrCodeScanActive,
} from '../../../selectors';
import Popover from '../../ui/popover';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  cancelQRHardwareSignRequest as cancelQRHardwareSignRequestAction,
  cancelTx,
  rejectPendingApproval,
  cancelQrCodeScan,
} from '../../../store/actions';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';
import QRHardwareSignRequest from './qr-hardware-sign-request';

const QRHardwarePopover = () => {
  const t = useI18nContext();

  const qrHardware = useSelector(getCurrentQRHardwareState);
  const { sign } = qrHardware;
  const isScanActive = useSelector(isQrCodeScanActive);
  const showSignRequest = sign?.request;
  const showPopover = isScanActive || showSignRequest;
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
  }, [sign?.request?.requestId]);

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
    dispatch(cancelQRHardwareSignRequestAction());
  }, [dispatch, _txData]);

  const title = useMemo(() => {
    let _title = '';
    if (showSignRequest) {
      _title = t('QRHardwareSignRequestTitle');
    } else if (isScanActive) {
      _title = t('QRHardwareWalletImporterTitle');
    }
    if (errorTitle !== '') {
      _title = errorTitle;
    }
    return _title;
  }, [showSignRequest, isScanActive, t, errorTitle]);

  return showPopover ? (
    <Popover
      title={title}
      onClose={isScanActive ? walletImporterCancel : signRequestCancel}
    >
      {isScanActive && (
        <QRHardwareWalletImporter
          handleCancel={walletImporterCancel}
          setErrorTitle={setErrorTitle}
        />
      )}
      {showSignRequest && (
        <QRHardwareSignRequest
          setErrorTitle={setErrorTitle}
          handleCancel={signRequestCancel}
          request={sign.request}
        />
      )}
    </Popover>
  ) : null;
};

export default QRHardwarePopover;
