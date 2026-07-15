import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  JustifyContent,
} from '../../helpers/constants/design-system';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import { DeeplinkQRCode } from '../../components/app/deeplink-qr-code';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  getHomeDeepLinkQrCode,
  selectCanShowLowPriorityModal,
} from '../../selectors/home-modals';
import { clearHomeDeepLinkQrCode } from '../../ducks/app/app';
import { useAppDispatch } from '../../store/hooks';

export function DeeplinkQrCodeModalContainer() {
  const t = useI18nContext();
  const dispatch = useAppDispatch();
  const deepLinkQrCode = useSelector(getHomeDeepLinkQrCode);
  const canShow = useSelector(selectCanShowLowPriorityModal);

  const onClose = useCallback(() => {
    dispatch(clearHomeDeepLinkQrCode());
  }, [dispatch]);

  if (!canShow || !deepLinkQrCode) {
    return null;
  }

  return (
    <Modal data-testid="deeplink-qrcode-modal" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        size={ModalContentSize.Md}
        modalDialogProps={{
          paddingTop: 0,
          paddingBottom: 0,
          style: {
            height: 'auto',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <ModalHeader
          closeButtonProps={{
            className: 'absolute z-10',
            style: {
              top: '24px',
              right: '12px',
            },
          }}
          paddingBottom={0}
          onClose={onClose}
        />
        <DeeplinkQRCode
          title={t(deepLinkQrCode.titleKey)}
          description={t(deepLinkQrCode.descriptionKey)}
          data={deepLinkQrCode.deeplinkUrl}
          onDone={onClose}
          doneLabel={t('done')}
          testId="deeplink-qrcode-container"
        />
      </ModalContent>
    </Modal>
  );
}
