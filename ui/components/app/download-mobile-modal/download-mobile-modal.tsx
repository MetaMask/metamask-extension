import React from 'react';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
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
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          <Text variant={TextVariant.bodyMd}>
            {t('downloadMetaMaskMobileDescription')}
          </Text>
          <Box
            className="download-mobile-app-modal__qr-code-wrapper"
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            borderWidth={1}
            paddingInline={0}
            paddingTop={3}
            paddingBottom={3}
            borderColor={BorderColor.borderMuted}
            style={{
              borderRadius: '16px',
            }}
          >
            <img
              src="images/download-mobile-app-qr-code.png"
              width={300}
              height={300}
              alt={t('downloadMetaMaskMobileTitle')}
              style={{
                alignSelf: 'center',
              }}
            />
          </Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
          ></Box>
          <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
            {t('downloadMetaMaskMobileQrNote')}
          </Text>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default DownloadMobileAppModal;
