import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentQRHardwareState } from '../../../selectors';
import Popover from '../../ui/popover';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { cancelReadQRHardwareCryptoHDKey as cancelReadQRHardwareCryptoHDKeyAction } from '../../../store/actions';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';

const QRHardwarePopover = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const walletImporterCancel = useCallback(
    () => dispatch(cancelReadQRHardwareCryptoHDKeyAction()),
    [dispatch],
  );

  const qrHardware = useSelector(getCurrentQRHardwareState);
  const { sync } = qrHardware;
  
  const showWalletImporter = !!(sync && sync.reading);
  const showPopover = showWalletImporter;

  const title = useMemo(() => {
    return showWalletImporter ? t('QRHardwareWalletImporterTitle') : '';
  }, [showWalletImporter, t]);

  return showPopover ? (
    <Popover
      title={title}
      onClose={showWalletImporter ? walletImporterCancel : undefined}
    >
      {showWalletImporter && (
        <QRHardwareWalletImporter handleCancel={walletImporterCancel} />
      )}
    </Popover>
  ) : null;
};

export default QRHardwarePopover;
