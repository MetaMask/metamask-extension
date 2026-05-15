import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { AlignItems } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';

const DownloadMobileAppModal = ({ onClose }: { onClose: () => void }) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="download-mobile-app-modal"
      data-testid="download-mobile-app-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          {t('downloadMetaMaskMobileTitle')}
        </ModalHeader>
        <Box
          paddingLeft={4}
          paddingRight={4}
          flexDirection={BoxFlexDirection.Column}
          gap={2}
        >
          <Text variant={TextVariant.BodyMd}>
            {t('downloadMetaMaskMobileDescription')}
          </Text>
          <Box
            className="mx-auto w-fit rounded-2xl"
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            borderWidth={1}
            padding={3}
            borderColor={BoxBorderColor.BorderMuted}
          >
            <img
              src="images/download-mobile-app-qr-code.png"
              width={300}
              height={300}
              alt={t('downloadMetaMaskMobileTitle')}
              className="block"
            />
          </Box>
          <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
            {t('downloadMetaMaskMobileQrNote')}
          </Text>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default DownloadMobileAppModal;
